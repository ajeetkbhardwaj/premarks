import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import zlib from 'node:zlib';
import { lintDeck, contrastRatio } from '../src/server/lintDeck.ts';
import { compileDeck, sanitizeUntrustedMarkdownHtml } from '../src/server/renderService.ts';
import {
  applySlideEditById,
  ensureSlideIds,
  splitDeckDocumentRaw,
} from '../src/server/slideIds.ts';
import { analyzeSlideDensity, splitCrowdedSlide } from '../src/utils/deckTransformers.ts';

const require = createRequire(import.meta.url);
const { TEMPLATES } = require('../lib/templates.js');
const { THEMES } = require('../lib/themes.js');
const { generatePptxBuffer } = require('../lib/pptxExporter.js');
const { buildZipBuffer, buildTgzBuffer } = require('../lib/archiveBuilder.js');

/**
 * Minimal PKZIP local-header reader to verify generated .pptx entries and XML payloads.
 */
function readZipEntries(buf: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  let offset = 0;

  while (offset + 30 <= buf.length) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;

    const flags = buf.readUInt16LE(offset + 6);
    const method = buf.readUInt16LE(offset + 8);
    let compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString('utf8');
    const dataStart = offset + 30 + nameLen + extraLen;

    // Handle streaming data descriptors (bit 3) emitted by JSZip/PptxGenJS
    if ((flags & 0x08) !== 0 && compSize === 0) {
      let scan = dataStart;
      while (scan + 16 <= buf.length) {
        if (buf.readUInt32LE(scan) === 0x08074b50) {
          compSize = buf.readUInt32LE(scan + 8);
          const raw = buf.subarray(dataStart, scan);
          const payload = method === 8 ? zlib.inflateRawSync(raw) : raw;
          entries.set(name, payload);
          offset = scan + 16;
          break;
        }
        scan += 1;
      }
      if (scan + 16 > buf.length) break;
    } else {
      const raw = buf.subarray(dataStart, dataStart + compSize);
      const payload = method === 8 ? zlib.inflateRawSync(raw) : raw;
      entries.set(name, payload);
      offset = dataStart + compSize;
    }
  }

  return entries;
}

test('splitDeckDocumentRaw ignores horizontal rules inside fenced code blocks', () => {
  const md = `---
marp: true
theme: anime
---

# Slide One

\`\`\`yaml
---
key: value
---
\`\`\`

---

# Slide Two
Content here
`;
  const split = splitDeckDocumentRaw(md);
  assert.equal(split.themeId, 'anime');
  assert.equal(split.rawSlides.length, 2);
  assert.ok(split.rawSlides[0].includes('key: value'));
  assert.ok(split.rawSlides[1].includes('# Slide Two'));
});

test('ensureSlideIds and applySlideEditById mutate slides deterministically by UUID', () => {
  const initial = `---
marp: true
theme: theorem
---

# Intro
Welcome

---

# Second
Details
`;
  const ensured1 = ensureSlideIds(initial);
  assert.equal(ensured1.addedCount, 2);
  const ensured2 = ensureSlideIds(ensured1.markdown);
  assert.equal(ensured2.addedCount, 0);

  const firstId = ensured1.parsed.slides[0].id;
  const secondId = ensured1.parsed.slides[1].id;

  const updated = applySlideEditById(ensured1.markdown, secondId, {
    action: 'update',
    markdownBody: '# Updated Second\n\nNew concise point.',
    speakerNotes: 'Explain updated methodology.',
  });
  assert.ok(updated.markdown.includes('Updated Second'));
  assert.ok(updated.markdown.includes('Explain updated methodology.'));

  const inserted = applySlideEditById(updated.markdown, firstId, {
    action: 'insert_after',
    markdownBody: '# Inserted Bridge Slide',
    layoutClass: 'section',
  });
  assert.equal(inserted.slides.length, 3);
  assert.equal(inserted.slides[1].id, inserted.updatedSlideId);

  const moved = applySlideEditById(inserted.markdown, inserted.updatedSlideId, {
    action: 'move',
    targetPosition: 2,
  });
  assert.equal(moved.slides[2].id, inserted.updatedSlideId);

  const deleted = applySlideEditById(moved.markdown, inserted.updatedSlideId, {
    action: 'delete',
  });
  assert.equal(deleted.slides.length, 2);
});

test('lintDeck flags density, overflow, contrast, missing alt text, and applies autoFix', () => {
  const longWords = Array.from({ length: 185 }, (_, i) => `token${i}`).join(' ');
  const md = `---
marp: true
theme: swiss
style: |
  section {
    --bg: #ffffff;
    --ink: #e5e7eb;
  }
---

![](https://example.com/diagram.png)

${longWords}
`;
  const report = lintDeck(md, { autoFix: true });
  assert.equal(report.passed, false);
  assert.ok(report.deckScore < 85);

  const rules = new Set(report.issues.map((i) => i.rule));
  assert.ok(rules.has('missing-slide-ids'));
  assert.ok(rules.has('contrast-ratio'));
  assert.ok(rules.has('density-words'));
  assert.ok(rules.has('missing-alt-text'));
  assert.ok(rules.has('heading-hierarchy'));

  assert.ok(report.fixedMarkdown);
  assert.ok(report.fixedMarkdown!.includes('![Illustration for Slide 1](https://example.com/diagram.png)'));

  const ratio = contrastRatio('#ffffff', '#0f172a');
  assert.ok(ratio !== null && ratio > 15);
});

test('sanitizeUntrustedMarkdownHtml removes XSS vectors while preserving safe Marp layout HTML', () => {
  const dirty = `---
marp: true
---

<span class="eyebrow">Safe Label</span>
<div class="row" onclick="alert(1)">
  <a href="javascript:alert(2)">Link</a>
  <script>window.pwned = true;</script>
  <iframe src="https://evil.example"></iframe>
</div>

\`\`\`html
<script>console.log("inside code block stays untouched");</script>
\`\`\`
`;
  const clean = sanitizeUntrustedMarkdownHtml(dirty);
  assert.ok(clean.includes('<span class="eyebrow">Safe Label</span>'));
  assert.ok(!clean.includes('<iframe'));
  assert.ok(!clean.includes('onclick='));
  assert.ok(!clean.includes('javascript:'));
  assert.ok(!clean.includes('window.pwned'));
  assert.ok(clean.includes('inside code block stays untouched'));
});

test('compileDeck renders every catalog template across themes', () => {
  assert.ok(THEMES.length >= 14, `Expected at least 14 themes, got ${THEMES.length}`);
  assert.ok(TEMPLATES.length >= 24, `Expected at least 24 templates, got ${TEMPLATES.length}`);

  const starterCount = TEMPLATES.filter((t: { field: string }) => t.field === 'Basic & Starter').length;
  assert.ok(starterCount >= 4, 'Expected at least 4 Basic & Starter templates');

  for (const tpl of TEMPLATES) {
    const compiled = compileDeck(tpl.markdown, tpl.themeId);
    assert.ok(compiled.slideCount >= 1, `Expected slides for ${tpl.id}`);
    assert.ok(compiled.css.length > 50, `Expected CSS for ${tpl.id}`);
    assert.ok(compiled.css.includes('.bento-grid'), `Expected Bento grid CSS in ${tpl.id}`);
    assert.ok(compiled.css.includes('.swot-grid'), `Expected SWOT grid CSS in ${tpl.id}`);
    assert.ok(compiled.css.includes('.beamer-block'), `Expected Beamer block CSS in ${tpl.id}`);
    for (let i = 0; i < compiled.slides.length; i++) {
      const plain = compiled.slides[i]
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<style[\s\S]*?<\/style>/g, '')
        .replace(/<[^>]+>/g, ' ');
      assert.ok(!/###\s|\*\*/.test(plain), `Unexpected unparsed Markdown in ${tpl.id} slide ${i + 1}`);
    }
  }
});

test('generatePptxBuffer embeds slides, MathJax SVGs, Mermaid summary, tables, and clean speaker notes', async () => {
  const md = `---
marp: true
theme: theorem
math: mathjax
---

<!-- pm-slide-id: s-11111111-1111-4111-8111-111111111111 -->
<!-- _class: lead -->

# Maxwell Equations Review

## Vector Calculus Foundations

<!-- Speaker note: emphasize curl and divergence operators. -->

---

<!-- pm-slide-id: s-22222222-2222-4222-8222-222222222222 -->

# Gauss Law

- Relates electric flux to enclosed charge

$$
\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}
$$

---

<!-- pm-slide-id: s-33333333-3333-4333-8333-333333333333 -->

# Architecture Flow

\`\`\`mermaid
flowchart LR
  Input --> Solver --> Output
\`\`\`

---

<!-- pm-slide-id: s-44444444-4444-4444-8444-444444444444 -->

# Benchmark Metrics

| Engine | Throughput |
|---|---|
| Marp Worker | 140 decks/min |
`;

  const compiled = compileDeck(md, 'theorem');
  const buf: Buffer = await generatePptxBuffer(md, 'theorem', 'Physics Deck', {
    compiledSlides: compiled.slides,
  });

  assert.ok(Buffer.isBuffer(buf));
  assert.ok(buf.length > 10_000);

  const entries = readZipEntries(buf);
  assert.ok(entries.has('ppt/slides/slide1.xml'));
  assert.ok(entries.has('ppt/slides/slide2.xml'));
  assert.ok(entries.has('ppt/slides/slide3.xml'));
  assert.ok(entries.has('ppt/slides/slide4.xml'));

  // Verify embedded MathJax SVG exists in ppt/media/
  const mediaSvgs = [...entries.keys()].filter((k) => k.startsWith('ppt/media/') && k.endsWith('.svg'));
  assert.ok(mediaSvgs.length >= 1, 'Expected MathJax SVG embedded in ppt/media/*.svg');

  // Verify notes XML exists and does NOT contain pm-slide-id comment leakage
  const noteKeys = [...entries.keys()].filter((k) => k.startsWith('ppt/notesSlides/notesSlide'));
  assert.ok(noteKeys.length >= 1, 'Expected presenter speaker notes XML');
  const notesXml = entries.get(noteKeys[0])!.toString('utf8');
  assert.ok(notesXml.includes('curl and divergence operators'));
  assert.ok(!notesXml.includes('pm-slide-id'));

  // Verify Mermaid formatted card text
  const slide3Xml = entries.get('ppt/slides/slide3.xml')!.toString('utf8');
  assert.ok(slide3Xml.includes('DIAGRAM'));
});

test('archiveBuilder and deckTransformers produce valid archives and slide splits', () => {
  const zip = buildZipBuffer([{ name: 'hello.txt', content: 'premarks' }]);
  assert.equal(zip.readUInt16LE(0), 0x4b50);

  const tgz = buildTgzBuffer([{ name: 'package/hello.txt', content: 'premarks', mode: 0o644 }]);
  assert.equal(tgz[0], 0x1f);
  assert.equal(tgz[1], 0x8b);

  const crowded = `# Heavy Slide
- One
- Two
- Three
- Four
- Five
- Six
- Seven
- Eight
`;
  const density = analyzeSlideDensity(crowded);
  assert.ok(density.words > 0);
  const split = splitCrowdedSlide(crowded);
  assert.ok(split && split.length === 2);
});

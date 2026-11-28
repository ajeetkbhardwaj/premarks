import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Marp } from '@marp-team/marp-core';
import { marpCli } from '@marp-team/marp-cli';

const require = createRequire(import.meta.url);
const { THEMES, THEME_MAP } = require('../../lib/themes.js');
const { generatePptxBuffer } = require('../../lib/pptxExporter.js');

const ROOT_DIR = process.cwd();
const FRAGMENTS_JS = fs.readFileSync(path.join(ROOT_DIR, 'fragments.js'), 'utf8');

const MERMAID_RUNTIME_SNIPPET = `<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
const blocks = document.querySelectorAll('pre code.language-mermaid');
let idx = 0;
for (const codeEl of blocks) {
  const pre = codeEl.closest('pre');
  if (!pre) continue;
  try {
    const { svg } = await mermaid.render('premarks-mmd-' + (++idx), codeEl.textContent || '');
    const wrap = document.createElement('div');
    wrap.className = 'mermaid-diagram';
    wrap.innerHTML = svg;
    pre.replaceWith(wrap);
  } catch (e) {
    console.warn('Mermaid render skipped:', e);
  }
}
</script>`;

function compileWithMarp(markdown: string, themeId: string) {
  const safeThemeId = THEME_MAP.has(themeId) ? themeId : 'anime';
  const marp = new Marp({
    html: true,
    inlineSVG: true,
    math: 'mathjax',
  });
  for (const theme of THEMES) {
    try {
      marp.themeSet.add(theme.css);
    } catch {
      // Skip malformed theme
    }
  }
  marp.themeSet.default = marp.themeSet.get(safeThemeId, true) || marp.themeSet.default;
  const { html, css, comments } = marp.render(markdown, { htmlAsArray: true });
  return { slides: html, css, comments, slideCount: html.length, themeId: safeThemeId };
}

async function runHtmlExport(markdown: string, themeId: string) {
  const safeTheme = THEME_MAP.get(themeId) || THEME_MAP.get('anime');
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'premarks-worker-'));
  try {
    const themePath = path.join(tmpDir, 'theme.css');
    const mdPath = path.join(tmpDir, 'deck.md');
    const outPath = path.join(tmpDir, 'deck.html');

    await fsp.writeFile(themePath, safeTheme.css, 'utf8');
    await fsp.writeFile(mdPath, markdown, 'utf8');

    const exitCode = await marpCli([
      '--no-stdin',
      '--theme-set',
      themePath,
      '--theme',
      safeTheme.id,
      '--html',
      mdPath,
      '-o',
      outPath,
    ]);

    if (exitCode !== 0) {
      throw new Error(`Marp CLI exited with code ${exitCode}`);
    }

    let html = await fsp.readFile(outPath, 'utf8');
    const fragmentCounter = '<div class="fragment-counter" aria-live="polite"></div>';
    const scriptTag = `<script>\n${FRAGMENTS_JS}\n</script>`;

    if (!html.includes(fragmentCounter)) {
      html = html.replace('</body>', `${fragmentCounter}\n</body>`);
    }
    if (!html.includes('FRAGMENT_ATTR')) {
      html = html.replace('</body>', `${scriptTag}\n</body>`);
    }
    if (html.includes('language-mermaid')) {
      html = html.replace('</body>', `${MERMAID_RUNTIME_SNIPPET}\n</body>`);
    }
    return html;
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function main() {
  const payloadFile = process.argv[2];
  if (!payloadFile) {
    throw new Error('Missing worker payload path');
  }
  const job = JSON.parse(await fsp.readFile(payloadFile, 'utf8')) as {
    kind: 'html' | 'pptx';
    markdown: string;
    themeId: string;
    title: string;
    outFile: string;
  };

  if (job.kind === 'html') {
    const html = await runHtmlExport(job.markdown, job.themeId);
    await fsp.writeFile(job.outFile, html, 'utf8');
  } else if (job.kind === 'pptx') {
    const compiled = compileWithMarp(job.markdown, job.themeId);
    const buf = await generatePptxBuffer(job.markdown, job.themeId, job.title || 'Presentation', {
      compiledSlides: compiled.slides,
    });
    await fsp.writeFile(job.outFile, Buffer.from(buf));
  } else {
    throw new Error(`Unsupported worker job kind: ${String(job.kind)}`);
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});

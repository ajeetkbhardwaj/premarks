import crypto from 'node:crypto';

export interface SlideWithId {
  id: string;
  position: number;
  title: string;
  layoutClass: string;
  body: string;
  speakerNotes: string;
  raw: string;
}

export interface ParsedDeckDocument {
  frontmatter: string;
  themeId: string;
  slides: SlideWithId[];
}

const SLIDE_ID_RE = /<!--\s*pm-slide-id:\s*([a-zA-Z0-9-]+)\s*-->/i;

export function makeSlideUuid(): string {
  return `s-${crypto.randomUUID()}`;
}

export function splitDeckDocumentRaw(markdown: string): {
  frontmatter: string;
  themeId: string;
  rawSlides: string[];
} {
  const normalized = String(markdown || '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  let i = 0;
  let frontmatter = '';

  if (lines[0]?.trim() === '---') {
    const fmLines = [lines[0]];
    i = 1;
    while (i < lines.length && lines[i].trim() !== '---') {
      fmLines.push(lines[i]);
      i += 1;
    }
    if (i < lines.length && lines[i].trim() === '---') {
      fmLines.push(lines[i]);
      i += 1;
      frontmatter = fmLines.join('\n');
    } else {
      i = 0;
    }
  }

  const themeMatch = frontmatter.match(/^theme:\s*([a-zA-Z0-9_-]+)/m);
  const themeId = themeMatch?.[1] || 'anime';

  const rawSlides: string[] = [];
  let buf: string[] = [];
  let inFence = false;
  let fenceChar = '';

  for (; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      const ch = trimmed[0];
      if (!inFence) {
        inFence = true;
        fenceChar = ch;
      } else if (fenceChar === ch) {
        inFence = false;
        fenceChar = '';
      }
    }
    if (!inFence && trimmed === '---') {
      rawSlides.push(buf.join('\n').trim());
      buf = [];
    } else {
      buf.push(line);
    }
  }
  const tail = buf.join('\n').trim();
  if (tail || rawSlides.length === 0) {
    rawSlides.push(tail);
  }

  return {
    frontmatter:
      frontmatter ||
      '---\nmarp: true\ntheme: anime\nsize: 16:9\npaginate: true\nmath: mathjax\n---',
    themeId,
    rawSlides,
  };
}

function extractSlideMetadata(rawSlide: string, fallbackIndex: number): {
  id: string;
  hasExplicitId: boolean;
  title: string;
  layoutClass: string;
  speakerNotes: string;
  bodyWithoutId: string;
} {
  const idMatch = rawSlide.match(SLIDE_ID_RE);
  const hasExplicitId = Boolean(idMatch);
  const id = idMatch?.[1] || makeSlideUuid();

  const bodyWithoutId = rawSlide.replace(/<!--\s*pm-slide-id:\s*[a-zA-Z0-9-]+\s*-->\s*\n?/gi, '').trim();

  const classMatch = bodyWithoutId.match(/<!--\s*_class:\s*([^>]+?)-->/);
  const layoutClass =
    classMatch?.[1]?.replace(/\banimate-in\b/g, '').trim() || 'standard';

  const headingMatch = bodyWithoutId.match(/^#{1,2}\s+(.+)$/m);
  const title = headingMatch?.[1]?.trim() || `Slide ${fallbackIndex + 1}`;

  const notes: string[] = [];
  bodyWithoutId.replace(/<!--([\s\S]*?)-->/g, (_, inner) => {
    const t = String(inner).trim();
    if (
      t &&
      !t.startsWith('_class:') &&
      !t.startsWith('transition:') &&
      !t.startsWith('_transition:') &&
      !t.startsWith('pm-slide-id:')
    ) {
      notes.push(t);
    }
    return '';
  });

  return {
    id,
    hasExplicitId,
    title,
    layoutClass,
    speakerNotes: notes.join('\n'),
    bodyWithoutId,
  };
}

export function ensureSlideIds(markdown: string): {
  markdown: string;
  addedCount: number;
  parsed: ParsedDeckDocument;
} {
  const { frontmatter, themeId, rawSlides } = splitDeckDocumentRaw(markdown);
  let addedCount = 0;
  const usedIds = new Set<string>();

  const slides: SlideWithId[] = rawSlides.map((raw, idx) => {
    const meta = extractSlideMetadata(raw, idx);
    let slideId = meta.id;
    if (!meta.hasExplicitId || usedIds.has(slideId)) {
      slideId = makeSlideUuid();
      addedCount += 1;
    }
    usedIds.add(slideId);

    const normalizedRaw = `<!-- pm-slide-id: ${slideId} -->\n${meta.bodyWithoutId}`.trim();
    return {
      id: slideId,
      position: idx,
      title: meta.title,
      layoutClass: meta.layoutClass,
      body: meta.bodyWithoutId,
      speakerNotes: meta.speakerNotes,
      raw: normalizedRaw,
    };
  });

  const rebuilt = `${frontmatter.trim()}\n\n${slides.map((s) => s.raw).join('\n\n---\n\n')}\n`;
  return {
    markdown: rebuilt,
    addedCount,
    parsed: {
      frontmatter: frontmatter.trim(),
      themeId,
      slides,
    },
  };
}

export function parseSlidesWithIds(markdown: string): ParsedDeckDocument {
  return ensureSlideIds(markdown).parsed;
}

export function joinSlidesWithIds(frontmatter: string, slides: SlideWithId[]): string {
  const body = slides
    .map((s) => {
      const cleanBody = s.body.replace(/<!--\s*pm-slide-id:\s*[a-zA-Z0-9-]+\s*-->\s*\n?/gi, '').trim();
      return `<!-- pm-slide-id: ${s.id} -->\n${cleanBody}`;
    })
    .join('\n\n---\n\n');
  return `${frontmatter.trim()}\n\n${body}\n`;
}

export interface SlideEditOperation {
  action: 'update' | 'insert_after' | 'delete' | 'move';
  markdownBody?: string;
  speakerNotes?: string;
  layoutClass?: string;
  targetPosition?: number;
}

export function applySlideEditById(
  markdown: string,
  slideId: string,
  op: SlideEditOperation,
): { markdown: string; updatedSlideId: string; slides: SlideWithId[] } {
  const ensured = ensureSlideIds(markdown);
  const list = [...ensured.parsed.slides];
  const idx = list.findIndex((s) => s.id === slideId);
  if (idx === -1) {
    throw new Error(`Slide ID "${slideId}" not found in deck.`);
  }

  if (op.action === 'delete') {
    if (list.length <= 1) {
      throw new Error('Cannot delete the only remaining slide in a deck.');
    }
    list.splice(idx, 1);
    const nextMd = joinSlidesWithIds(ensured.parsed.frontmatter, list);
    return {
      markdown: nextMd,
      updatedSlideId: list[Math.max(0, idx - 1)].id,
      slides: parseSlidesWithIds(nextMd).slides,
    };
  }

  if (op.action === 'move') {
    const dest = Math.max(0, Math.min(list.length - 1, Number(op.targetPosition ?? idx)));
    const [moved] = list.splice(idx, 1);
    list.splice(dest, 0, moved);
    const nextMd = joinSlidesWithIds(ensured.parsed.frontmatter, list);
    return {
      markdown: nextMd,
      updatedSlideId: moved.id,
      slides: parseSlidesWithIds(nextMd).slides,
    };
  }

  if (op.action === 'insert_after') {
    const newId = makeSlideUuid();
    const rawContent = (op.markdownBody || '# New Slide\n\n- Key point').trim();
    const layoutLine = op.layoutClass
      ? `<!-- _class: ${op.layoutClass} animate-in -->\n\n`
      : '<!-- _class: animate-in -->\n\n';
    const notesLine = op.speakerNotes?.trim() ? `\n\n<!-- ${op.speakerNotes.trim()} -->` : '';
    const finalBody = rawContent.includes('_class:')
      ? `${rawContent}${notesLine}`
      : `${layoutLine}${rawContent}${notesLine}`;

    list.splice(idx + 1, 0, {
      id: newId,
      position: idx + 1,
      title: 'New Slide',
      layoutClass: op.layoutClass || 'standard',
      body: finalBody,
      speakerNotes: op.speakerNotes || '',
      raw: `<!-- pm-slide-id: ${newId} -->\n${finalBody}`,
    });
    const nextMd = joinSlidesWithIds(ensured.parsed.frontmatter, list);
    return {
      markdown: nextMd,
      updatedSlideId: newId,
      slides: parseSlidesWithIds(nextMd).slides,
    };
  }

  // action === 'update'
  const existing = list[idx];
  let nextBody = op.markdownBody !== undefined ? op.markdownBody.trim() : existing.body;

  if (op.layoutClass !== undefined) {
    const classDirective =
      op.layoutClass && op.layoutClass !== 'standard'
        ? `<!-- _class: ${op.layoutClass} animate-in -->`
        : '<!-- _class: animate-in -->';
    if (/<!--\s*_class:[^>]+-->/.test(nextBody)) {
      nextBody = nextBody.replace(/<!--\s*_class:[^>]+-->/, classDirective);
    } else {
      nextBody = `${classDirective}\n\n${nextBody}`;
    }
  }

  if (op.speakerNotes !== undefined) {
    // Replace existing non-directive HTML comments with new speaker notes
    nextBody = nextBody.replace(/<!--([\s\S]*?)-->\s*\n?/g, (full, inner) => {
      const t = String(inner).trim();
      if (
        t.startsWith('_class:') ||
        t.startsWith('transition:') ||
        t.startsWith('_transition:')
      ) {
        return full;
      }
      return '';
    }).trim();
    if (op.speakerNotes.trim()) {
      nextBody = `${nextBody}\n\n<!-- ${op.speakerNotes.trim()} -->`;
    }
  }

  list[idx] = {
    ...existing,
    body: nextBody,
  };
  const nextMd = joinSlidesWithIds(ensured.parsed.frontmatter, list);
  return {
    markdown: nextMd,
    updatedSlideId: existing.id,
    slides: parseSlidesWithIds(nextMd).slides,
  };
}

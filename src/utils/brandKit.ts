import type { BrandKitConfig } from '../types';
import {
  extractFrontmatterDirective,
  joinMarpDocument,
  splitMarpDocument,
} from './marpDocument';

export const BRAND_FONT_CHOICES: { label: string; cssFamily: string }[] = [
  { label: 'Theme Default', cssFamily: '' },
  { label: 'Plus Jakarta Sans', cssFamily: "'Plus Jakarta Sans', sans-serif" },
  { label: 'DM Sans', cssFamily: "'DM Sans', sans-serif" },
  { label: 'Source Serif 4', cssFamily: "'Source Serif 4', Georgia, serif" },
  { label: 'JetBrains Mono', cssFamily: "'JetBrains Mono', monospace" },
];

export function extractBrandKit(markdown: string): BrandKitConfig {
  const headerText = extractFrontmatterDirective(markdown, 'header') || '';
  const footerText = extractFrontmatterDirective(markdown, 'footer') || '';
  const paginateRaw = extractFrontmatterDirective(markdown, 'paginate');
  const paginate = paginateRaw !== 'false';

  const { frontmatter } = splitMarpDocument(markdown);
  const accentMatch = frontmatter.match(/--accent:\s*(#[0-9a-fA-F]{3,8})/);
  const bgMatch = frontmatter.match(/--bg:\s*(#[0-9a-fA-F]{3,8})/);
  const inkMatch = frontmatter.match(/--ink:\s*(#[0-9a-fA-F]{3,8})/);
  const fontMatch = frontmatter.match(/section\s*\{\s*font-family:\s*([^;]+);/);
  const logoMatch = frontmatter.match(/--brand-logo:\s*url\(['"]?([^'")]+)['"]?\)/);

  return {
    headerText,
    footerText,
    paginate,
    accentColor: accentMatch?.[1] || '',
    bgColor: bgMatch?.[1] || '',
    inkColor: inkMatch?.[1] || '',
    fontChoice: fontMatch?.[1]?.trim() || '',
    logoDataUrl: logoMatch?.[1] || '',
  };
}

export function applyBrandKit(markdown: string, config: BrandKitConfig): string {
  const { frontmatter, slides } = splitMarpDocument(markdown);
  const bodies = slides.map((s) => s.rawBody);

  // Parse existing YAML lines without style block
  const rawLines = frontmatter.trim()
    ? frontmatter.trim().split('\n').slice(1, -1)
    : ['marp: true', 'size: 16:9', 'math: mathjax'];

  const filteredLines: string[] = [];
  let skippingStyle = false;

  for (const line of rawLines) {
    if (/^style\s*:/.test(line)) {
      skippingStyle = true;
      continue;
    }
    if (skippingStyle) {
      if (/^\s+/.test(line) || line.trim() === '') {
        continue;
      }
      skippingStyle = false;
    }
    if (/^(header|footer|paginate)\s*:/.test(line.trim())) {
      continue;
    }
    filteredLines.push(line);
  }

  filteredLines.push(`paginate: ${config.paginate ? 'true' : 'false'}`);
  if (config.headerText.trim()) {
    filteredLines.push(`header: '${config.headerText.replace(/'/g, "''")}'`);
  }
  if (config.footerText.trim()) {
    filteredLines.push(`footer: '${config.footerText.replace(/'/g, "''")}'`);
  }

  const rootVars: string[] = [];
  if (config.accentColor) rootVars.push(`--accent: ${config.accentColor};`);
  if (config.bgColor) rootVars.push(`--bg: ${config.bgColor};`);
  if (config.inkColor) rootVars.push(`--ink: ${config.inkColor};`);
  if (config.logoDataUrl) {
    const safeUrl = config.logoDataUrl.replace(/['"()\\\n\r]/g, '');
    rootVars.push(`--brand-logo: url('${safeUrl}');`);
  }

  const styleLines: string[] = [];
  if (rootVars.length > 0) {
    styleLines.push(`  :root { ${rootVars.join(' ')} }`);
  }
  if (config.fontChoice) {
    styleLines.push(`  section { font-family: ${config.fontChoice}; }`);
  }
  if (config.logoDataUrl) {
    styleLines.push(
      `  section::after { content: ''; position: absolute; top: 14px; right: 24px; width: 28px; height: 28px; background-image: var(--brand-logo); background-size: contain; background-repeat: no-repeat; background-position: center; opacity: 0.85; }`,
    );
  }

  if (styleLines.length > 0) {
    filteredLines.push('style: |');
    filteredLines.push(...styleLines);
  }

  const nextFm = ['---', ...filteredLines, '---'].join('\n');
  return joinMarpDocument(nextFm, bodies);
}

export interface VisualSlideFields {
  layoutClass: string;
  entranceAnim: string;
  transition: string;
  eyebrow: string;
  heading: string;
  body: string;
  notes: string;
  slideId?: string;
}

const ENTRANCE_ANIM_CLASSES = [
  'animate-in',
  'animate-zoom',
  'animate-left',
  'animate-right',
  'animate-blur',
  'animate-pop',
];

export function parseVisualSlideFields(rawBody: string): VisualSlideFields {
  let working = rawBody.trim();
  let layoutClass = 'standard';
  let entranceAnim = 'animate-in';
  let transition = '';
  let slideId: string | undefined;
  const notes: string[] = [];

  working = working.replace(/<!--([\s\S]*?)-->\n?/g, (_, inner) => {
    const t = inner.trim();
    const idMatch = t.match(/^pm-slide-id:\s*([a-zA-Z0-9-]+)$/i);
    if (idMatch) {
      slideId = idMatch[1];
      return '';
    }
    const classMatch = t.match(/^_class:\s*(.+)$/);
    if (classMatch) {
      const tokens: string[] = classMatch[1].trim().split(/\s+/).filter(Boolean);
      const foundAnim = tokens.find((tok: string) => ENTRANCE_ANIM_CLASSES.includes(tok));
      entranceAnim = foundAnim || 'none';
      const layoutTokens = tokens.filter((tok: string) => !ENTRANCE_ANIM_CLASSES.includes(tok));
      layoutClass = layoutTokens.join(' ') || 'standard';
      return '';
    }
    const transMatch = t.match(/^_?transition:\s*(.+)$/);
    if (transMatch) {
      transition = transMatch[1].trim();
      return '';
    }
    notes.push(t);
    return '';
  });

  working = working.trim();

  let eyebrow = '';
  const eyebrowMatch = working.match(/^<span class="eyebrow">([\s\S]*?)<\/span>\s*\n*/);
  if (eyebrowMatch) {
    eyebrow = eyebrowMatch[1].trim();
    working = working.slice(eyebrowMatch[0].length).trim();
  }

  let heading = '';
  const headingMatch = working.match(/^#\s+(.+)\n*/);
  if (headingMatch) {
    heading = headingMatch[1].trim();
    working = working.slice(headingMatch[0].length).trim();
  }

  return {
    layoutClass,
    entranceAnim,
    transition,
    eyebrow,
    heading,
    body: working,
    notes: notes.join('\n'),
    slideId,
  };
}

export function serializeVisualSlideFields(fields: VisualSlideFields): string {
  const parts: string[] = [];

  if (fields.slideId) {
    parts.push(`<!-- pm-slide-id: ${fields.slideId} -->`);
  }
  if (fields.transition.trim()) {
    parts.push(`<!-- transition: ${fields.transition.trim()} -->`);
  }

  const classTokens: string[] = [];
  if (fields.layoutClass && fields.layoutClass !== 'standard') {
    classTokens.push(fields.layoutClass);
  }
  if (fields.entranceAnim && fields.entranceAnim !== 'none') {
    classTokens.push(fields.entranceAnim);
  }
  if (classTokens.length > 0) {
    parts.push(`<!-- _class: ${classTokens.join(' ')} -->`);
  }

  if (fields.eyebrow.trim()) {
    parts.push(`\n<span class="eyebrow">${fields.eyebrow.trim()}</span>`);
  }
  if (fields.heading.trim()) {
    parts.push(`\n# ${fields.heading.trim()}`);
  }
  if (fields.body.trim()) {
    parts.push(`\n${fields.body.trim()}`);
  }
  if (fields.notes.trim()) {
    parts.push(`\n<!-- ${fields.notes.trim()} -->`);
  }

  return parts.join('\n').trim();
}

export const STEM_EQUATIONS: { label: string; latex: string }[] = [
  { label: 'Gaussian Integral', latex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}' },
  { label: 'Bayes Theorem', latex: 'P(A \\mid B) = \\frac{P(B \\mid A)P(A)}{P(B)}' },
  { label: 'Matrix Form', latex: 'A = \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}' },
  { label: 'Schrödinger', latex: 'i\\hbar \\frac{\\partial}{\\partial t}|\\psi(t)\\rangle = \\hat{H}|\\psi(t)\\rangle' },
  { label: 'Gradient Descent', latex: '\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_t)' },
  { label: 'Fourier Transform', latex: '\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)e^{-2\\pi i x \\xi}\\,dx' },
];

export const MERMAID_SNIPPETS: { label: string; code: string }[] = [
  {
    label: 'System Flowchart',
    code: `\n\`\`\`mermaid\nflowchart LR\n    A[Input Markdown] --> B[Marp Compiler]\n    B --> C{Export Target}\n    C -->|Browser| D[Animated HTML]\n    C -->|Deck| E[PowerPoint PPTX]\n    C -->|Print| F[Vector PDF]\n\`\`\`\n`,
  },
  {
    label: 'Sequence Diagram',
    code: `\n\`\`\`mermaid\nsequenceDiagram\n    participant U as Presenter\n    participant A as App API\n    participant M as Marp Engine\n    U->>A: Submit Markdown + Theme\n    A->>M: Compile SVG & MathJax\n    M-->>U: Live 16:9 Slides\n\`\`\`\n`,
  },
  {
    label: 'State Pipeline',
    code: `\n\`\`\`mermaid\nstateDiagram-v2\n    [*] --> Draft\n    Draft --> BrandStyled : Apply Brand Kit\n    BrandStyled --> Reviewed : Step Fragments\n    Reviewed --> Published : Share Link / Export\n\`\`\`\n`,
  },
];

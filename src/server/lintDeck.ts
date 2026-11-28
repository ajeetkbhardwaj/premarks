import { ensureSlideIds, joinSlidesWithIds, parseSlidesWithIds } from './slideIds.ts';

export type LintSeverity = 'error' | 'warning' | 'info';

export interface LintIssue {
  id: string;
  slideId: string | null;
  slideIndex: number | null;
  rule:
    | 'density-words'
    | 'overflow-risk'
    | 'missing-alt-text'
    | 'contrast-ratio'
    | 'heading-hierarchy'
    | 'missing-slide-ids';
  severity: LintSeverity;
  message: string;
  suggestion: string;
  autoFixable: boolean;
}

export interface LintDeckReport {
  deckScore: number;
  slideCount: number;
  passed: boolean;
  issues: LintIssue[];
  perSlideScores: Record<string, number>;
  fixedMarkdown?: string;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(hexA: string, hexB: string): number | null {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return null;
  const l1 = relativeLuminance(rgbA);
  const l2 = relativeLuminance(rgbB);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

function estimateVerticalUnits(body: string): number {
  const cleaned = body.replace(/<!--[\s\S]*?-->/g, '');
  const isMultiColumn =
    /\b(row|row-3|grid-2x2|bento-grid|kpi-grid|timeline|agenda-list|split|split-60-40|split-40-60|card-list|swot-grid)\b/.test(
      cleaned,
    );
  const lines = cleaned.split('\n');
  let units = 0;
  let inCode = false;

  for (const rawLine of lines) {
    const t = rawLine.trim();
    if (!t) continue;
    if (t.startsWith('```')) {
      inCode = !inCode;
      units += 28;
      continue;
    }
    if (inCode) {
      units += 22;
      continue;
    }
    // Ignore pure HTML container tags like <div class="card"> or </div>
    const withoutTags = t.replace(/<[^>]+>/g, '').trim();
    if (!withoutTags) continue;

    if (t.startsWith('# ')) units += 74;
    else if (t.startsWith('## ')) units += 52;
    else if (t.startsWith('### ')) units += 36;
    else if (t.startsWith('|')) units += 30;
    else if (t.startsWith('$$')) units += 50;
    else units += 28 + Math.floor(withoutTags.length / 85) * 24;
  }

  if (isMultiColumn && units > 120) {
    // Primary heading stays full-width (~74px); grid body shares horizontal columns (~2.1x density)
    return Math.round(74 + (units - 74) / 2.1);
  }
  return units;
}

export function lintDeck(
  markdown: string,
  options: { autoFix?: boolean } = {},
): LintDeckReport {
  const ensured = ensureSlideIds(markdown);
  const parsed = ensured.parsed;
  const issues: LintIssue[] = [];
  const perSlideScores: Record<string, number> = {};

  if (ensured.addedCount > 0) {
    issues.push({
      id: 'deck-slide-ids',
      slideId: null,
      slideIndex: null,
      rule: 'missing-slide-ids',
      severity: 'info',
      message: `${ensured.addedCount} slide(s) lacked stable pm-slide-id anchors.`,
      suggestion: 'Run ensureSlideIds or apply autoFix to persist immutable slide UUIDs.',
      autoFixable: true,
    });
  }

  // Check custom frontmatter contrast overrides if present
  const bgOverride = parsed.frontmatter.match(/--bg:\s*(#[0-9a-fA-F]{3,6})/)?.[1];
  const inkOverride = parsed.frontmatter.match(/--ink:\s*(#[0-9a-fA-F]{3,6})/)?.[1];
  if (bgOverride && inkOverride) {
    const ratio = contrastRatio(bgOverride, inkOverride);
    if (ratio !== null && ratio < 4.5) {
      issues.push({
        id: 'deck-contrast',
        slideId: null,
        slideIndex: null,
        rule: 'contrast-ratio',
        severity: 'error',
        message: `Brand Kit foreground ${inkOverride} on background ${bgOverride} has WCAG contrast ${ratio.toFixed(2)}:1 (minimum 4.5:1).`,
        suggestion: `Adjust --ink or --bg in Brand Kit to restore at least 4.5:1 contrast.`,
        autoFixable: false,
      });
    }
  }

  const fixedSlides = parsed.slides.map((slide, idx) => {
    let score = 100;
    let body = slide.body;

    // 1. Word density check
    const plain = body
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/```[\s\S]*?```/g, ' [code] ')
      .trim();
    const words = plain ? plain.split(/\s+/).length : 0;

    if (words > 175) {
      score -= 22;
      issues.push({
        id: `${slide.id}-density`,
        slideId: slide.id,
        slideIndex: idx,
        rule: 'density-words',
        severity: 'error',
        message: `Slide ${idx + 1} ("${slide.title}") has ${words} words, exceeding the 175-word ceiling.`,
        suggestion: 'Split this slide into two focused slides or condense bullets to <= 12 words each.',
        autoFixable: false,
      });
    } else if (words > 125) {
      score -= 10;
      issues.push({
        id: `${slide.id}-density`,
        slideId: slide.id,
        slideIndex: idx,
        rule: 'density-words',
        severity: 'warning',
        message: `Slide ${idx + 1} ("${slide.title}") is dense (${words} words; recommended <= 125).`,
        suggestion: 'Use a two-column split or move supporting detail into speaker notes.',
        autoFixable: false,
      });
    }

    // 2. Vertical overflow risk check (16:9 slide usable height ~560px)
    const verticalUnits = estimateVerticalUnits(body);
    if (verticalUnits > 590) {
      score -= 18;
      issues.push({
        id: `${slide.id}-overflow`,
        slideId: slide.id,
        slideIndex: idx,
        rule: 'overflow-risk',
        severity: 'error',
        message: `Slide ${idx + 1} ("${slide.title}") exceeds estimated 16:9 vertical budget (${verticalUnits}px vs 560px safe area).`,
        suggestion: 'Split bullets/code across two slides or switch to a two-column layout.',
        autoFixable: false,
      });
    }

    // 3. Missing image alt text check (auto-fixable)
    const emptyMdImgs = [...body.matchAll(/!\[\s*\]\(([^)]+)\)/g)];
    const emptyHtmlImgs = [...body.matchAll(/<img\b(?![^>]*\balt\s*=\s*["'][^"']+["'])[^>]*>/gi)];
    if (emptyMdImgs.length > 0 || emptyHtmlImgs.length > 0) {
      score -= 12;
      issues.push({
        id: `${slide.id}-alt`,
        slideId: slide.id,
        slideIndex: idx,
        rule: 'missing-alt-text',
        severity: 'warning',
        message: `Slide ${idx + 1} ("${slide.title}") has ${emptyMdImgs.length + emptyHtmlImgs.length} image(s) missing descriptive alt text.`,
        suggestion: 'Add concise alt descriptions to every Markdown/HTML image for screen readers.',
        autoFixable: true,
      });
      if (options.autoFix) {
        body = body.replace(/!\[\s*\]\(([^)]+)\)/g, `![Illustration for ${slide.title}]($1)`);
        body = body.replace(
          /<img\b(?![^>]*\balt=)([^>]*)>/gi,
          `<img alt="Visual for ${slide.title}"$1>`,
        );
      }
    }

    // 4. Heading hierarchy check
    const hasHeading = /^#{1,2}\s+.+/m.test(body);
    const hasH3WithoutH1orH2 = /^###\s+.+/m.test(body) && !hasHeading;
    if (!hasHeading && slide.layoutClass !== 'quote') {
      score -= hasH3WithoutH1orH2 ? 12 : 6;
      issues.push({
        id: `${slide.id}-heading`,
        slideId: slide.id,
        slideIndex: idx,
        rule: 'heading-hierarchy',
        severity: hasH3WithoutH1orH2 ? 'warning' : 'info',
        message: hasH3WithoutH1orH2
          ? `Slide ${idx + 1} uses ### subheadings without a primary # or ## slide title.`
          : `Slide ${idx + 1} is missing a primary # or ## heading.`,
        suggestion: 'Start the slide with a concise `# Slide Title` for hierarchy and screen readers.',
        autoFixable: false,
      });
    }

    perSlideScores[slide.id] = Math.max(0, score);
    return { ...slide, body };
  });

  const scoreValues = Object.values(perSlideScores);
  const avgSlideScore =
    scoreValues.length > 0
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 100;
  const contrastPenalty = issues.some((i) => i.rule === 'contrast-ratio') ? 15 : 0;
  const deckScore = Math.max(0, avgSlideScore - contrastPenalty);

  const report: LintDeckReport = {
    deckScore,
    slideCount: parsed.slides.length,
    passed: !issues.some((i) => i.severity === 'error'),
    issues,
    perSlideScores,
  };

  if (options.autoFix) {
    const fixedMd = joinSlidesWithIds(parsed.frontmatter, fixedSlides);
    report.fixedMarkdown = parseSlidesWithIds(fixedMd) ? fixedMd : ensured.markdown;
  }

  return report;
}

import type { ParsedSlide } from '../types';

/**
 * Splits a Marp Markdown document into frontmatter and individual slide bodies,
 * ignoring `---` lines inside fenced code blocks.
 */
export function splitMarpDocument(markdown: string): {
  frontmatter: string;
  slides: ParsedSlide[];
} {
  const lines = markdown.split('\n');
  let i = 0;
  let frontmatter = '';

  if (lines[0]?.trim() === '---') {
    i = 1;
    while (i < lines.length && lines[i].trim() !== '---') {
      i++;
    }
    if (i < lines.length && lines[i].trim() === '---') {
      frontmatter = lines.slice(0, i + 1).join('\n');
      i++;
    } else {
      i = 0;
    }
  }

  const slideChunks: { lines: string[]; startLine: number; endLine: number }[] = [];
  let currentLines: string[] = [];
  let chunkStart = i;
  let inFence = false;
  let fenceChar = '';

  for (; i < lines.length; i++) {
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
      slideChunks.push({
        lines: currentLines,
        startLine: chunkStart,
        endLine: i,
      });
      currentLines = [];
      chunkStart = i + 1;
    } else {
      currentLines.push(line);
    }
  }

  slideChunks.push({
    lines: currentLines,
    startLine: chunkStart,
    endLine: lines.length,
  });

  // Compute character offsets per line
  const lineOffsets: number[] = [];
  let acc = 0;
  for (const line of lines) {
    lineOffsets.push(acc);
    acc += line.length + 1;
  }

  const parsedSlides: ParsedSlide[] = slideChunks.map((chunk, idx) => {
    const rawBody = chunk.lines.join('\n');
    const idMatch = rawBody.match(/<!--\s*pm-slide-id:\s*([a-zA-Z0-9-]+)\s*-->/i);
    const headingMatch = rawBody.match(/^#{1,3}\s+(.+)$/m);
    const classMatch = rawBody.match(/<!--\s*_class:\s*([^->]+?)\s*-->/);
    const cleanHeading = headingMatch
      ? headingMatch[1].replace(/[`*_]/g, '').trim()
      : `Slide ${idx + 1}`;
    const layoutClass = classMatch ? classMatch[1].trim().split(/\s+/)[0] : 'standard';

    return {
      index: idx,
      id: idMatch?.[1],
      title: cleanHeading,
      layoutClass,
      rawBody,
      startOffset: lineOffsets[chunk.startLine] ?? 0,
      endOffset: lineOffsets[chunk.endLine] ?? markdown.length,
    };
  });

  return { frontmatter, slides: parsedSlides };
}

export function joinMarpDocument(frontmatter: string, slideBodies: string[]): string {
  const cleanBodies = slideBodies.map((b) => b.replace(/^\n+|\n+$/g, ''));
  const joinedSlides = cleanBodies.join('\n\n---\n\n');
  if (frontmatter.trim()) {
    return `${frontmatter.trim()}\n\n${joinedSlides}\n`;
  }
  return `${joinedSlides}\n`;
}

export function updateFrontmatterDirective(
  markdown: string,
  key: string,
  value: string,
): string {
  const { frontmatter, slides } = splitMarpDocument(markdown);
  const bodies = slides.map((s) => s.rawBody);

  if (!frontmatter.trim()) {
    const newFm = `---\nmarp: true\n${key}: ${value}\n---`;
    return joinMarpDocument(newFm, bodies);
  }

  const fmLines = frontmatter.split('\n');
  const inner = fmLines.slice(1, -1);
  const regex = new RegExp(`^${key}\\s*:.*$`);
  const existingIdx = inner.findIndex((line) => regex.test(line.trim()));

  if (existingIdx >= 0) {
    inner[existingIdx] = `${key}: ${value}`;
  } else {
    inner.push(`${key}: ${value}`);
  }

  return joinMarpDocument(['---', ...inner, '---'].join('\n'), bodies);
}

export function extractFrontmatterDirective(markdown: string, key: string): string | null {
  const { frontmatter } = splitMarpDocument(markdown);
  if (!frontmatter) return null;
  const regex = new RegExp(`^${key}\\s*:\\s*(.+)$`, 'm');
  const match = frontmatter.match(regex);
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
}

export function countSlideFragments(slideHtml: string): number {
  const matches = slideHtml.match(/data-fragment=/g);
  return matches ? matches.length : 0;
}

/**
 * Wraps a rendered Marp slide SVG + CSS into an isolated, self-contained HTML document
 * suitable for rendering inside a sandboxed 16:9 iframe without style leakage.
 */
export function buildSlideFrameDocument(
  slideHtml: string,
  css: string,
  fragmentStep: number = -1,
): string {
  let fragmentVisibilityCss = '';
  if (fragmentStep === -1) {
    fragmentVisibilityCss = `
      [data-fragment] {
        opacity: 1 !important;
        transform: none !important;
        filter: none !important;
      }
    `;
  } else {
    const rules: string[] = [];
    for (let s = 1; s <= fragmentStep; s++) {
      rules.push(
        `[data-fragment="${s}"] { opacity: 1 !important; transform: none !important; filter: none !important; }`,
      );
    }
    fragmentVisibilityCss = `
      [data-fragment] {
        opacity: 0.14 !important;
        transition: opacity 280ms ease, transform 280ms ease, filter 280ms ease !important;
      }
      ${rules.join('\n')}
    `;
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  *, *::before, *::after {
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  div.marpit {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  div.marpit > svg[data-marpit-svg] {
    width: 100%;
    height: 100%;
    display: block;
    shape-rendering: geometricPrecision;
  }
  ${css}
  ${fragmentVisibilityCss}
</style>
</head>
<body>
<div class="marpit">
${slideHtml}
</div>
</body>
</html>`;
}

export const SLIDE_LAYOUT_TEMPLATES: {
  id: string;
  label: string;
  description: string;
  markdown: string;
}[] = [
  {
    id: 'cover',
    label: 'Cover Slide',
    description: 'Full-bleed title cover with eyebrow and attribution',
    markdown: `<!-- _class: lead animate-in -->

<span class="eyebrow">Keynote · Deck Overview</span>

# Compelling Presentation Title

## Concise subtitle framing the thesis, problem scope, and intended outcome

Presenter Name · Organization · 2026`,
  },
  {
    id: 'section',
    label: 'Section Slide',
    description: 'Heading with two-column cards',
    markdown: `<!-- _class: section animate-in -->

# Section Title

<div class="row">

<div class="card" data-fragment="1">

### Key Insight One
Concise supporting point or empirical observation.

</div>

<div class="card" data-fragment="2">

### Key Insight Two
Secondary point with measurable outcome or context.

</div>

</div>`,
  },
  {
    id: 'bento',
    label: 'Bento Grid',
    description: 'Asymmetric 3-column showcase cards',
    markdown: `<!-- _class: bento animate-in -->

# Capabilities Overview

<div class="bento-grid">

<div class="card span-2" data-fragment="1" data-anim="left">

### Primary Architecture Highlight
Describe the core differentiator or workflow advantage across two columns.

</div>

<div class="kpi-card card-accent" data-fragment="2" data-anim="zoom">
<span class="kpi-label">Speedup</span>
<span class="kpi-value" data-count-to="4.2" data-suffix="x">4.2x</span>
<span class="kpi-delta up">Verified benchmark</span>
</div>

<div class="card" data-fragment="3">

### Modular Design
Zero-lockup blocks ready for any theme.

</div>

<div class="card span-2 card-teal" data-fragment="4" data-anim="right">

### Production Readiness
Built-in dark mode, MathJax equations, and animated export support.

</div>

</div>`,
  },
  {
    id: 'kpi',
    label: 'KPI Metrics',
    description: 'Animated tabular counters and meters',
    markdown: `<!-- _class: kpi animate-in -->

# Key Performance Metrics

<div class="kpi-grid">

<div class="kpi-card" data-fragment="1" data-anim="pop">
<span class="kpi-label">Annual Growth</span>
<span class="kpi-value" data-count-to="142" data-suffix="%">142%</span>
<span class="kpi-delta up">+28 pts vs. prior quarter</span>
<div class="meter"><div class="meter-fill" style="width:88%"></div></div>
</div>

<div class="kpi-card" data-fragment="2" data-anim="pop">
<span class="kpi-label">Active Teams</span>
<span class="kpi-value" data-count-to="3.8" data-suffix="k">3.8k</span>
<span class="kpi-delta up">94% weekly retention</span>
<div class="meter"><div class="meter-fill" style="width:94%"></div></div>
</div>

<div class="kpi-card" data-fragment="3" data-anim="pop">
<span class="kpi-label">Response P99</span>
<span class="kpi-value" data-count-to="24" data-suffix=" ms">24 ms</span>
<span class="kpi-delta up">Within SLA target</span>
<div class="meter"><div class="meter-fill" style="width:76%"></div></div>
</div>

</div>`,
  },
  {
    id: 'timeline',
    label: 'Milestone Timeline',
    description: 'Four-stage sequential roadmap',
    markdown: `<!-- transition: glide 0.5s -->
<!-- _class: timeline-slide animate-in -->

# Delivery Roadmap

<div class="timeline">

<div class="timeline-step" data-fragment="1">
<span class="timeline-num">01</span>

### Discovery
Align goals, scope, and baseline metrics.

</div>

<div class="timeline-step" data-fragment="2">
<span class="timeline-num">02</span>

### Prototype
Validate core workflow with pilot users.

</div>

<div class="timeline-step" data-fragment="3">
<span class="timeline-num">03</span>

### Hardening
Complete security, QA, and performance gates.

</div>

<div class="timeline-step" data-fragment="4">
<span class="timeline-num">04</span>

### Launch
Roll out to 100% of customers.

</div>

</div>`,
  },
  {
    id: 'split',
    label: 'Two-Column Split',
    description: 'Asymmetric proof, code, or explanation',
    markdown: `<!-- _class: split animate-in -->

<div class="stack" data-fragment="1" data-anim="left">

### Left Column Context
Explain the problem, mechanism, or derivation clearly.

<ul class="stagger-list">
<li>First structured takeaway</li>
<li>Second structured takeaway</li>
<li>Third supporting point</li>
</ul>

</div>

<div class="stack" data-fragment="2" data-anim="right">

### Right Column Artifact

<div class="card">

**Supporting Evidence** — Quantified result, diagram placeholder, or reference block.

</div>

</div>`,
  },
  {
    id: 'agenda',
    label: 'Numbered Agenda',
    description: 'Structured 4-part talk outline',
    markdown: `<!-- _class: agenda animate-in -->

# Agenda

<div class="agenda-list">

<div class="agenda-item" data-fragment="1">
<span class="agenda-num">01</span>
<div>

### Context & Problem
What triggered this initiative and why now.

</div>
</div>

<div class="agenda-item" data-fragment="2">
<span class="agenda-num">02</span>
<div>

### Core Proposal
Architecture, design choices, and trade-offs.

</div>
</div>

<div class="agenda-item" data-fragment="3">
<span class="agenda-num">03</span>
<div>

### Results & Evidence
Benchmarks, user feedback, and key metrics.

</div>
</div>

<div class="agenda-item" data-fragment="4">
<span class="agenda-num">04</span>
<div>

### Next Steps
Timeline, owners, and open decisions.

</div>
</div>

</div>`,
  },
  {
    id: 'math',
    label: 'Math & Derivation',
    description: 'Framed MathJax display equations',
    markdown: `<!-- transition: rise 0.55s -->
<!-- _class: section animate-in -->

# Mathematical Formulation

<div class="formula-box" data-fragment="1">

$$
\\mathcal{L}(\\theta) = \\mathbb{E}_{x \\sim p_{\\text{data}}}\\left[\\|f_\\theta(x) - y\\|_2^2\\right] + \\lambda \\|\\theta\\|_2^2
$$

</div>

<div class="card" data-fragment="2">

**Interpretation:** Regularization parameter $\\lambda > 0$ balances empirical fit against parameter norm.

</div>`,
  },
  {
    id: 'table',
    label: 'Comparison Table',
    description: 'Structured tabular data view',
    markdown: `<!-- _class: section animate-in -->

# Quantitative Comparison

<div class="table-wrap" data-fragment="1">

| Approach | Throughput | Latency P99 | Memory Footprint |
|---|---|---|---|
| Baseline | 4,200 req/s | 64 ms | 1.8 GB |
| Optimized | 11,900 req/s | 18 ms | 1.1 GB |
| Distributed | 28,400 req/s | 22 ms | 2.4 GB |

</div>`,
  },
  {
    id: 'quote',
    label: 'Editorial Quote',
    description: 'Centered thesis or pull quote',
    markdown: `<!-- _class: quote animate-in -->

> Clarity in a presentation comes from removing everything that does not advance the core argument.

<cite>Premarks Design Principle</cite>`,
  },
  {
    id: 'swot',
    label: 'SWOT 2x2 Matrix',
    description: 'Four-quadrant strategic analysis',
    markdown: `<!-- _class: section animate-in -->

# Strategic SWOT Matrix

<div class="swot-grid">

<div class="swot-card s" data-fragment="1">

### Strengths
- Clear internal differentiator or core capability

</div>

<div class="swot-card w" data-fragment="2">

### Weaknesses
- Current bottleneck or adoption friction point

</div>

<div class="swot-card o" data-fragment="3">

### Opportunities
- Emerging market shift or partner ecosystem gap

</div>

<div class="swot-card t" data-fragment="4">

### Threats
- Competitive reaction or macro risk factor

</div>

</div>`,
  },
  {
    id: 'compare',
    label: 'Before vs. After',
    description: 'Side-by-side transformation contrast',
    markdown: `<!-- _class: section animate-in -->

# Before vs. After Comparison

<div class="compare-grid">

<div class="compare-card before" data-fragment="1" data-anim="left">
<span class="compare-label">Before</span>

### Legacy Approach
- Manual multi-step workflow
- Higher operational latency

</div>

<div class="compare-card after" data-fragment="2" data-anim="right">
<span class="compare-label">After</span>

### New Architecture
- Single automated execution path
- 3x faster customer turnaround

</div>

</div>`,
  },
  {
    id: 'pricing',
    label: '3-Tier Pricing',
    description: 'Starter, Pro, and Enterprise comparison',
    markdown: `<!-- _class: section animate-in -->

# Pricing & Plan Tiers

<div class="pricing-grid">

<div class="pricing-card" data-fragment="1">
<div>
<span class="pricing-tier">Starter</span>
<div class="pricing-price">$29/mo</div>
</div>

- Up to 10 active workspaces
- Email support (48h SLA)

</div>

<div class="pricing-card featured" data-fragment="2">
<div>
<span class="pricing-tier">Pro</span>
<div class="pricing-price">$79/mo</div>
</div>

- Unlimited workspaces & brand kits
- Priority support (4h SLA)

</div>

<div class="pricing-card" data-fragment="3">
<div>
<span class="pricing-tier">Enterprise</span>
<div class="pricing-price">Custom</div>
</div>

- Dedicated VPC & SAML SSO
- 99.99% uptime guarantee

</div>

</div>`,
  },
  {
    id: 'beamer',
    label: 'Beamer Theorem Block',
    description: 'Academic definition, alert, and proof frame',
    markdown: `<!-- _class: section animate-in -->

# Formal Definition & Theorem

<div class="beamer-block" data-fragment="1">
<div class="beamer-block-title">Theorem 1 — Main Bound</div>
<div class="beamer-block-body">

Let $f$ be $L$-Lipschitz on bounded domain $\\mathcal{X}$. Then for any perturbation $\\|\\delta\\|_2 \\le \\epsilon$:

$$
\\|f(x + \\delta) - f(x)\\|_2 \\le L\\epsilon
$$

</div>
</div>

<div class="beamer-alert" data-fragment="2">
<div class="beamer-block-title">Key Remark</div>
<div class="beamer-block-body">

Bounding spectral norms layer-by-layer keeps $L$ finite even under sparse routing.

</div>
</div>`,
  },
  {
    id: 'closing',
    label: 'Closing Finale',
    description: 'High-contrast summary slide',
    markdown: `<!-- transition: iris 0.6s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">Summary</span>

# Next Steps & Discussion

- First action item or decision requested
- Second milestone and target owner`,
  },
];

export const SNIPPET_BLOCKS: { label: string; snippet: string }[] = [
  {
    label: 'KPI Counter Card',
    snippet: `\n<div class="kpi-card" data-fragment="1" data-anim="pop">\n<span class="kpi-label">Key Metric</span>\n<span class="kpi-value" data-count-to="94.5" data-suffix="%">94.5%</span>\n<span class="kpi-delta up">+12% quarter over quarter</span>\n<div class="meter"><div class="meter-fill" style="width:94%"></div></div>\n</div>\n`,
  },
  {
    label: 'Bento 3-Up Grid',
    snippet: `\n<div class="bento-grid">\n\n<div class="card span-2" data-fragment="1" data-anim="left">\n\n### Featured Insight\nWide anchor card spanning two columns.\n\n</div>\n\n<div class="card card-accent" data-fragment="2" data-anim="zoom">\n\n### Highlight\nFocused metric or takeaway.\n\n</div>\n\n</div>\n`,
  },
  {
    label: 'Progress Meter',
    snippet: `\n<div class="card" data-fragment="1">\n\n### Adoption Progress — 84%\n<div class="meter"><div class="meter-fill" style="width:84%"></div></div>\n<small>Target completion by Q4</small>\n\n</div>\n`,
  },
  {
    label: 'Callout Box',
    snippet: `\n<div class="callout info" data-fragment="1">\n\n**Key Takeaway:** Concise callout highlight for the audience.\n\n</div>\n`,
  },
  {
    label: 'Formula Box',
    snippet: `\n<div class="formula-box" data-fragment="1">\n\n$$\nf(x) = \\int_a^b g(t)\\,dt\n$$\n\n</div>\n`,
  },
  {
    label: '2-Column Row',
    snippet: `\n<div class="row">\n\n<div class="card" data-fragment="1" data-anim="left">\n\n### Column A\nDetails here.\n\n</div>\n\n<div class="card" data-fragment="2" data-anim="right">\n\n### Column B\nDetails here.\n\n</div>\n\n</div>\n`,
  },
  {
    label: '3-Column Metrics',
    snippet: `\n<div class="row-3">\n\n<div class="card" data-fragment="1">\n\n### Metric 1\nDescription.\n\n</div>\n\n<div class="card" data-fragment="2">\n\n### Metric 2\nDescription.\n\n</div>\n\n<div class="card" data-fragment="3">\n\n### Metric 3\nDescription.\n\n</div>\n\n</div>\n`,
  },
  {
    label: 'Data Table',
    snippet: `\n<div class="table-wrap">\n\n| Item | Baseline | Target |\n|---|---|---|\n| Metric A | 12.4 | 24.8 |\n| Metric B | 88% | 97% |\n\n</div>\n`,
  },
  {
    label: 'Code Window',
    snippet: `\n<div class="code-window">\n<div class="code-bar"><span>example.ts</span><span>TypeScript</span></div>\n\n\`\`\`typescript\nexport function solve(n: number): number {\n  return n <= 1 ? n : solve(n - 1) + solve(n - 2);\n}\n\`\`\`\n\n</div>\n`,
  },
  {
    label: 'Beamer Block',
    snippet: `\n<div class="beamer-block" data-fragment="1">\n<div class="beamer-block-title">Theorem / Definition</div>\n<div class="beamer-block-body">\n\nConcise formal statement or key observation.\n\n</div>\n</div>\n`,
  },
  {
    label: 'Compare Card',
    snippet: `\n<div class="compare-grid">\n\n<div class="compare-card before" data-fragment="1">\n<span class="compare-label">Before</span>\n\n### Previous State\n- Legacy step one\n\n</div>\n\n<div class="compare-card after" data-fragment="2">\n<span class="compare-label">After</span>\n\n### Improved State\n- Automated outcome\n\n</div>\n\n</div>\n`,
  },
];

export interface SlideDensityReport {
  words: number;
  lines: number;
  isDense: boolean;
}

export function analyzeSlideDensity(rawBody: string): SlideDensityReport {
  const withoutComments = rawBody.replace(/<!--[\s\S]*?-->/g, '');
  const plainText = withoutComments
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .trim();
  const words = plainText ? plainText.split(/\s+/).length : 0;
  const lines = withoutComments
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;
  return {
    words,
    lines,
    isDense: words > 135 || lines > 15,
  };
}

export function splitCrowdedSlide(rawBody: string): [string, string] | null {
  const lines = rawBody.trim().split('\n');
  if (lines.length < 4) return null;

  let headingLine = '';
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i].trim();
    if (t.startsWith('# ')) {
      headingLine = t;
      bodyStart = i + 1;
      break;
    }
  }

  const contentLines = lines.slice(bodyStart);
  if (contentLines.length < 4) return null;

  // Find a clean split point near the middle that isn't inside a fenced code block
  const mid = Math.floor(contentLines.length / 2);
  let bestIdx = mid;
  let inCode = false;
  let bestDist = Infinity;

  for (let i = 0; i < contentLines.length; i += 1) {
    const trimmed = contentLines[i].trim();
    if (trimmed.startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    if (i > 1 && i < contentLines.length - 1 && (trimmed === '' || trimmed.startsWith('### ') || trimmed.startsWith('- '))) {
      const dist = Math.abs(i - mid);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
  }

  const firstPart = [...lines.slice(0, bodyStart), ...contentLines.slice(0, bestIdx)].join('\n').trim();
  const secondHeading = headingLine ? `${headingLine} (Continued)\n\n` : '';
  const secondPart = `<!-- _class: animate-in -->\n\n${secondHeading}${contentLines.slice(bestIdx).join('\n').trim()}`.trim();

  if (!firstPart || !secondPart) return null;
  return [firstPart, secondPart];
}

export function convertOutlineToMarpDeck(
  rawText: string,
  deckTitle: string,
  themeId: string,
): string {
  const trimmed = rawText.trim();
  const frontmatter = `---
marp: true
theme: ${themeId || 'anime'}
size: 16:9
paginate: true
math: mathjax
transition: fade 0.5s
---`;

  const titleSlide = `<!-- _class: lead animate-in -->

<span class="eyebrow">Structured Presentation</span>

# ${deckTitle.trim() || 'Presentation Overview'}

## Generated from Outline Notes`;

  if (!trimmed) {
    return `${frontmatter}\n\n${titleSlide}`;
  }

  // Split into sections by markdown headings (# / ##) or blank-line paragraphs
  const lines = trimmed.split('\n');
  const sections: { heading: string; bullets: string[] }[] = [];
  let current: { heading: string; bullets: string[] } | null = null;

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const headingMatch = t.match(/^#{1,3}\s+(.+)$/) || t.match(/^\d+\.\s+([A-Z][^:]{2,70})$/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { heading: headingMatch[1].trim(), bullets: [] };
      continue;
    }

    if (!current) {
      current = { heading: 'Key Points', bullets: [] };
    }
    const cleanBullet = t.replace(/^[-*•]\s+/, '');
    current.bullets.push(cleanBullet);
  }
  if (current) sections.push(current);

  const slides: string[] = [titleSlide];

  for (const sec of sections) {
    // Chunk bullets into groups of max 5 per slide to keep slides crisp
    if (sec.bullets.length === 0) {
      slides.push(`<!-- _class: section animate-in -->\n\n# ${sec.heading}`);
      continue;
    }

    for (let i = 0; i < sec.bullets.length; i += 5) {
      const chunk = sec.bullets.slice(i, i + 5);
      const slideTitle = i === 0 ? sec.heading : `${sec.heading} (${Math.floor(i / 5) + 1})`;
      if (chunk.length === 2 || chunk.length === 4) {
        const cards = chunk
          .map((item, idx) => `<div class="card" data-fragment="${idx + 1}">\n\n${item}\n\n</div>`)
          .join('\n\n');
        slides.push(`<!-- _class: animate-in -->\n\n# ${slideTitle}\n\n<div class="row">\n\n${cards}\n\n</div>`);
      } else {
        const bulletMd = chunk.map((b) => `- ${b}`).join('\n');
        slides.push(`<!-- _class: animate-in -->\n\n# ${slideTitle}\n\n${bulletMd}`);
      }
    }
  }

  return `${frontmatter}\n\n${slides.join('\n\n---\n\n')}\n`;
}

export type DataBlockMode = 'table' | 'kpi' | 'mermaid-pie' | 'mermaid-bar';

export function parseStructuredData(input: string): { headers: string[]; rows: string[][] } {
  const trimmed = input.trim();
  if (!trimmed) return { headers: [], rows: [] };

  // Try JSON array of objects
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        const headers = Object.keys(parsed[0]);
        const rows = parsed.map((obj) => headers.map((h) => String(obj[h] ?? '')));
        return { headers, rows };
      }
    } catch {
      // Fallback to CSV/TSV parser
    }
  }

  const lines = trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const splitLine = (line: string) =>
    line
      .split(delimiter)
      .map((cell) => cell.trim().replace(/^["']|["']$/g, ''));

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

export function convertDataToMarpBlock(input: string, mode: DataBlockMode): string {
  const { headers, rows } = parseStructuredData(input);
  if (headers.length === 0) return '';

  if (mode === 'table') {
    const head = `| ${headers.join(' | ')} |`;
    const sep = `| ${headers.map(() => '---').join(' | ')} |`;
    const body = rows.map((r) => `| ${headers.map((_, idx) => r[idx] || '').join(' | ')} |`).join('\n');
    return `\n<div class="table-wrap">\n\n${head}\n${sep}\n${body}\n\n</div>\n`;
  }

  if (mode === 'kpi') {
    const items = rows.slice(0, 4).map((r, idx) => {
      const label = r[0] || `Metric ${idx + 1}`;
      const value = r[1] || '—';
      const note = r[2] ? `\n\n${r[2]}` : '';
      return `<div class="card" data-fragment="${idx + 1}">\n\n### ${value}\n**${label}**${note}\n\n</div>`;
    });
    return `\n<div class="row">\n\n${items.join('\n\n')}\n\n</div>\n`;
  }

  if (mode === 'mermaid-pie') {
    const title = headers[1] ? `${headers[0]} by ${headers[1]}` : 'Breakdown';
    const slices = rows
      .slice(0, 8)
      .map((r) => {
        const label = (r[0] || 'Item').replace(/["`:]/g, '');
        const num = parseFloat(String(r[1] || '0').replace(/[^0-9.-]/g, ''));
        return `    "${label}" : ${Number.isFinite(num) && num > 0 ? num : 1}`;
      })
      .join('\n');
    return `\n\`\`\`mermaid\npie showData\n    title ${title}\n${slices}\n\`\`\`\n`;
  }

  // mermaid-bar via xychart-beta
  const categories = rows
    .slice(0, 8)
    .map((r) => `"${(r[0] || '').replace(/["`]/g, '').slice(0, 14)}"`)
    .join(', ');
  const values = rows
    .slice(0, 8)
    .map((r) => {
      const num = parseFloat(String(r[1] || '0').replace(/[^0-9.-]/g, ''));
      return Number.isFinite(num) ? num : 0;
    })
    .join(', ');
  return `\n\`\`\`mermaid\nxychart-beta\n    title "${headers[1] || headers[0]}"\n    x-axis [${categories}]\n    bar [${values}]\n\`\`\`\n`;
}

const PptxGenJS = require('pptxgenjs');
const { THEME_MAP } = require('./themes');

function stripHtmlAndMarkdown(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitMarkdownForPptx(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  let i = 0;

  if (lines[0]?.trim() === '---') {
    i = 1;
    while (i < lines.length && lines[i].trim() !== '---') i++;
    if (i < lines.length) i++;
  }

  const slides = [];
  let buf = [];
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
      slides.push(buf.join('\n'));
      buf = [];
    } else {
      buf.push(line);
    }
  }
  slides.push(buf.join('\n'));
  return slides;
}

function extractMathJaxSvgs(slideHtml) {
  if (!slideHtml || typeof slideHtml !== 'string') return [];
  const svgs = [];
  const containerRegex = /<mjx-container\b[^>]*>([\s\S]*?)<\/mjx-container>/gi;
  let match;
  while ((match = containerRegex.exec(slideHtml)) !== null) {
    const isDisplay = /display="true"|jax="SVG"/i.test(match[0]);
    const inner = match[1];
    const svgMatch = inner.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/i);
    if (!svgMatch) continue;
    let svg = svgMatch[0];
    // Ensure xmlns attribute exists for valid standalone image/svg+xml
    if (!/xmlns=/.test(svg)) {
      svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // Replace currentColor with dark ink so PPTX renders legibly
    svg = svg.replace(/currentColor/g, '#0F172A');
    const vbMatch = svg.match(/viewBox="([^"]+)"/i);
    let aspect = 4.5;
    if (vbMatch) {
      const parts = vbMatch[1].trim().split(/\s+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        aspect = Math.max(1.2, Math.min(12, parts[2] / parts[3]));
      }
    }
    if (isDisplay || svgs.length === 0) {
      svgs.push({
        svg,
        aspect,
        base64: Buffer.from(svg, 'utf8').toString('base64'),
      });
    }
  }
  return svgs;
}

function summarizeMermaidBlock(rawMermaid) {
  const lines = String(rawMermaid || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const header = lines[0] || 'flowchart';
  const bodyLines = lines
    .slice(1)
    .filter((l) => !l.startsWith('%%') && !l.startsWith('classDef') && !l.startsWith('style'))
    .slice(0, 7)
    .map((l) => l.replace(/\[([^\]]+)\]/g, ' ($1)').replace(/-->/g, ' -> '));
  return {
    diagramType: header,
    steps: bodyLines,
  };
}

function parseSlideContent(raw) {
  const notes = [];
  const cleaned = raw.replace(/<!--([\s\S]*?)-->/g, (_, inner) => {
    const trimmed = inner.trim();
    if (
      trimmed &&
      !trimmed.startsWith('_class:') &&
      !trimmed.startsWith('transition:') &&
      !trimmed.startsWith('_transition:') &&
      !trimmed.startsWith('pm-slide-id:')
    ) {
      notes.push(trimmed);
    }
    return '';
  });

  const isLead = /<!--\s*_class:\s*[^->]*\blead\b/.test(raw);
  const isClosing = /<!--\s*_class:\s*[^->]*\bclosing\b/.test(raw);
  const isQuote = /<!--\s*_class:\s*[^->]*\bquote\b/.test(raw);

  const lines = cleaned.split('\n');
  let title = '';
  let subtitle = '';
  const bullets = [];
  const codeBlocks = [];
  const mermaidBlocks = [];
  const equations = [];
  const tables = [];

  let inCode = false;
  let codeLang = '';
  let codeLines = [];
  let inMath = false;
  let mathLines = [];
  let inTable = false;
  let tableRows = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = trimmed.slice(3).trim().toLowerCase();
        codeLines = [];
      } else {
        inCode = false;
        if (codeLang === 'mermaid') {
          mermaidBlocks.push(summarizeMermaidBlock(codeLines.join('\n')));
        } else {
          codeBlocks.push(codeLines.join('\n'));
        }
        codeLang = '';
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (trimmed.startsWith('$$')) {
      const singleLineMatch = trimmed.match(/^\$\$(.+)\$\$$/);
      if (singleLineMatch) {
        equations.push(singleLineMatch[1].trim());
        continue;
      }
      if (!inMath) {
        inMath = true;
        mathLines = [];
        const tail = trimmed.slice(2).trim();
        if (tail) mathLines.push(tail);
      } else {
        inMath = false;
        equations.push(mathLines.join(' ').trim());
      }
      continue;
    }

    if (inMath) {
      mathLines.push(trimmed);
      continue;
    }

    // Markdown table detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => stripHtmlAndMarkdown(c));
      const isSeparator = cells.every((c) => /^[-:\s]+$/.test(c));
      if (!isSeparator) {
        tableRows.push(cells);
      }
      inTable = true;
      continue;
    } else if (inTable) {
      if (tableRows.length > 0) tables.push(tableRows);
      tableRows = [];
      inTable = false;
    }

    if (/^#\s+/.test(trimmed) && !title) {
      title = stripHtmlAndMarkdown(trimmed.replace(/^#\s+/, ''));
    } else if (/^##\s+/.test(trimmed) && !subtitle) {
      subtitle = stripHtmlAndMarkdown(trimmed.replace(/^##\s+/, ''));
    } else if (/^###\s+/.test(trimmed)) {
      const sub = stripHtmlAndMarkdown(trimmed.replace(/^###\s+/, ''));
      if (sub) bullets.push(sub);
    } else if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const item = stripHtmlAndMarkdown(trimmed.replace(/^([-*+]|\d+\.)\s+/, ''));
      if (item) bullets.push(item);
    } else if (trimmed.startsWith('>')) {
      const q = stripHtmlAndMarkdown(trimmed.replace(/^>\s*/, ''));
      if (q) bullets.push(`"${q}"`);
    } else if (
      trimmed &&
      !trimmed.startsWith('<div') &&
      !trimmed.startsWith('</div')
    ) {
      const plain = stripHtmlAndMarkdown(trimmed);
      if (plain && plain !== title && plain !== subtitle) {
        bullets.push(plain);
      }
    }
  }

  if (inTable && tableRows.length > 0) {
    tables.push(tableRows);
  }

  return {
    title,
    subtitle,
    bullets: bullets.slice(0, 12),
    codeBlocks,
    mermaidBlocks,
    equations,
    tables,
    notes: notes.join('\n'),
    isLead,
    isClosing,
    isQuote,
  };
}

function hexNoHash(hex, fallback) {
  const clean = (hex || fallback || '0f172a').replace('#', '').trim();
  return /^[0-9a-fA-F]{6}$/.test(clean) ? clean : fallback;
}

async function generatePptxBuffer(
  markdown,
  themeId = 'anime',
  title = 'Presentation',
  options = {},
) {
  const theme = THEME_MAP.get(themeId) || THEME_MAP.get('anime');
  const swatches = theme.swatches || ['#fafafa', '#0f172a', '#c0392b', '#0d9488'];
  const bgColor = hexNoHash(swatches[0], 'FAFAFA');
  const primaryColor = hexNoHash(swatches[1], '0F172A');
  const accentColor = hexNoHash(swatches[2], 'C0392B');
  const isDarkTheme = Boolean(theme.isDark);
  const textColor = isDarkTheme ? 'E2E8F0' : '1E293B';
  const mutedColor = isDarkTheme ? '94A3B8' : '64748B';

  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';
  pres.title = title;
  pres.author = 'Premarks Studio';

  const rawSlides = splitMarkdownForPptx(markdown);
  const compiledSlides = Array.isArray(options?.compiledSlides) ? options.compiledSlides : [];

  for (let sIdx = 0; sIdx < rawSlides.length; sIdx++) {
    const raw = rawSlides[sIdx];
    const parsed = parseSlideContent(raw);
    const mathSvgs = extractMathJaxSvgs(compiledSlides[sIdx]);
    const slide = pres.addSlide();

    const useDarkSlide = parsed.isClosing && !isDarkTheme;
    const slideBg = useDarkSlide ? primaryColor : bgColor;
    const headingColor = useDarkSlide ? 'FFFFFF' : isDarkTheme ? 'F8FAFC' : primaryColor;
    const bodyColor = useDarkSlide ? 'E2E8F0' : textColor;

    slide.background = { color: slideBg };

    // Top accent rule
    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 10,
      h: 0.06,
      fill: { color: accentColor },
    });

    let cursorY = parsed.isLead || parsed.isClosing || parsed.isQuote ? 1.35 : 0.42;

    if (parsed.title) {
      slide.addText(parsed.title, {
        x: 0.65,
        y: cursorY,
        w: 8.7,
        h: 0.72,
        fontSize: parsed.isLead ? 34 : 25,
        bold: true,
        color: headingColor,
        fontFace: 'Arial',
      });
      cursorY += parsed.isLead ? 0.82 : 0.68;
    }

    if (parsed.subtitle) {
      slide.addText(parsed.subtitle, {
        x: 0.65,
        y: cursorY,
        w: 8.7,
        h: 0.45,
        fontSize: 15,
        color: useDarkSlide ? 'CBD5E1' : mutedColor,
        fontFace: 'Arial',
      });
      cursorY += 0.55;
    }

    const hasSidePanel =
      parsed.tables.length > 0 ||
      parsed.codeBlocks.length > 0 ||
      parsed.mermaidBlocks.length > 0 ||
      mathSvgs.length > 0 ||
      parsed.equations.length > 0;

    if (parsed.bullets.length > 0) {
      const bulletItems = parsed.bullets.map((b) => ({
        text: b,
        options: {
          bullet: !parsed.isLead && !parsed.isQuote,
          breakLine: true,
          fontSize: parsed.isQuote ? 19 : 13.5,
          italic: parsed.isQuote,
          color: bodyColor,
        },
      }));

      const availH = Math.max(1.5, 5.1 - cursorY);
      slide.addText(bulletItems, {
        x: 0.65,
        y: cursorY,
        w: hasSidePanel ? 4.4 : 8.7,
        h: availH,
        valign: 'top',
        paraSpaceAfter: 7,
        fontFace: 'Arial',
      });
    }

    const sideX = parsed.bullets.length > 0 ? 5.2 : 0.65;
    const sideW = parsed.bullets.length > 0 ? 4.15 : 8.7;

    if (parsed.tables.length > 0) {
      const tbl = parsed.tables[0].slice(0, 7);
      const formattedRows = tbl.map((row, rIdx) =>
        row.map((cell) => ({
          text: cell,
          options: {
            bold: rIdx === 0,
            fill: { color: rIdx === 0 ? primaryColor : rIdx % 2 === 1 ? 'F1F5F9' : 'FFFFFF' },
            color: rIdx === 0 ? 'FFFFFF' : '1E293B',
            fontSize: 11,
            border: { pt: 0.5, color: 'CBD5E1' },
          },
        })),
      );
      slide.addTable(formattedRows, {
        x: sideX,
        y: cursorY,
        w: sideW,
        autoPage: false,
      });
    } else if (mathSvgs.length > 0) {
      const svgAsset = mathSvgs[0];
      const boxW = Math.min(sideW, 6.4);
      const boxH = Math.max(0.75, Math.min(1.6, boxW / svgAsset.aspect));
      slide.addShape(pres.ShapeType.rect, {
        x: sideX,
        y: cursorY,
        w: sideW,
        h: boxH + 0.35,
        fill: { color: 'F8FAFC' },
        line: { color: 'CBD5E1', pt: 0.75 },
      });
      slide.addImage({
        data: `image/svg+xml;base64,${svgAsset.base64}`,
        x: sideX + 0.15,
        y: cursorY + 0.17,
        w: boxW - 0.3,
        h: boxH,
      });
    } else if (parsed.equations.length > 0) {
      slide.addText(parsed.equations.join('\n'), {
        x: sideX,
        y: cursorY,
        w: sideW,
        h: 1.4,
        fontFace: 'Courier New',
        fontSize: 12,
        bold: true,
        color: '0F172A',
        fill: { color: 'F8FAFC' },
        margin: 12,
        valign: 'middle',
      });
    } else if (parsed.mermaidBlocks.length > 0) {
      const mmd = parsed.mermaidBlocks[0];
      const cardText = [
        `DIAGRAM · ${mmd.diagramType.toUpperCase()}`,
        ...mmd.steps.map((st, idx) => `${idx + 1}. ${st}`),
      ].join('\n');
      slide.addText(cardText, {
        x: sideX,
        y: cursorY,
        w: sideW,
        h: Math.min(3.4, 5.1 - cursorY),
        fontFace: 'Arial',
        fontSize: 11,
        color: '0F172A',
        fill: { color: 'F8FAFC' },
        line: { color: accentColor, pt: 1 },
        margin: 12,
        valign: 'top',
      });
    } else if (parsed.codeBlocks.length > 0) {
      const codeText = parsed.codeBlocks[0].slice(0, 800);
      slide.addText(codeText, {
        x: sideX,
        y: cursorY,
        w: sideW,
        h: Math.min(3.5, 5.1 - cursorY),
        fontFace: 'Courier New',
        fontSize: 10,
        color: 'E2E8F0',
        fill: { color: '0F172A' },
        margin: 10,
        valign: 'top',
      });
    }

    if (parsed.notes) {
      slide.addNotes(parsed.notes);
    }
  }

  return await pres.write({ outputType: 'nodebuffer' });
}

module.exports = {
  generatePptxBuffer,
  extractMathJaxSvgs,
  parseSlideContent,
};

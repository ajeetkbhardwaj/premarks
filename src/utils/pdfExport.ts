import { jsPDF } from 'jspdf';
import { renderMermaidInSlideHtml } from './mermaidRenderer';

function escapeCssCdata(css: string): string {
  return css.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function cleanCssForSvgPdf(rawCss: string): string {
  return rawCss
    .replace(/@import\s+url\([^)]*\)\s*;?/gi, '')
    .replace(/div\.marpit\s*>\s*svg\s*>\s*foreignObject\s*>\s*section/gi, 'section')
    .replace(/div\.marpit\s*>\s*svg\s*>\s*foreignObject/gi, 'foreignObject')
    .concat(`
      section {
        width: 1280px !important;
        height: 720px !important;
        box-sizing: border-box !important;
      }
      [data-fragment],
      .animate-in > *,
      .animate-zoom > *,
      .animate-left > *,
      .animate-right > *,
      .animate-blur > *,
      .animate-pop > *,
      .stagger-list > li,
      .card,
      .kpi-card,
      .timeline-step,
      .callout,
      .meter-fill,
      .formula-box,
      .table-wrap,
      blockquote,
      .eyebrow {
        animation: none !important;
        transition: none !important;
        opacity: 1 !important;
        transform: none !important;
        filter: none !important;
        clip-path: none !important;
      }
    `);
}

async function inlineLocalImages(section: HTMLElement): Promise<void> {
  const imgs = Array.from(section.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src') || '';
      if (!src || src.startsWith('data:')) return;
      if (src.startsWith('/')) {
        try {
          const res = await fetch(src);
          if (!res.ok) return;
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (dataUrl) img.setAttribute('src', dataUrl);
        } catch {
          // Leave untouched if fetch fails
        }
      }
    }),
  );
}

function rasterizeSvgToJpegDataUrl(svgContent: string, width = 1920, height = 1080): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.93);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize slide SVG for PDF export'));
    };
    img.src = url;
  });
}

export async function exportSlidesToPdfBlob(
  slidesHtml: string[],
  css: string,
  title: string,
): Promise<Blob> {
  if (!slidesHtml || slidesHtml.length === 0) {
    throw new Error('No rendered slides available for PDF export');
  }

  const cleanedCss = escapeCssCdata(cleanCssForSvgPdf(css || ''));
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [960, 540],
    compress: true,
  });
  doc.setProperties({ title: title || 'Presentation' });

  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  for (let i = 0; i < slidesHtml.length; i++) {
    const withMermaid = await renderMermaidInSlideHtml(slidesHtml[i]);
    const parsedDoc = parser.parseFromString(withMermaid, 'text/html');
    const section = parsedDoc.querySelector('section');
    if (!section) continue;

    section.querySelectorAll('script').forEach((s) => s.remove());
    await inlineLocalImages(section);

    if (!section.getAttribute('xmlns')) {
      section.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    }

    const sectionXhtml = serializer.serializeToString(section);
    const svgDoc = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <style type="text/css"><![CDATA[${cleanedCss}]]></style>
  <foreignObject x="0" y="0" width="1280" height="720">${sectionXhtml}</foreignObject>
</svg>`;

    const jpegDataUrl = await rasterizeSvgToJpegDataUrl(svgDoc, 1920, 1080);
    if (i > 0) {
      doc.addPage([960, 540], 'landscape');
    }
    doc.addImage(jpegDataUrl, 'JPEG', 0, 0, 960, 540, undefined, 'FAST');
  }

  return doc.output('blob');
}

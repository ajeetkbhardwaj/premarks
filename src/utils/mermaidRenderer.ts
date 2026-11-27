import mermaid from 'mermaid';

let initialized = false;
let renderCounter = 0;
const svgCache = new Map<string, string>();

function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'neutral',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  });
  initialized = true;
}

/**
 * Finds <pre><code class="language-mermaid">...</code></pre> blocks inside
 * rendered Marp slide HTML and replaces them with sanitized SVG diagrams.
 */
export async function renderMermaidInSlideHtml(slideHtml: string): Promise<string> {
  if (!slideHtml || !slideHtml.includes('language-mermaid')) {
    return slideHtml;
  }

  ensureInit();
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideHtml, 'text/html');
  const codeBlocks = Array.from(doc.querySelectorAll('pre code.language-mermaid'));

  if (codeBlocks.length === 0) {
    return slideHtml;
  }

  for (const codeEl of codeBlocks) {
    const pre = codeEl.closest('pre');
    if (!pre) continue;
    const code = (codeEl.textContent || '').trim();
    if (!code) continue;

    let svg = svgCache.get(code);
    if (!svg) {
      try {
        const id = `premarks-mermaid-${++renderCounter}`;
        const result = await mermaid.render(id, code);
        svg = result.svg;
        svgCache.set(code, svg);
      } catch {
        // Keep code block visible if syntax is incomplete while typing
        continue;
      }
    }

    const wrapper = doc.createElement('div');
    wrapper.className = 'mermaid-diagram';
    wrapper.setAttribute('style', 'background:#ffffff;color:#0f172a;');
    const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
    const svgNode = svgDoc.documentElement;
    if (svgNode && svgNode.nodeName.toLowerCase() === 'svg') {
      wrapper.appendChild(doc.importNode(svgNode, true));
      pre.replaceWith(wrapper);
    }
  }

  return doc.body.innerHTML;
}

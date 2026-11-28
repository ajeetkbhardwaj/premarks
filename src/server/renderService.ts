import { execFile, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fsp from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { Marp } from '@marp-team/marp-core';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const { THEMES, THEME_MAP } = require('../../lib/themes.js');

const MAX_CONCURRENT_JOBS = 4;
const WORKER_TIMEOUT_MS = 15_000;
const WORKER_ENTRY_PATH = path.resolve(process.cwd(), 'src/server/renderWorkerEntry.ts');

let activeJobs = 0;
const waitQueue: Array<() => void> = [];
let cachedChromiumPath: string | null | undefined;

export function getWorkerStats() {
  return {
    activeJobs,
    queuedJobs: waitQueue.length,
    maxConcurrentJobs: MAX_CONCURRENT_JOBS,
    chromiumAvailable: cachedChromiumPath === undefined ? null : Boolean(cachedChromiumPath),
  };
}

function acquireWorkerSlot(): Promise<void> {
  if (activeJobs < MAX_CONCURRENT_JOBS) {
    activeJobs += 1;
    return Promise.resolve();
  }
  if (waitQueue.length >= 24) {
    return Promise.reject(new Error('Render queue saturated. Please retry shortly.'));
  }
  return new Promise((resolve) => {
    waitQueue.push(() => {
      activeJobs += 1;
      resolve();
    });
  });
}

function releaseWorkerSlot() {
  activeJobs = Math.max(0, activeJobs - 1);
  const next = waitQueue.shift();
  if (next) next();
}

/**
 * Strips executable/dangerous HTML vectors (<script>, <iframe>, <object>,
 * event-handler attributes, and javascript: URIs) outside fenced code blocks
 * while preserving safe Premarks layout helpers (.row, .card, .formula-box, .eyebrow).
 */
export function sanitizeUntrustedMarkdownHtml(markdown: string): string {
  const lines = String(markdown || '').split('\n');
  let inFence = false;
  let fenceChar = '';

  const sanitized = lines.map((line) => {
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
      return line;
    }
    if (inFence) return line;

    return line
      .replace(/<\s*(script|iframe|object|embed|applet|base|meta|link)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
      .replace(/<\s*(script|iframe|object|embed|applet|base|meta|link)\b[^>]*\/?>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(href|src|action)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1=$2#$2');
  });

  return sanitized.join('\n');
}

export function createMarpInstance(selectedThemeId?: string) {
  const marp = new Marp({
    html: true,
    inlineSVG: true,
    math: 'mathjax',
  });

  for (const theme of THEMES) {
    try {
      marp.themeSet.add(theme.css);
    } catch (err) {
      console.warn(`Theme load warning (${theme.id}):`, (err as Error).message);
    }
  }

  if (selectedThemeId && THEME_MAP.has(selectedThemeId)) {
    marp.themeSet.default = marp.themeSet.get(selectedThemeId, true) || marp.themeSet.default;
  }

  return marp;
}

export function compileDeck(markdown: string, themeId = 'anime') {
  const safeThemeId = THEME_MAP.has(themeId) ? themeId : 'anime';
  const cleanMd = sanitizeUntrustedMarkdownHtml(markdown);
  const marp = createMarpInstance(safeThemeId);
  const { html, css, comments } = marp.render(cleanMd, { htmlAsArray: true });
  return {
    slides: html,
    css,
    comments,
    slideCount: html.length,
    themeId: safeThemeId,
  };
}

export function buildPrintDocument(markdown: string, themeId = 'anime', title = 'Presentation') {
  const compiled = compileDeck(markdown, themeId);
  const safeTitle = String(title || 'Presentation').replace(/[<>&"]/g, '');
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  @page { size: 1280px 720px; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  div.marpit > svg[data-marpit-svg] {
    display: block;
    width: 100vw;
    height: 100vh;
    page-break-after: always;
    break-after: page;
  }
  ${compiled.css}
  section, section * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
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
</style>
</head>
<body>
<div class="marpit">
${compiled.slides.join('\n')}
</div>
</body>
</html>`;
}

async function runIsolatedWorker(
  kind: 'html' | 'pptx',
  markdown: string,
  themeId: string,
  title: string,
): Promise<Buffer> {
  const cleanMd = sanitizeUntrustedMarkdownHtml(markdown);
  const safeThemeId = THEME_MAP.has(themeId) ? themeId : 'anime';
  await acquireWorkerSlot();

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), `pm-job-${crypto.randomBytes(4).toString('hex')}-`));
  const payloadFile = path.join(tmpDir, 'payload.json');
  const outFile = path.join(tmpDir, kind === 'html' ? 'out.html' : 'out.pptx');

  try {
    await fsp.writeFile(
      payloadFile,
      JSON.stringify({ kind, markdown: cleanMd, themeId: safeThemeId, title, outFile }),
      'utf8',
    );

    await new Promise<void>((resolve, reject) => {
      const tsxBin = path.resolve(process.cwd(), 'node_modules/.bin/tsx');
      const child = spawn(
        tsxBin,
        [WORKER_ENTRY_PATH, payloadFile],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=384',
          },
          stdio: ['ignore', 'ignore', 'pipe'],
        },
      );

      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk).slice(0, 1024);
      });

      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('Export worker timed out after 15s.'));
      }, WORKER_TIMEOUT_MS);

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      child.on('exit', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(stderr.trim() || `Export worker failed (exit ${code})`));
      });
    });

    return await fsp.readFile(outFile);
  } finally {
    releaseWorkerSlot();
    await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function exportHtmlIsolated(
  markdown: string,
  themeId = 'anime',
  title = 'Presentation',
): Promise<string> {
  const buf = await runIsolatedWorker('html', markdown, themeId, title);
  return buf.toString('utf8');
}

export async function exportPptxIsolated(
  markdown: string,
  themeId = 'anime',
  title = 'Presentation',
): Promise<Buffer> {
  return runIsolatedWorker('pptx', markdown, themeId, title);
}

export async function detectChromiumBinary(): Promise<string | null> {
  if (cachedChromiumPath !== undefined) return cachedChromiumPath;
  for (const candidate of ['chromium', 'chromium-browser', 'google-chrome']) {
    try {
      const { stdout } = await execFileAsync('which', [candidate]);
      const found = stdout.trim();
      if (found) {
        cachedChromiumPath = found;
        return found;
      }
    } catch {
      // Probe next binary
    }
  }
  cachedChromiumPath = null;
  return null;
}

export async function exportPdfWithHeadlessFallback(
  markdown: string,
  themeId = 'anime',
  title = 'Presentation',
): Promise<{ mode: 'pdf' | 'print-html'; buffer: Buffer; contentType: string }> {
  const printHtml = buildPrintDocument(markdown, themeId, title);
  const chromium = await detectChromiumBinary();
  if (!chromium) {
    return {
      mode: 'print-html',
      buffer: Buffer.from(printHtml, 'utf8'),
      contentType: 'text/html; charset=utf-8',
    };
  }

  await acquireWorkerSlot();
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pm-pdf-'));
  const htmlPath = path.join(tmpDir, 'deck.html');
  const pdfPath = path.join(tmpDir, 'deck.pdf');
  try {
    await fsp.writeFile(htmlPath, printHtml, 'utf8');
    await execFileAsync(
      chromium,
      [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        `--print-to-pdf=${pdfPath}`,
        `file://${htmlPath}`,
      ],
      { timeout: WORKER_TIMEOUT_MS },
    );
    const pdfBuf = await fsp.readFile(pdfPath);
    return {
      mode: 'pdf',
      buffer: pdfBuf,
      contentType: 'application/pdf',
    };
  } catch {
    return {
      mode: 'print-html',
      buffer: Buffer.from(printHtml, 'utf8'),
      contentType: 'text/html; charset=utf-8',
    };
  } finally {
    releaseWorkerSlot();
    await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

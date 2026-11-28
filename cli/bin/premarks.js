#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

const VERSION = '1.1.0';
const CONFIG_PATH = path.join(os.homedir(), '.premarks.json');
const DEFAULT_SERVER_URL = process.env.PREMARKS_URL || 'http://127.0.0.1:3000';

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch {
    // Ignore malformed local config
  }
  return {};
}

function getServerUrl(flagUrl) {
  const cfg = readConfig();
  return String(flagUrl || process.env.PREMARKS_URL || cfg.serverUrl || DEFAULT_SERVER_URL).replace(/\/+$/, '');
}

function getApiKey(flagKey) {
  const cfg = readConfig();
  return String(flagKey || process.env.PREMARKS_API_KEY || cfg.apiKey || '').trim();
}

function buildHeaders(apiKey, includeJson = true) {
  const headers = {};
  if (includeJson) headers['Content-Type'] = 'application/json';
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      flags.help = true;
    } else if (arg === '-v' || arg === '--version') {
      flags.version = true;
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg === '--fix') {
      flags.fix = true;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const map = { f: 'format', o: 'out', t: 'theme', p: 'port', s: 'server', k: 'api-key' };
      const key = map[arg[1]] || arg[1];
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function detectTheme(md, fallback = 'anime') {
  const match = md.match(/^---\r?\n[\s\S]*?\btheme:\s*([a-zA-Z0-9_-]+)/);
  return match ? match[1] : fallback;
}

function detectTitle(md, filePath) {
  const match = md.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  if (filePath) return path.basename(filePath, path.extname(filePath));
  return 'Presentation';
}

function updateThemeInMarkdown(md, themeId) {
  if (!themeId) return md;
  if (/^---\r?\n[\s\S]*?\btheme:\s*[a-zA-Z0-9_-]+/.test(md)) {
    return md.replace(/(^---\r?\n[\s\S]*?\btheme:\s*)([a-zA-Z0-9_-]+)/, `$1${themeId}`);
  }
  if (md.startsWith('---\n') || md.startsWith('---\r\n')) {
    return md.replace(/^---(\r?\n)/, `---$1theme: ${themeId}$1`);
  }
  return `---\nmarp: true\ntheme: ${themeId}\nsize: 16:9\npaginate: true\nmath: mathjax\n---\n\n${md}`;
}

function printHelp() {
  console.log(`Premarks CLI v${VERSION}

Usage:
  premarks <command> [options]

Commands:
  templates [--field <name>]           List available discipline templates
  themes                               List available presentation style themes
  init [template-id] [out.md]          Create a Markdown deck from a template
  lint <deck.md> [--fix] [--json]      Audit slide density, overflow, contrast, and alt text
  build <deck.md> [-f html|pptx|print|pdf] [-o out]
                                       Compile a presentation to HTML, PPTX, Print HTML, or PDF
  dev <deck.md> [--port 4173]          Live-reload local preview server watching <deck.md>
  share <deck.md> [--title <name>]     Publish a read-only share & embed URL
  config [server-url] [--api-key key]  Save Premarks server URL and/or API key (~/.premarks.json)

Global Options:
  -s, --server <url>     Premarks server URL (env: PREMARKS_URL)
  -k, --api-key <key>    Personal Premarks API key (env: PREMARKS_API_KEY)
  -t, --theme <id>       Override theme (anime, nordic, keynote, blueprint, atelier, theorem,
                         swiss, executive, obsidian, monograph, beamer-madrid, metropolis,
                         editorial-split, botanical-esg)
  -v, --version          Show CLI version
  -h, --help             Show help
`);
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status}) for ${url}`);
  }
  return data;
}

async function cmdTemplates(serverUrl, apiKey, flags) {
  const { templates = [] } = await fetchJson(`${serverUrl}/api/templates`, {
    headers: buildHeaders(apiKey, false),
  });
  const filtered = flags.field
    ? templates.filter((t) => t.field.toLowerCase().includes(String(flags.field).toLowerCase()))
    : templates;

  if (flags.json) {
    const compact = filtered.map((t) => ({
      id: t.id,
      title: t.title,
      field: t.field,
      themeId: t.themeId,
      slideCount: t.slideCount,
      summary: t.summary,
    }));
    console.log(JSON.stringify(compact, null, 2));
    return;
  }

  console.log(`Available Premarks Templates (${filtered.length}):\n`);
  for (const t of filtered) {
    console.log(`  ${t.id.padEnd(30)} ${t.field} · ${t.themeId} · ${t.slideCount} slides`);
    console.log(`    ${t.title} — ${t.summary}\n`);
  }
}

async function cmdThemes(serverUrl, apiKey, flags) {
  const { themes = [] } = await fetchJson(`${serverUrl}/api/themes`, {
    headers: buildHeaders(apiKey, false),
  });
  if (flags.json) {
    const compact = themes.map((t) => ({
      id: t.id,
      name: t.name,
      tagline: t.tagline,
      bestFor: t.bestFor,
      isDark: t.isDark,
      palette: t.palette,
      fontPreview: t.fontPreview,
    }));
    console.log(JSON.stringify(compact, null, 2));
    return;
  }
  console.log(`Available Premarks Themes (${themes.length}):\n`);
  for (const t of themes) {
    console.log(`  ${t.id.padEnd(16)} ${t.name} — ${t.tagline}`);
    console.log(`    Best for: ${t.bestFor}\n`);
  }
}

async function cmdInit(serverUrl, apiKey, positional, flags) {
  const templateId = positional[1] || 'basic-clean-deck';
  const outFile = positional[2] || `${templateId}.md`;
  const { templates = [] } = await fetchJson(`${serverUrl}/api/templates`, {
    headers: buildHeaders(apiKey, false),
  });
  const found = templates.find((t) => t.id === templateId);
  if (!found) {
    const ids = templates.map((t) => t.id).join(', ');
    throw new Error(`Template "${templateId}" not found. Available: ${ids}`);
  }
  const content = flags.theme ? updateThemeInMarkdown(found.markdown, flags.theme) : found.markdown;
  const targetPath = path.resolve(process.cwd(), outFile);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`Created ${targetPath} from template "${found.title}" (${found.slideCount} slides).`);
  console.log(`Next: premarks dev ${path.basename(targetPath)}`);
}

async function cmdLint(serverUrl, apiKey, positional, flags) {
  const inputFile = positional[1];
  if (!inputFile) throw new Error('Specify a Markdown file: premarks lint <deck.md>');
  const resolvedInput = path.resolve(process.cwd(), inputFile);
  const rawMd = fs.readFileSync(resolvedInput, 'utf8');

  const report = await fetchJson(`${serverUrl}/api/lint`, {
    method: 'POST',
    headers: buildHeaders(apiKey, true),
    body: JSON.stringify({ markdown: rawMd, autoFix: Boolean(flags.fix) }),
  });

  if (flags.fix && report.fixedMarkdown) {
    fs.writeFileSync(resolvedInput, report.fixedMarkdown, 'utf8');
  }

  if (flags.json) {
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
    return;
  }

  console.log(`Deck Score: ${report.deckScore}/100 (${report.slideCount} slides) · ${report.passed ? 'PASSED' : 'NEEDS ATTENTION'}`);
  if (flags.fix && report.fixedMarkdown) {
    console.log(`Applied auto-fixes to ${resolvedInput}`);
  }
  if (!report.issues || report.issues.length === 0) {
    console.log('No layout, overflow, contrast, or alt-text issues found.');
  } else {
    console.log('');
    for (const issue of report.issues) {
      const loc = issue.slideIndex !== null ? `Slide ${issue.slideIndex + 1}` : 'Deck';
      console.log(`  [${issue.severity.toUpperCase()}] ${loc} (${issue.rule}): ${issue.message}`);
      console.log(`    -> ${issue.suggestion}`);
    }
  }
  if (!report.passed) process.exitCode = 1;
}

async function cmdBuild(serverUrl, apiKey, positional, flags) {
  const inputFile = positional[1];
  if (!inputFile) throw new Error('Specify a Markdown file: premarks build <deck.md>');
  const resolvedInput = path.resolve(process.cwd(), inputFile);
  const rawMd = fs.readFileSync(resolvedInput, 'utf8');
  const themeId = flags.theme || detectTheme(rawMd, 'anime');
  const markdown = flags.theme ? updateThemeInMarkdown(rawMd, flags.theme) : rawMd;
  const title = flags.title || detectTitle(markdown, resolvedInput);
  const format = String(flags.format || 'html').toLowerCase();

  const endpointMap = {
    html: '/api/export-html',
    pptx: '/api/export-pptx',
    print: '/api/export-print',
    pdf: '/api/export-pdf',
  };
  const extMap = { html: '.html', pptx: '.pptx', print: '.print.html', pdf: '.pdf' };
  const endpoint = endpointMap[format];
  if (!endpoint) throw new Error(`Unsupported format "${format}". Use html, pptx, print, or pdf.`);

  const res = await fetch(`${serverUrl}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(apiKey, true),
    body: JSON.stringify({ markdown, themeId, title }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Build failed (${res.status}): ${errText}`);
  }

  const exportMode = res.headers.get('X-Export-Mode');
  let actualFormat = format;
  let defaultExt = extMap[format];
  if (format === 'pdf' && exportMode && exportMode !== 'pdf') {
    actualFormat = 'print-html';
    defaultExt = '.print.html';
  }

  const defaultOut = path.join(
    path.dirname(resolvedInput),
    `${path.basename(resolvedInput, path.extname(resolvedInput))}${defaultExt}`,
  );
  const outPath = path.resolve(process.cwd(), flags.out || defaultOut);

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  console.log(`Built ${outPath} (${buf.length} bytes, format=${actualFormat}, theme=${themeId}).`);
  if (format === 'pdf' && actualFormat === 'print-html') {
    console.log('Note: Server headless Chromium unavailable; saved print-ready HTML (open and Print -> Save as PDF).');
  }
}

async function cmdShare(serverUrl, apiKey, positional, flags) {
  const inputFile = positional[1];
  if (!inputFile) throw new Error('Specify a Markdown file: premarks share <deck.md>');
  const resolvedInput = path.resolve(process.cwd(), inputFile);
  const rawMd = fs.readFileSync(resolvedInput, 'utf8');
  const themeId = flags.theme || detectTheme(rawMd, 'anime');
  const markdown = flags.theme ? updateThemeInMarkdown(rawMd, flags.theme) : rawMd;
  const title = flags.title || detectTitle(markdown, resolvedInput);

  const data = await fetchJson(`${serverUrl}/api/shares`, {
    method: 'POST',
    headers: buildHeaders(apiKey, true),
    body: JSON.stringify({ title, markdown, themeId }),
  });
  const shareUrl = `${serverUrl}/?share=${encodeURIComponent(data.id)}`;
  const embedUrl = `${serverUrl}/?share=${encodeURIComponent(data.id)}&embed=1`;
  console.log(`Published "${data.title}"`);
  console.log(`Share URL: ${shareUrl}`);
  console.log(`Embed URL: ${embedUrl}`);
}

async function cmdDev(serverUrl, apiKey, positional, flags) {
  const inputFile = positional[1];
  if (!inputFile) throw new Error('Specify a Markdown file: premarks dev <deck.md>');
  const resolvedInput = path.resolve(process.cwd(), inputFile);
  if (!fs.existsSync(resolvedInput)) {
    throw new Error(`File not found: ${resolvedInput}`);
  }
  const port = Number(flags.port || 4173);
  let lastMtime = 0;
  let cachedHtml = '';

  async function rebuild() {
    const rawMd = fs.readFileSync(resolvedInput, 'utf8');
    const themeId = flags.theme || detectTheme(rawMd, 'anime');
    const markdown = flags.theme ? updateThemeInMarkdown(rawMd, flags.theme) : rawMd;
    const title = detectTitle(markdown, resolvedInput);
    const res = await fetch(`${serverUrl}/api/export-html`, {
      method: 'POST',
      headers: buildHeaders(apiKey, true),
      body: JSON.stringify({ markdown, themeId, title }),
    });
    if (!res.ok) throw new Error(`Render failed (${res.status})`);
    let html = await res.text();
    const reloadScript = `<script>
setInterval(async () => {
  try {
    const r = await fetch('/__mtime');
    const d = await r.json();
    if (window.__pm_mtime && d.mtime !== window.__pm_mtime) location.reload();
    window.__pm_mtime = d.mtime;
  } catch {}
}, 900);
</script>`;
    html = html.replace('</body>', `${reloadScript}\n</body>`);
    cachedHtml = html;
  }

  lastMtime = fs.statSync(resolvedInput).mtimeMs;
  await rebuild();

  fs.watch(resolvedInput, { persistent: true }, async () => {
    try {
      const mtime = fs.statSync(resolvedInput).mtimeMs;
      if (mtime !== lastMtime) {
        lastMtime = mtime;
        await rebuild();
        console.log(`[premarks] Rebuilt ${path.basename(resolvedInput)} at ${new Date().toLocaleTimeString()}`);
      }
    } catch (err) {
      console.error('[premarks] Rebuild error:', err.message);
    }
  });

  const server = http.createServer((req, res) => {
    if (req.url === '/__mtime') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ mtime: lastMtime }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(cachedHtml);
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`Premarks live preview running at http://127.0.0.1:${port}`);
    console.log(`Watching ${resolvedInput} (Ctrl+C to stop)`);
  });
}

function cmdConfig(positional, flags) {
  const urlArg = positional[1] || (typeof flags.server === 'string' ? flags.server : '');
  const apiKeyArg = typeof flags['api-key'] === 'string' ? flags['api-key'] : '';

  if (!urlArg && !apiKeyArg) {
    const currentUrl = getServerUrl();
    const currentKey = getApiKey();
    console.log(`Current Premarks server URL: ${currentUrl}`);
    console.log(`API Key: ${currentKey ? `${currentKey.slice(0, 14)}...` : '(not set)'}`);
    return;
  }

  const existing = readConfig();
  const next = { ...existing };
  if (urlArg) {
    next.serverUrl = String(urlArg).replace(/\/+$/, '');
  }
  if (apiKeyArg) {
    next.apiKey = apiKeyArg.trim();
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2));
  console.log(`Saved Premarks CLI configuration to ${CONFIG_PATH}:`);
  if (next.serverUrl) console.log(`  serverUrl: ${next.serverUrl}`);
  if (next.apiKey) console.log(`  apiKey:    ${next.apiKey.slice(0, 14)}...`);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  if (flags.version) {
    console.log(`premarks v${VERSION}`);
    return;
  }
  const cmd = positional[0];
  if (!cmd || flags.help) {
    printHelp();
    return;
  }

  if (cmd === 'config') {
    cmdConfig(positional, flags);
    return;
  }

  const serverUrl = getServerUrl(flags.server);
  const apiKey = getApiKey(flags['api-key']);

  switch (cmd) {
    case 'templates':
      await cmdTemplates(serverUrl, apiKey, flags);
      break;
    case 'themes':
      await cmdThemes(serverUrl, apiKey, flags);
      break;
    case 'init':
      await cmdInit(serverUrl, apiKey, positional, flags);
      break;
    case 'lint':
      await cmdLint(serverUrl, apiKey, positional, flags);
      break;
    case 'build':
      await cmdBuild(serverUrl, apiKey, positional, flags);
      break;
    case 'share':
      await cmdShare(serverUrl, apiKey, positional, flags);
      break;
    case 'dev':
    case 'watch':
      await cmdDev(serverUrl, apiKey, positional, flags);
      break;
    default:
      throw new Error(`Unknown command "${cmd}". Run "premarks --help" for usage.`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

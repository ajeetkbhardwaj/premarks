#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

const VERSION = '1.0.0';
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
      const map = { f: 'format', o: 'out', t: 'theme', p: 'port', s: 'server' };
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
  templates [--field <name>]         List available discipline templates
  themes                             List available presentation style themes
  init [template-id] [out.md]        Create a Markdown deck from a template
  build <deck.md> [-f html|pptx|print] [-o out]
                                     Compile a presentation to HTML, PowerPoint, or Print HTML
  dev <deck.md> [--port 4173]        Live-reload local preview server watching <deck.md>
  share <deck.md> [--title <name>]   Publish a read-only share & embed URL
  config <server-url>                Save default Premarks server URL (~/.premarks.json)

Global Options:
  -s, --server <url>   Premarks server URL (env: PREMARKS_URL)
  -t, --theme <id>     Override theme (anime, theorem, swiss, executive, obsidian, monograph)
  -v, --version        Show CLI version
  -h, --help           Show help
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

async function cmdTemplates(serverUrl, flags) {
  const { templates = [] } = await fetchJson(`${serverUrl}/api/templates`);
  const filtered = flags.field
    ? templates.filter((t) => t.field.toLowerCase().includes(String(flags.field).toLowerCase()))
    : templates;

  if (flags.json) {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }

  console.log(`Available Premarks Templates (${filtered.length}):\n`);
  for (const t of filtered) {
    console.log(`  ${t.id.padEnd(30)} ${t.field} · ${t.themeId} · ${t.slideCount} slides`);
    console.log(`    ${t.title} — ${t.summary}\n`);
  }
}

async function cmdThemes(serverUrl, flags) {
  const { themes = [] } = await fetchJson(`${serverUrl}/api/themes`);
  if (flags.json) {
    console.log(JSON.stringify(themes, null, 2));
    return;
  }
  console.log(`Available Premarks Themes (${themes.length}):\n`);
  for (const t of themes) {
    console.log(`  ${t.id.padEnd(14)} ${t.name} — ${t.tagline}`);
    console.log(`    Best for: ${t.bestFor}\n`);
  }
}

async function cmdInit(serverUrl, positional, flags) {
  const templateId = positional[1] || 'algebraic-geometry-showcase';
  const outFile = positional[2] || `${templateId}.md`;
  const { templates = [] } = await fetchJson(`${serverUrl}/api/templates`);
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

async function cmdBuild(serverUrl, positional, flags) {
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
    pdf: '/api/export-print',
  };
  const extMap = { html: '.html', pptx: '.pptx', print: '.print.html', pdf: '.print.html' };
  const endpoint = endpointMap[format];
  if (!endpoint) throw new Error(`Unsupported format "${format}". Use html, pptx, or print.`);

  const defaultOut = path.join(
    path.dirname(resolvedInput),
    `${path.basename(resolvedInput, path.extname(resolvedInput))}${extMap[format]}`,
  );
  const outPath = path.resolve(process.cwd(), flags.out || defaultOut);

  const res = await fetch(`${serverUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown, themeId, title }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Build failed (${res.status}): ${errText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  console.log(`Built ${outPath} (${buf.length} bytes, format=${format}, theme=${themeId}).`);
}

async function cmdShare(serverUrl, positional, flags) {
  const inputFile = positional[1];
  if (!inputFile) throw new Error('Specify a Markdown file: premarks share <deck.md>');
  const resolvedInput = path.resolve(process.cwd(), inputFile);
  const rawMd = fs.readFileSync(resolvedInput, 'utf8');
  const themeId = flags.theme || detectTheme(rawMd, 'anime');
  const markdown = flags.theme ? updateThemeInMarkdown(rawMd, flags.theme) : rawMd;
  const title = flags.title || detectTitle(markdown, resolvedInput);

  const data = await fetchJson(`${serverUrl}/api/shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, markdown, themeId }),
  });
  const shareUrl = `${serverUrl}/?share=${encodeURIComponent(data.id)}`;
  const embedUrl = `${serverUrl}/?share=${encodeURIComponent(data.id)}&embed=1`;
  console.log(`Published "${data.title}"`);
  console.log(`Share URL: ${shareUrl}`);
  console.log(`Embed URL: ${embedUrl}`);
}

async function cmdDev(serverUrl, positional, flags) {
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
      headers: { 'Content-Type': 'application/json' },
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

function cmdConfig(positional) {
  const url = positional[1];
  if (!url) {
    const current = getServerUrl();
    console.log(`Current Premarks server URL: ${current}`);
    return;
  }
  const cleaned = String(url).replace(/\/+$/, '');
  const existing = readConfig();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, serverUrl: cleaned }, null, 2));
  console.log(`Saved Premarks server URL to ${CONFIG_PATH}: ${cleaned}`);
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

  const serverUrl = getServerUrl(flags.server);

  switch (cmd) {
    case 'templates':
      await cmdTemplates(serverUrl, flags);
      break;
    case 'themes':
      await cmdThemes(serverUrl, flags);
      break;
    case 'init':
      await cmdInit(serverUrl, positional, flags);
      break;
    case 'build':
      await cmdBuild(serverUrl, positional, flags);
      break;
    case 'share':
      await cmdShare(serverUrl, positional, flags);
      break;
    case 'dev':
    case 'watch':
      await cmdDev(serverUrl, positional, flags);
      break;
    case 'config':
      cmdConfig(positional);
      break;
    default:
      throw new Error(`Unknown command "${cmd}". Run "premarks --help" for usage.`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

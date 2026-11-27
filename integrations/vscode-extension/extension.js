const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('premarks');
  const serverUrl = String(cfg.get('serverUrl') || 'http://127.0.0.1:3000').replace(/\/+$/, '');
  const defaultTheme = String(cfg.get('defaultTheme') || 'anime');
  return { serverUrl, defaultTheme };
}

function detectThemeFromMarkdown(md, fallback) {
  const match = md.match(/^---\r?\n[\s\S]*?\btheme:\s*([a-zA-Z0-9_-]+)/);
  return match ? match[1] : fallback;
}

function detectTitleFromMarkdown(md, fallbackPath) {
  const match = md.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  if (fallbackPath) return path.basename(fallbackPath, path.extname(fallbackPath));
  return 'Premarks Deck';
}

const SNIPPET_PICKS = [
  {
    label: 'Lead Title Slide',
    description: 'Opening hero slide with eyebrow, title, and subtitle',
    snippet: '\n---\n\n<!-- _class: lead animate-in -->\n\n<span class="eyebrow">Section Label</span>\n\n# Presentation Title\n\n## Concise Subtitle\n',
  },
  {
    label: 'Two-Column Cards',
    description: 'Side-by-side cards with click-to-reveal fragments',
    snippet: '\n<div class="row">\n\n<div class="card" data-fragment="1">\n\n### Left Card\nKey point or metric.\n\n</div>\n\n<div class="card" data-fragment="2">\n\n### Right Card\nSupporting detail.\n\n</div>\n\n</div>\n',
  },
  {
    label: 'Formula Box (MathJax)',
    description: 'Centered display equation block',
    snippet: '\n<div class="formula-box">\n\n$$\n\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}\n$$\n\n</div>\n',
  },
  {
    label: 'Mermaid Architecture Flowchart',
    description: 'Live flowchart diagram rendered automatically',
    snippet: '\n```mermaid\nflowchart LR\n    A[Input] --> B[Process]\n    B --> C[Output]\n```\n',
  },
  {
    label: 'Mermaid Sequence Diagram',
    description: 'Request/response sequence diagram',
    snippet: '\n```mermaid\nsequenceDiagram\n    participant Client\n    participant API\n    Client->>API: POST /api/render\n    API-->>Client: Compiled Slides\n```\n',
  },
  {
    label: 'Editorial Quote',
    description: 'Centered highlight quotation',
    snippet: '\n<!-- _class: quote animate-in -->\n\n> "Clear structure turns complex research into shared understanding."\n\n— Author Name\n',
  },
];

function buildPreviewHtml(slides, css) {
  const slidesMarkup = slides
    .map(
      (html, idx) =>
        `<div class="slide-slot"><div class="slide-label">Slide ${idx + 1}</div><div class="marpit">${html}</div></div>`,
    )
    .join('\n');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; padding: 18px; background: #121216; color: #e5e5e7; font-family: system-ui, -apple-system, sans-serif; }
  .slide-slot { margin: 0 auto 24px auto; max-width: 960px; }
  .slide-label { font-size: 11px; color: #a1a1aa; margin-bottom: 6px; letter-spacing: 0.04em; text-transform: uppercase; }
  .marpit > svg { width: 100%; height: auto; display: block; border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.45); background: #fff; }
  ${css}
  [data-fragment] { opacity: 1 !important; transform: none !important; }
  .animate-in > *, .card, .formula-box, .table-wrap, blockquote { animation: none !important; opacity: 1 !important; transform: none !important; }
</style>
</head>
<body>
${slidesMarkup}
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
  const blocks = document.querySelectorAll('pre code.language-mermaid');
  let i = 0;
  for (const el of blocks) {
    const pre = el.closest('pre');
    if (!pre) continue;
    try {
      const { svg } = await mermaid.render('vsc-mmd-' + (++i), el.textContent || '');
      const wrap = document.createElement('div');
      wrap.className = 'mermaid-diagram';
      wrap.innerHTML = svg;
      pre.replaceWith(wrap);
    } catch {}
  }
</script>
</body>
</html>`;
}

function activate(context) {
  let previewPanel = null;
  let debounceTimer = null;

  async function renderEditorToPanel(editor) {
    if (!previewPanel || !editor || editor.document.languageId !== 'markdown') return;
    const { serverUrl, defaultTheme } = getConfig();
    const markdown = editor.document.getText();
    const themeId = detectThemeFromMarkdown(markdown, defaultTheme);

    try {
      const res = await fetch(`${serverUrl}/api/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, themeId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      previewPanel.webview.html = buildPreviewHtml(data.slides || [], data.css || '');
    } catch (err) {
      previewPanel.webview.html = `<html><body style="font-family:sans-serif;padding:24px;background:#18181b;color:#fca5a5;"><h3>Premarks Preview Error</h3><p>${String(err.message || err)}</p><p style="color:#a1a1aa;font-size:12px;">Verify premarks.serverUrl (${serverUrl}) is reachable.</p></body></html>`;
    }
  }

  const previewCmd = vscode.commands.registerCommand('premarks.preview', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open a Markdown presentation file first.');
      return;
    }

    if (!previewPanel) {
      previewPanel = vscode.window.createWebviewPanel(
        'premarksPreview',
        'Premarks Slide Preview',
        vscode.ViewColumn.Beside,
        { enableScripts: true },
      );
      previewPanel.onDidDispose(() => {
        previewPanel = null;
      });
    } else {
      previewPanel.reveal(vscode.ViewColumn.Beside, true);
    }

    await renderEditorToPanel(editor);
  });

  const changeListener = vscode.workspace.onDidChangeTextDocument((event) => {
    const active = vscode.window.activeTextEditor;
    if (!previewPanel || !active || event.document !== active.document) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderEditorToPanel(active), 260);
  });

  const newFromTemplateCmd = vscode.commands.registerCommand('premarks.newFromTemplate', async () => {
    const { serverUrl } = getConfig();
    try {
      const res = await fetch(`${serverUrl}/api/templates`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { templates } = await res.json();
      const picks = (templates || []).map((t) => ({
        label: t.title,
        description: `${t.field} · ${t.themeId} · ${t.slideCount} slides`,
        detail: t.summary,
        template: t,
      }));
      const selected = await vscode.window.showQuickPick(picks, {
        placeHolder: 'Select a Premarks presentation template',
        matchOnDescription: true,
        matchOnDetail: true,
      });
      if (!selected) return;

      const doc = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: selected.template.markdown,
      });
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    } catch (err) {
      vscode.window.showErrorMessage(`Premarks template fetch failed: ${err.message}`);
    }
  });

  const insertBlockCmd = vscode.commands.registerCommand('premarks.insertBlock', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const selected = await vscode.window.showQuickPick(SNIPPET_PICKS, {
      placeHolder: 'Insert a Premarks slide layout, equation, or Mermaid diagram',
    });
    if (!selected) return;
    await editor.edit((builder) => {
      builder.insert(editor.selection.active, selected.snippet);
    });
  });

  async function runExport(kind) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open a Markdown presentation file first.');
      return;
    }
    const { serverUrl, defaultTheme } = getConfig();
    const markdown = editor.document.getText();
    const themeId = detectThemeFromMarkdown(markdown, defaultTheme);
    const title = detectTitleFromMarkdown(markdown, editor.document.fileName);
    const endpoint = kind === 'pptx' ? '/api/export-pptx' : '/api/export-html';
    const ext = kind === 'pptx' ? '.pptx' : '.html';

    const baseDir = editor.document.isUntitled
      ? (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd())
      : path.dirname(editor.document.fileName);
    const baseName = editor.document.isUntitled
      ? 'presentation'
      : path.basename(editor.document.fileName, path.extname(editor.document.fileName));
    const defaultUri = vscode.Uri.file(path.join(baseDir, `${baseName}${ext}`));

    const targetUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: kind === 'pptx' ? { PowerPoint: ['pptx'] } : { HTML: ['html'] },
    });
    if (!targetUri) return;

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Exporting Premarks ${ext.toUpperCase()}...` },
      async () => {
        const res = await fetch(`${serverUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown, themeId, title }),
        });
        if (!res.ok) throw new Error(`Export failed (HTTP ${res.status})`);
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(targetUri.fsPath, buf);
        vscode.window.showInformationMessage(`Saved ${path.basename(targetUri.fsPath)}`);
      },
    );
  }

  const exportHtmlCmd = vscode.commands.registerCommand('premarks.exportHtml', () => runExport('html'));
  const exportPptxCmd = vscode.commands.registerCommand('premarks.exportPptx', () => runExport('pptx'));

  const shareDeckCmd = vscode.commands.registerCommand('premarks.shareDeck', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const { serverUrl, defaultTheme } = getConfig();
    const markdown = editor.document.getText();
    const themeId = detectThemeFromMarkdown(markdown, defaultTheme);
    const title = detectTitleFromMarkdown(markdown, editor.document.fileName);

    try {
      const res = await fetch(`${serverUrl}/api/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, markdown, themeId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { id } = await res.json();
      const shareUrl = `${serverUrl}/?share=${encodeURIComponent(id)}`;
      await vscode.env.clipboard.writeText(shareUrl);
      vscode.window.showInformationMessage(`Share link copied to clipboard: ${shareUrl}`);
    } catch (err) {
      vscode.window.showErrorMessage(`Premarks share failed: ${err.message}`);
    }
  });

  context.subscriptions.push(
    previewCmd,
    changeListener,
    newFromTemplateCmd,
    insertBlockCmd,
    exportHtmlCmd,
    exportPptxCmd,
    shareDeckCmd,
  );
}

function deactivate() {}

module.exports = { activate, deactivate };

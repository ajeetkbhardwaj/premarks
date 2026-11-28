# Premarks for Visual Studio Code

Author, live-preview, lint, export, and publish **Premarks** Marp presentations directly from VS Code.

## Install from VSIX

```bash
code --install-extension premarks-vscode.vsix
```

Or in VS Code: **Extensions (`Ctrl+Shift+X`) -> `...` menu -> Install from VSIX...**.

## Features & Shortcuts

- **`Ctrl+Alt+P` / `Cmd+Alt+P`**: Open **Premarks: Live Slide Preview** alongside your Markdown editor (updates as you type, including MathJax & Mermaid).
- **`Ctrl+Alt+I` / `Cmd+Alt+I`**: **Insert Layout, Equation, or Mermaid** block.
- **Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)**:
  - `Premarks: New Deck from Template` — pick any curated STEM, engineering, business, academic, or starter template.
  - `Premarks: Lint Presentation Quality` — audit 16:9 vertical overflow, word density, contrast, and image alt text.
  - `Premarks: Export Animated HTML` — compile a self-contained HTML presentation.
  - `Premarks: Export PowerPoint (.pptx)` — export an editable 16:9 PowerPoint deck.
  - `Premarks: Export Print / PDF` — export a PDF or print-ready HTML handout.
  - `Premarks: Publish & Copy Share Link` — publish a live presentation snapshot link.
- **Snippets**: Type `pm-frontmatter`, `pm-lead`, `pm-cards`, `pm-formula`, `pm-mermaid`, `pm-fragment`, or `pm-notes` in any Markdown file.

## Settings

- `premarks.serverUrl`: Base URL of your Premarks server (defaults to `http://127.0.0.1:3000` or your configured instance URL).
- `premarks.apiKey`: Optional personal API key (`pm_live_...`) for authenticated requests.
- `premarks.defaultTheme`: Default theme across all 14 Premarks styles.

# Premarks for Visual Studio Code

Author, live-preview, export, and publish **Premarks** Marp presentations directly from VS Code.

## Install from VSIX

```bash
code --install-extension premarks-vscode.vsix
```

Or in VS Code: **Extensions (`Ctrl+Shift+X`) -> `...` menu -> Install from VSIX...**.

## Features & Shortcuts

- **`Ctrl+Alt+P` / `Cmd+Alt+P`**: Open **Premarks: Live Slide Preview** alongside your Markdown editor (updates as you type, including MathJax & Mermaid).
- **`Ctrl+Alt+I` / `Cmd+Alt+I`**: **Insert Layout, Equation, or Mermaid** block.
- **Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)**:
  - `Premarks: New Deck from Template` — pick any curated STEM, engineering, business, or humanities template.
  - `Premarks: Export Animated HTML` — compile a self-contained HTML presentation.
  - `Premarks: Export PowerPoint (.pptx)` — export an editable 16:9 PowerPoint deck.
  - `Premarks: Publish & Copy Share Link` — publish a live presentation snapshot link.
- **Snippets**: Type `pm-frontmatter`, `pm-lead`, `pm-cards`, `pm-formula`, `pm-mermaid`, `pm-fragment`, or `pm-notes` in any Markdown file.

## Settings

Configure `premarks.serverUrl` in VS Code Settings if pointing to a custom or local Premarks server (defaults to `http://127.0.0.1:3000` or your configured instance URL).

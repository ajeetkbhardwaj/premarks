# Premarks CLI

Create, lint, live-preview, export, and publish **Premarks** Marp presentations directly from your terminal, or connect AI clients via `premarks-mcp`.

## Install

```bash
npm install -g <PREMARKS_URL>/api/integrations/cli/premarks-cli.tgz
```

Or run the one-line installer:

```bash
curl -fsSL <PREMARKS_URL>/api/integrations/cli/install.sh | bash
```

## Quick Start

```bash
# 1. Browse available discipline templates & 14 themes
premarks templates
premarks themes

# 2. Scaffold a new presentation
premarks init basic-clean-deck lecture.md

# 3. Audit slide density, overflow, and contrast
premarks lint lecture.md --fix

# 4. Live-reload preview while editing
premarks dev lecture.md

# 5. Export animated HTML, PowerPoint (.pptx), or Print/PDF
premarks build lecture.md -f html -o lecture.html
premarks build lecture.md -f pptx -o lecture.pptx
premarks build lecture.md -f pdf -o lecture.pdf

# 6. Publish a shareable & embeddable URL
premarks share lecture.md
```

## Authentication & Server Config

```bash
premarks config <PREMARKS_URL> --api-key pm_live_YOUR_API_KEY
```

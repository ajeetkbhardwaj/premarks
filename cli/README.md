# Premarks CLI

Create, live-preview, export, and publish **Premarks** Marp presentations directly from your terminal.

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
# 1. Browse available discipline templates & themes
premarks templates
premarks themes

# 2. Scaffold a new presentation
premarks init quantum-mechanics-lecture lecture.md

# 3. Live-reload preview while editing
premarks dev lecture.md

# 4. Export animated HTML or PowerPoint (.pptx)
premarks build lecture.md -f html -o lecture.html
premarks build lecture.md -f pptx -o lecture.pptx

# 5. Publish a shareable & embeddable URL
premarks share lecture.md
```

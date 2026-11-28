const fs = require('fs');
const path = require('path');

const baseAnimeCss = fs.readFileSync(path.join(__dirname, '..', 'theme.css'), 'utf8');

function loadCoverDataUri(name) {
  try {
    const filePath = path.join(__dirname, '..', 'public', 'covers', `${name}.jpg`);
    const buf = fs.readFileSync(filePath);
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch {
    return '';
  }
}

const COVER_DATA_URIS = {
  academic: loadCoverDataUri('academic'),
  studio: loadCoverDataUri('studio'),
  keynote: loadCoverDataUri('keynote'),
  blueprint: loadCoverDataUri('blueprint'),
  botanical: loadCoverDataUri('botanical'),
};

function buildThemedCss({
  id,
  fontImport,
  fontBody,
  fontDisplay,
  bg,
  panel,
  panelSoft,
  ink,
  muted,
  line,
  navy,
  accent,
  accentSoft,
  teal,
  tealSoft,
  shadow,
  codeBg,
  codeInk,
  topStripe,
  closingBg,
  closingInk,
  coverKey = 'studio',
  coverTone = 'light',
  coverScrimRgb = '248, 250, 252',
  closingScrimRgb = '15, 23, 42',
  extraCss = '',
}) {
  const coverUrl = COVER_DATA_URIS[coverKey] || '';
  return `/* @theme ${id} */

${fontImport}

:root {
  --bg: ${bg};
  --panel: ${panel};
  --panel-soft: ${panelSoft};
  --ink: ${ink};
  --muted: ${muted};
  --line: ${line};
  --navy: ${navy};
  --accent: ${accent};
  --accent-soft: ${accentSoft};
  --teal: ${teal};
  --teal-soft: ${tealSoft};
  --shadow: ${shadow};
  --shadow-strong: ${shadow};
  --pad-x: 60px;
  --pad-y: 48px;
  --gap: 20px;
  --tight-gap: 12px;
  --ease: cubic-bezier(0.2, 0.6, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --dur-fast: 0.3s;
  --dur-base: 0.45s;
  --dur-slow: 0.6s;
  --stagger: 0.07s;
}

*, *::before, *::after { box-sizing: border-box; }

section {
  position: relative;
  background: var(--bg);
  color: var(--ink);
  font-family: ${fontBody};
  font-size: 20px;
  line-height: 1.58;
  padding: 50px var(--pad-x) 58px;
  overflow: hidden;
  contain: layout style paint;
}

section::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: ${topStripe};
  opacity: 0.9;
}

header, footer {
  position: absolute;
  left: var(--pad-x);
  right: var(--pad-x);
  z-index: 10;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

header { top: 14px; }
footer {
  bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
footer::before {
  content: '';
  position: absolute;
  left: 0; right: 0; top: -8px;
  height: 1px;
  background: var(--line);
}

h1, h2, h3, h4, h5, h6 {
  font-family: ${fontDisplay};
  margin: 0 0 10px 0;
  color: var(--navy);
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-weight: 700;
}

h1 { font-size: clamp(36px, 3vw, 54px); }
h2 { font-size: clamp(26px, 2.2vw, 36px); }
h3 { font-size: clamp(20px, 1.6vw, 25px); color: var(--accent); }

p { margin: 0 0 10px 0; }
ul, ol { margin: 0 0 10px 0; padding-left: 24px; }
li { margin-bottom: 6px; }
li::marker { color: var(--accent); }
strong { color: var(--navy); font-weight: 600; }

blockquote {
  background: var(--accent-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 20px;
  font-weight: 500;
  color: var(--navy);
  margin: 16px 0;
  font-style: italic;
}

img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }
a { color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; }
a:hover { border-bottom-color: var(--accent); }

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 5px 11px;
  margin-bottom: 18px;
  font-weight: 700;
}

.kicker {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 10px;
}

.subtitle {
  font-size: clamp(18px, 1.5vw, 23px);
  font-weight: 400;
  color: var(--muted);
  margin-top: 6px;
  line-height: 1.4;
}

.stack { display: flex; flex-direction: column; gap: var(--gap); }
.row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gap); align-items: start; }
.row-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--gap); }
.grid-2x2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gap); }
.bento-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: stretch; }
.bento-grid .span-2 { grid-column: span 2; }
.bento-grid .row-span-2 { grid-row: span 2; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); align-items: stretch; }
.split-60-40 { display: grid; grid-template-columns: 1.45fr 1fr; gap: var(--gap); align-items: stretch; }
.split-40-60 { display: grid; grid-template-columns: 1fr 1.45fr; gap: var(--gap); align-items: stretch; }
.center { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
.compact { --gap: var(--tight-gap); }
.spacious { --gap: 28px; }
.fill { width: 100%; }

.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 18px;
  transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
}
.card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px var(--shadow); }
.card h3 { margin-bottom: 6px; font-size: 18px; }
.card p:last-child, .card ul:last-child, .card ol:last-child { margin-bottom: 0; }
.card-accent { background: var(--accent-soft); border-color: var(--accent); }
.card-teal { background: var(--teal-soft); border-color: var(--teal); }
.card-teal h3 { color: var(--teal); }
.card-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }

.kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--gap); align-items: stretch; }
.kpi-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
}
.kpi-label { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.kpi-value { font-size: clamp(30px, 2.8vw, 44px); font-weight: 800; line-height: 1.08; letter-spacing: -0.03em; color: var(--navy); font-variant-numeric: tabular-nums; }
.kpi-delta { font-size: 13px; font-weight: 600; color: var(--muted); font-variant-numeric: tabular-nums; }
.kpi-delta.up { color: var(--teal); }
.kpi-delta.down { color: var(--accent); }

.timeline { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 8px; }
.timeline-step { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.timeline-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--accent-soft); color: var(--accent);
  font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700;
}

.callout { background: var(--panel-soft); border: 1px solid var(--line); border-radius: 10px; padding: 14px 18px; font-size: 0.94em; }
.callout.info { background: var(--accent-soft); border-color: var(--accent); }
.callout.ok { background: var(--teal-soft); border-color: var(--teal); }

.meter { width: 100%; height: 10px; border-radius: 999px; background: var(--panel-soft); border: 1px solid var(--line); overflow: hidden; margin: 6px 0 4px; }
.meter-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--teal)); transform-origin: left center; animation: meterGrow 0.85s var(--ease-out) both; }

.agenda-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin-top: 8px; }
.agenda-item { display: flex; align-items: flex-start; gap: 14px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); }
.agenda-num { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: var(--accent); padding-top: 2px; }

.code-window { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; background: ${codeBg}; }
.code-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; background: rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.08); font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #94a3b8; }
.code-window pre { margin: 0; border: 0; border-radius: 0; }

.beamer-block, .beamer-alert, .beamer-example {
  border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--panel); margin: 10px 0;
}
.beamer-block-title {
  background: var(--navy); color: var(--bg); padding: 7px 14px; font-size: 14px; font-weight: 700; letter-spacing: 0.01em;
}
.beamer-alert .beamer-block-title { background: var(--accent); color: #ffffff; }
.beamer-example .beamer-block-title { background: var(--teal); color: #ffffff; }
.beamer-block-body { padding: 12px 16px; font-size: 0.92em; }
.beamer-block-body p:last-child, .beamer-block-body ul:last-child { margin-bottom: 0; }

.bib-list { display: flex; flex-direction: column; gap: 10px; font-size: 15px; line-height: 1.48; }
.bib-item {
  display: grid; grid-template-columns: 44px 1fr; gap: 10px;
  padding: 10px 14px; background: var(--panel); border: 1px solid var(--line); border-radius: 8px;
}
.bib-key { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--accent); font-size: 13px; }

.swot-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.swot-card {
  background: var(--panel); border: 1px solid var(--line); border-top: 4px solid var(--navy);
  border-radius: 10px; padding: 14px 16px;
}
.swot-card.s { border-top-color: var(--teal); background: var(--teal-soft); }
.swot-card.w { border-top-color: var(--accent); background: var(--accent-soft); }
.swot-card.o { border-top-color: var(--navy); }
.swot-card.t { border-top-color: var(--muted); background: var(--panel-soft); }
.swot-card h3 { font-size: 17px; margin-bottom: 6px; }
.swot-card.s h3 { color: var(--teal); }
.swot-card.w h3 { color: var(--accent); }
.swot-card ul:last-child, .swot-card p:last-child { margin-bottom: 0; }

.compare-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; align-items: stretch; }
.compare-card {
  background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 8px;
}
.compare-card.before { background: var(--panel-soft); }
.compare-card.after { background: var(--teal-soft); border-color: var(--teal); }
.compare-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
.compare-card.after .compare-label { color: var(--teal); }
.compare-card ul:last-child, .compare-card p:last-child { margin-bottom: 0; }

.pricing-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
.pricing-card {
  background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; justify-content: space-between; gap: 8px;
}
.pricing-card.featured { background: var(--accent-soft); border-color: var(--accent); border-width: 2px; }
.pricing-tier { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.pricing-card.featured .pricing-tier { color: var(--accent); }
.pricing-price { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; color: var(--navy); font-variant-numeric: tabular-nums; line-height: 1.1; }
.pricing-card ul { font-size: 15px; line-height: 1.45; margin-bottom: 0; }

.retro-col {
  background: var(--panel); border: 1px solid var(--line); border-top: 4px solid var(--navy);
  border-radius: 10px; padding: 14px 16px;
}
.retro-col.good { border-top-color: var(--teal); }
.retro-col.warn { border-top-color: var(--accent); }
.retro-col.act { border-top-color: var(--navy); background: var(--panel-soft); }
.retro-col h3 { font-size: 17px; margin-bottom: 8px; }
.retro-col ul:last-child { margin-bottom: 0; }

.exercise-box {
  background: var(--accent-soft); border: 1px solid var(--accent); border-radius: 10px; padding: 16px 20px;
}
.exercise-meta { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: var(--accent); margin-bottom: 6px; }
.exercise-box p:last-child, .exercise-box ol:last-child { margin-bottom: 0; }

.stat-hero { display: flex; flex-direction: column; justify-content: center; padding: 20px; background: var(--navy); color: var(--bg); border-radius: 12px; }
.stat-hero .stat-num { font-size: clamp(44px, 4.4vw, 68px); font-weight: 800; line-height: 1; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
.stat-hero .stat-caption { margin-top: 10px; font-size: 16px; opacity: 0.88; }

.table-wrap {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  overflow: hidden;
}
table { width: 100%; border-collapse: collapse; font-size: 14px; font-variant-numeric: tabular-nums; }
th, td { padding: 10px 12px; border: 1px solid var(--line); text-align: left; vertical-align: top; }
th { background: var(--navy); color: var(--bg); font-weight: 600; font-size: 0.95em; }
tr:nth-child(even) td { background: var(--panel-soft); }

.formula-box {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 18px 20px;
  overflow-x: auto;
}
.formula-box .math { font-size: 1.05em; }

.theorem-box {
  background: var(--panel);
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 16px 20px;
}
.proof-box {
  background: var(--panel-soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px 18px;
}

.metric {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--accent-soft); border: 1px solid var(--line);
  border-radius: 8px; padding: 8px 12px;
  color: var(--navy); font-weight: 600; font-size: 0.95em;
  font-variant-numeric: tabular-nums;
}

.pill {
  display: inline-block;
  background: var(--teal-soft); color: var(--teal);
  border: 1px solid var(--line);
  border-radius: 6px; padding: 4px 10px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
}

section.lead {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 64px 72px 76px;
  background: linear-gradient(135deg, var(--bg) 0%, var(--panel-soft) 100%);
  ${coverUrl ? `background-image: ${
    coverTone === 'dark'
      ? `linear-gradient(102deg, rgba(${coverScrimRgb}, 0.92) 0%, rgba(${coverScrimRgb}, 0.76) 52%, rgba(${coverScrimRgb}, 0.28) 100%), url("${coverUrl}")`
      : `linear-gradient(100deg, rgba(${coverScrimRgb}, 0.95) 0%, rgba(${coverScrimRgb}, 0.86) 46%, rgba(${coverScrimRgb}, 0.22) 100%), url("${coverUrl}")`
  };` : ''}
  background-size: cover;
  background-position: center;
  text-align: left;
}
section.lead > * { max-width: 760px; position: relative; z-index: 2; }
section.lead > .row,
section.lead > .row-3,
section.lead > .kpi-grid,
section.lead > .title-banner { max-width: 100%; width: 100%; }
section.lead header { display: none; }
section.lead h1 {
  font-size: 58px;
  line-height: 1.07;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
  text-wrap: balance;
}
section.lead h2 {
  font-size: 24px;
  line-height: 1.38;
  font-weight: 400;
  color: var(--muted);
  margin-bottom: 18px;
  letter-spacing: -0.01em;
}
section.lead h1 + p {
  font-size: 22px;
  line-height: 1.4;
  font-weight: 400;
  color: var(--muted);
  margin-bottom: 18px;
}
section.lead p:last-of-type {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
${coverUrl && coverTone === 'dark' ? `
section.lead { color: #f8fafc; }
section.lead h1, section.lead h3, section.lead strong { color: #ffffff; }
section.lead h2, section.lead p, section.lead h1 + p, section.lead .subtitle { color: rgba(241, 245, 249, 0.9); }
section.lead .eyebrow { background: rgba(255, 255, 255, 0.14); color: #ffffff; border-color: rgba(255, 255, 255, 0.28); }
section.lead footer { color: rgba(255, 255, 255, 0.72); }
section.lead footer::before { background: rgba(255, 255, 255, 0.2); }
section.lead .card { background: rgba(15, 23, 42, 0.8); border-color: rgba(255, 255, 255, 0.16); color: #f8fafc; backdrop-filter: blur(8px); }
` : `
section.lead .card { background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(8px); }
`}

section.section,
section.bento,
section.kpi,
section.timeline-slide,
section.agenda { display: flex; flex-direction: column; justify-content: flex-start; }
section.section h2,
section.bento h2,
section.kpi h2 { padding-bottom: 10px; border-bottom: 2px solid var(--accent); margin-bottom: 16px; }
section.split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); align-items: stretch; }
section.split-60-40 { display: grid; grid-template-columns: 1.45fr 1fr; gap: var(--gap); align-items: stretch; }
section.split-40-60 { display: grid; grid-template-columns: 1fr 1.45fr; gap: var(--gap); align-items: stretch; }
section.split > *, section.split-60-40 > *, section.split-40-60 > * { min-width: 0; }
section.centered { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; }
section.quote { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
section.quote blockquote { font-size: clamp(26px, 2.2vw, 36px); line-height: 1.35; padding: 20px 24px; max-width: 90%; border: none; background: transparent; font-style: italic; color: var(--navy); }
section.quote cite { margin-top: 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); font-style: normal; font-weight: 500; }

section.closing {
  display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
  padding: 64px 72px 76px;
  background: ${closingBg};
  ${coverUrl ? `background-image: linear-gradient(135deg, rgba(${closingScrimRgb}, 0.92) 0%, rgba(${closingScrimRgb}, 0.78) 100%), url("${coverUrl}");` : ''}
  background-size: cover;
  background-position: center;
  color: ${closingInk};
}
section.closing h1 { font-size: 54px; line-height: 1.08; letter-spacing: -0.025em; margin-bottom: 16px; }
section.closing h1, section.closing h2, section.closing h3,
section.closing p, section.closing li, section.closing strong,
section.closing .eyebrow, section.closing .kicker { color: ${closingInk}; }
section.closing .eyebrow { border-color: rgba(255,255,255,0.24); background: rgba(255,255,255,0.1); }
section.closing header, section.closing footer { color: rgba(255, 255, 255, 0.72); }
section.closing footer::before { background: rgba(255, 255, 255, 0.18); }

section.standout {
  display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
  padding: 64px 72px 76px;
  background: var(--navy);
  ${coverUrl ? `background-image: linear-gradient(135deg, rgba(${closingScrimRgb}, 0.92) 0%, rgba(${closingScrimRgb}, 0.76) 100%), url("${coverUrl}");` : ''}
  background-size: cover;
  background-position: center;
  color: #f8fafc;
}
section.standout h1 { font-size: 54px; line-height: 1.08; letter-spacing: -0.025em; margin-bottom: 16px; }
section.standout h1, section.standout h2, section.standout p, section.standout .eyebrow, section.standout .kicker { color: #f8fafc; }
section.standout .eyebrow { border-color: rgba(255,255,255,0.24); background: rgba(255,255,255,0.1); }
section.standout header, section.standout footer { color: rgba(255, 255, 255, 0.72); }
section.standout footer::before { background: rgba(255, 255, 255, 0.18); }

section.split-hero {
  display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 0; padding: 0;
}
section.split-hero header, section.split-hero footer { display: none; }
section.split-hero > .hero-left {
  display: flex; flex-direction: column; justify-content: center; padding: 56px 60px;
  background: var(--navy); color: var(--bg);
}
section.split-hero > .hero-left h1 { font-size: 46px; line-height: 1.1; letter-spacing: -0.025em; margin-bottom: 16px; }
section.split-hero > .hero-left h1, section.split-hero > .hero-left p, section.split-hero > .hero-left .eyebrow { color: var(--bg); }
section.split-hero > .hero-left .eyebrow { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.08); }
section.split-hero > .hero-right {
  display: flex; flex-direction: column; justify-content: flex-end; padding: 40px;
  background: var(--panel-soft);
  ${coverUrl ? `background-image: linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.68) 100%), url("${coverUrl}");` : ''}
  background-size: cover;
  background-position: center;
}
section.split-hero > .hero-right .card {
  background: rgba(255, 255, 255, 0.94);
  border-color: rgba(255, 255, 255, 0.72);
  color: #18181b;
  backdrop-filter: blur(10px);
}
section.split-hero > .hero-right .card h3 { color: var(--accent); }
section.split-hero > .hero-right .card strong { color: #09090b; }

pre, code { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; line-height: 1.65; }
pre { background: ${codeBg}; color: ${codeInk}; border-radius: 8px; padding: 16px 18px; overflow: auto; margin: 14px 0; border: 1px solid var(--line); }
code:not(pre code) { background: var(--panel-soft); color: var(--accent); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
pre code { background: transparent; color: inherit; padding: 0; font-size: inherit; }

.hl-keyword { color: #c084fc; }
.hl-function { color: #60a5fa; }
.hl-string { color: #93c5fd; }
.hl-number { color: #fb923c; }
.hl-comment { color: #94a3b8; font-style: italic; }

.morph-target { view-transition-name: attr(data-morph-name, morph); contain: layout paint; }

.mermaid-diagram {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px;
  margin: 10px 0;
  max-height: 440px;
  overflow: hidden;
}
.mermaid-diagram svg {
  max-width: 100%;
  max-height: 400px;
  height: auto;
}

[data-fragment] {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.42s var(--ease-out), transform 0.42s var(--ease-out), filter 0.42s var(--ease-out);
}
[data-fragment][data-anim="zoom"] { transform: scale(0.92); }
[data-fragment][data-anim="left"] { transform: translateX(-24px); }
[data-fragment][data-anim="right"] { transform: translateX(24px); }
[data-fragment][data-anim="down"] { transform: translateY(-16px); }
[data-fragment][data-anim="blur"] { filter: blur(6px); transform: scale(0.98); }
[data-fragment][data-anim="pop"] { transform: scale(0.86); transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
[data-fragment][data-anim="flip"] { transform: perspective(700px) rotateX(12deg) translateY(8px); }
[data-fragment]:not(.fragment-visible) { animation: none !important; opacity: 0 !important; }
[data-fragment].fragment-visible { opacity: 1 !important; transform: none !important; filter: blur(0) !important; }
[data-fragment].fragment-visible:not(.fragment-active) { animation: none !important; }

.fragment-counter {
  position: fixed; bottom: 20px; right: 20px;
  background: var(--navy); color: var(--bg);
  padding: 6px 12px; border-radius: 6px;
  font-size: 11px; font-family: 'JetBrains Mono', monospace;
  opacity: 0; pointer-events: none; z-index: 100;
}
section[data-fragment-progress] .fragment-counter { opacity: 0.85; }

@keyframes fadeRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes cardIn { from { opacity: 0; transform: translateY(8px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes zoomReveal { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }
@keyframes slideFromLeft { from { opacity: 0; transform: translateX(-22px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideFromRight { from { opacity: 0; transform: translateX(22px); } to { opacity: 1; transform: translateX(0); } }
@keyframes focusUnblur { from { opacity: 0; filter: blur(8px); transform: scale(0.98); } to { opacity: 1; filter: blur(0); transform: scale(1); } }
@keyframes popBounce { from { opacity: 0; transform: scale(0.86); } to { opacity: 1; transform: scale(1); } }
@keyframes meterGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes floatGentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes strokeDraw { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }

@keyframes marp-outgoing-transition-rise {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(calc(var(--marp-transition-direction, 1) * -5%)) scale(0.99); }
}
@keyframes marp-incoming-transition-rise {
  from { opacity: 0; transform: translateY(calc(var(--marp-transition-direction, 1) * 5%)) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes marp-outgoing-transition-veil {
  from { clip-path: inset(0 0 0 0); }
  to { clip-path: inset(0 0 100% 0); }
}
@keyframes marp-incoming-transition-veil {
  from { clip-path: inset(0 0 100% 0); }
  to { clip-path: inset(0 0 0 0); }
}
@keyframes marp-outgoing-transition-focus {
  from { opacity: 1; filter: blur(0); transform: scale(1); }
  to { opacity: 0; filter: blur(8px); transform: scale(1.02); }
}
@keyframes marp-incoming-transition-focus {
  from { opacity: 0; filter: blur(8px); transform: scale(0.98); }
  to { opacity: 1; filter: blur(0); transform: scale(1); }
}
@keyframes marp-outgoing-transition-wipe {
  from { clip-path: inset(0 0 0 0); }
  to { clip-path: inset(0 0 0 100%); }
}
@keyframes marp-incoming-transition-wipe {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
@keyframes marp-outgoing-transition-iris {
  from { clip-path: circle(100% at 50% 50%); opacity: 1; }
  to { clip-path: circle(0% at 50% 50%); opacity: 0.4; }
}
@keyframes marp-incoming-transition-iris {
  from { clip-path: circle(0% at 50% 50%); }
  to { clip-path: circle(100% at 50% 50%); }
}
@keyframes marp-outgoing-transition-glide {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(calc(var(--marp-transition-direction, 1) * -8%)); }
}
@keyframes marp-incoming-transition-glide {
  from { opacity: 0; transform: translateX(calc(var(--marp-transition-direction, 1) * 8%)); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes marp-outgoing-transition-flip {
  from { opacity: 1; transform: perspective(1200px) rotateY(0deg); }
  to { opacity: 0; transform: perspective(1200px) rotateY(calc(var(--marp-transition-direction, 1) * -45deg)); }
}
@keyframes marp-incoming-transition-flip {
  from { opacity: 0; transform: perspective(1200px) rotateY(calc(var(--marp-transition-direction, 1) * 45deg)); }
  to { opacity: 1; transform: perspective(1200px) rotateY(0deg); }
}

@media screen {
  .animate-in > * { animation: fadeRise var(--dur-base) var(--ease-out) both; }
  .animate-in > *:nth-child(2) { animation-delay: var(--stagger); }
  .animate-in > *:nth-child(3) { animation-delay: calc(var(--stagger) * 2); }
  .animate-in > *:nth-child(4) { animation-delay: calc(var(--stagger) * 3); }
  .animate-in > *:nth-child(5) { animation-delay: calc(var(--stagger) * 4); }
  .animate-in > *:nth-child(6) { animation-delay: calc(var(--stagger) * 5); }
  .animate-zoom > * { animation: zoomReveal 0.45s var(--ease-out) both; }
  .animate-left > * { animation: slideFromLeft 0.45s var(--ease-out) both; }
  .animate-right > * { animation: slideFromRight 0.45s var(--ease-out) both; }
  .animate-blur > * { animation: focusUnblur 0.5s var(--ease-out) both; }
  .animate-pop > * { animation: popBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .stagger-list > li { animation: fadeRise 0.4s var(--ease-out) both; }
  .stagger-list > li:nth-child(1) { animation-delay: 0.04s; }
  .stagger-list > li:nth-child(2) { animation-delay: 0.12s; }
  .stagger-list > li:nth-child(3) { animation-delay: 0.2s; }
  .stagger-list > li:nth-child(4) { animation-delay: 0.28s; }
  .stagger-list > li:nth-child(5) { animation-delay: 0.36s; }
  .card, .kpi-card, .timeline-step, .callout, .formula-box, .table-wrap, blockquote { animation: cardIn var(--dur-slow) var(--ease-out) both; }
  .kpi-grid > .kpi-card:nth-child(2), .bento-grid > *:nth-child(2), .timeline > .timeline-step:nth-child(2), .row > .card:nth-child(2), .row-3 > .card:nth-child(2) { animation-delay: 0.08s; }
  .kpi-grid > .kpi-card:nth-child(3), .bento-grid > *:nth-child(3), .timeline > .timeline-step:nth-child(3), .row-3 > .card:nth-child(3) { animation-delay: 0.16s; }
  .bento-grid > *:nth-child(4), .timeline > .timeline-step:nth-child(4) { animation-delay: 0.24s; }
  .float-gentle { animation: floatGentle 4.2s ease-in-out infinite; }
  .svg-draw path, .svg-draw circle, .svg-draw rect, .svg-draw line { stroke-dasharray: 600; animation: strokeDraw 1.2s var(--ease-out) both; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}

@media print {
  section, section *, header, footer, .card, .kpi-card, .timeline-step, .callout, .formula-box, .table-wrap, blockquote {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .animate-in > *, .animate-zoom > *, .animate-left > *, .animate-right > *, .animate-blur > *, .animate-pop > *,
  .stagger-list > li, .card, .kpi-card, .timeline-step, .callout, .meter-fill, .formula-box, .table-wrap, blockquote, [data-fragment] {
    animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; clip-path: none !important;
  }
}

${extraCss}
`;
}

const THEMES = [
  {
    id: 'anime',
    name: 'Anime Motion',
    tagline: 'Purposeful academic motion with crimson accents, MathJax, and View Transitions',
    bestFor: 'Algebraic geometry, lectures, interactive step-by-step talks',
    fonts: 'Inter + JetBrains Mono',
    isDark: false,
    swatches: ['#fafafa', '#0f172a', '#c0392b', '#0d9488'],
    css: `${baseAnimeCss}
.mermaid-diagram { display: flex; justify-content: center; align-items: center; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin: 10px 0; max-height: 440px; overflow: hidden; }
.mermaid-diagram svg { max-width: 100%; max-height: 400px; height: auto; }
${COVER_DATA_URIS.academic ? `
section.lead {
  background-image: linear-gradient(100deg, rgba(250, 250, 250, 0.95) 0%, rgba(250, 250, 250, 0.86) 46%, rgba(250, 250, 250, 0.22) 100%), url("${COVER_DATA_URIS.academic}");
  background-size: cover;
  background-position: center;
}
@media (prefers-color-scheme: dark) {
  section.lead {
    background-image: linear-gradient(100deg, rgba(13, 17, 23, 0.93) 0%, rgba(13, 17, 23, 0.80) 50%, rgba(13, 17, 23, 0.34) 100%), url("${COVER_DATA_URIS.academic}");
  }
}
section.closing {
  background-image: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.78) 100%), url("${COVER_DATA_URIS.academic}");
  background-size: cover;
  background-position: center;
}
section.standout {
  background-image: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.76) 100%), url("${COVER_DATA_URIS.academic}");
  background-size: cover;
  background-position: center;
}
section.split-hero > .hero-right {
  background-image: linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.68) 100%), url("${COVER_DATA_URIS.academic}");
  background-size: cover;
  background-position: center;
}
` : ''}
`,
  },
  {
    id: 'nordic',
    name: 'Nordic Minimal',
    tagline: 'Airy Scandinavian paper canvas with glacial teal accents and clean spatial rhythm',
    bestFor: 'Clean starters, product specs, design system audits, everyday decks',
    fonts: 'Plus Jakarta Sans + DM Sans',
    isDark: false,
    swatches: ['#f8fafc', '#0f172a', '#0d9488', '#0284c7'],
    css: buildThemedCss({
      id: 'nordic',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');",
      fontBody: "'DM Sans', system-ui, sans-serif",
      fontDisplay: "'Plus Jakarta Sans', system-ui, sans-serif",
      bg: '#f8fafc',
      panel: '#ffffff',
      panelSoft: '#f1f5f9',
      ink: '#1e293b',
      muted: '#475569',
      line: '#e2e8f0',
      navy: '#0f172a',
      accent: '#0d9488',
      accentSoft: '#f0fdfa',
      teal: '#0284c7',
      tealSoft: '#f0f9ff',
      shadow: 'rgba(15, 23, 42, 0.05)',
      codeBg: '#0f172a',
      codeInk: '#e2e8f0',
      topStripe: 'linear-gradient(90deg, #0d9488, #0284c7)',
      closingBg: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
      closingInk: '#f8fafc',
      coverKey: 'studio',
      coverTone: 'light',
      coverScrimRgb: '248, 250, 252',
      closingScrimRgb: '15, 36, 42',
      extraCss: `
        .card, .kpi-card, .timeline-step { border-radius: 12px; }
      `,
    }),
  },
  {
    id: 'keynote',
    name: 'Midnight Keynote',
    tagline: 'Velvet dark presentation stage with radial spotlighting and violet-amber accents',
    bestFor: 'Product keynotes, developer conferences, launch reveals',
    fonts: 'Outfit + Plus Jakarta Sans + JetBrains Mono',
    isDark: true,
    swatches: ['#09090b', '#18181b', '#8b5cf6', '#f59e0b'],
    css: buildThemedCss({
      id: 'keynote',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');",
      fontBody: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontDisplay: "'Outfit', system-ui, sans-serif",
      bg: '#09090b',
      panel: '#141418',
      panelSoft: '#1c1c24',
      ink: '#e4e4e7',
      muted: '#a1a1aa',
      line: '#27272f',
      navy: '#fafafa',
      accent: '#8b5cf6',
      accentSoft: '#231942',
      teal: '#f59e0b',
      tealSoft: '#2b1d07',
      shadow: 'rgba(0, 0, 0, 0.45)',
      codeBg: '#050507',
      codeInk: '#e4e4e7',
      topStripe: 'linear-gradient(90deg, #8b5cf6, #f59e0b)',
      closingBg: 'radial-gradient(circle at 80% 20%, #2e1065 0%, #09090b 70%)',
      closingInk: '#fafafa',
      coverKey: 'keynote',
      coverTone: 'dark',
      coverScrimRgb: '9, 9, 14',
      closingScrimRgb: '18, 12, 34',
      extraCss: `
        th { background: #1e1b4b; color: #fafafa; }
      `,
    }),
  },
  {
    id: 'blueprint',
    name: 'Technical Blueprint',
    tagline: 'Precision architectural grid backdrop with monospace headers and cyan drafting rules',
    bestFor: 'System architecture, cloud topology, engineering RFCs, hardware specs',
    fonts: 'JetBrains Mono + Plus Jakarta Sans',
    isDark: true,
    swatches: ['#0b192c', '#132743', '#38bdf8', '#fbbf24'],
    css: buildThemedCss({
      id: 'blueprint',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');",
      fontBody: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontDisplay: "'JetBrains Mono', ui-monospace, monospace",
      bg: '#0b192c',
      panel: '#11223a',
      panelSoft: '#162d4c',
      ink: '#e2e8f0',
      muted: '#94a3b8',
      line: '#234168',
      navy: '#f8fafc',
      accent: '#38bdf8',
      accentSoft: '#0c2d48',
      teal: '#fbbf24',
      tealSoft: '#2e2208',
      shadow: 'rgba(2, 6, 23, 0.4)',
      codeBg: '#071120',
      codeInk: '#e2e8f0',
      topStripe: 'linear-gradient(90deg, #38bdf8, #fbbf24)',
      closingBg: 'linear-gradient(135deg, #071120 0%, #11223a 100%)',
      closingInk: '#f8fafc',
      coverKey: 'blueprint',
      coverTone: 'dark',
      coverScrimRgb: '11, 25, 44',
      closingScrimRgb: '7, 17, 32',
      extraCss: `
        section:not(.lead):not(.closing):not(.standout):not(.split-hero) {
          background-color: #0b192c;
          background-image:
            linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .card, .kpi-card, .timeline-step, .table-wrap { border-radius: 4px; }
        th { background: #1e3a5f; color: #f8fafc; }
      `,
    }),
  },
  {
    id: 'atelier',
    name: 'Warm Atelier',
    tagline: 'Editorial porcelain canvas pairing classic serif headlines with terracotta metrics',
    bestFor: 'Seed & Series A pitch decks, brand narratives, annual reports',
    fonts: 'Playfair Display + DM Sans + JetBrains Mono',
    isDark: false,
    swatches: ['#faf8f5', '#1c1917', '#c2410c', '#047857'],
    css: buildThemedCss({
      id: 'atelier',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');",
      fontBody: "'DM Sans', system-ui, sans-serif",
      fontDisplay: "'Playfair Display', Georgia, serif",
      bg: '#faf8f5',
      panel: '#ffffff',
      panelSoft: '#f2ede4',
      ink: '#292524',
      muted: '#57534e',
      line: '#e2dcd1',
      navy: '#1c1917',
      accent: '#c2410c',
      accentSoft: '#fff7ed',
      teal: '#047857',
      tealSoft: '#ecfdf5',
      shadow: 'rgba(28, 25, 23, 0.05)',
      codeBg: '#1c1917',
      codeInk: '#faf8f5',
      topStripe: 'linear-gradient(90deg, #c2410c, #047857)',
      closingBg: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
      closingInk: '#faf8f5',
      coverKey: 'academic',
      coverTone: 'light',
      coverScrimRgb: '250, 248, 245',
      closingScrimRgb: '28, 25, 23',
    }),
  },
  {
    id: 'theorem',
    name: 'Theorem Chalkboard',
    tagline: 'Archival ivory canvas with editorial serif titles and boxed lemma frames',
    bestFor: 'Physics, pure mathematics, formal proofs, seminar talks',
    fonts: 'Source Serif 4 + DM Sans + JetBrains Mono',
    isDark: false,
    swatches: ['#fafaf6', '#14261c', '#1d4ed8', '#b45309'],
    css: buildThemedCss({
      id: 'theorem',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:ital,wght@0,600;0,700;1,500&display=swap');",
      fontBody: "'DM Sans', system-ui, sans-serif",
      fontDisplay: "'Source Serif 4', Georgia, serif",
      bg: '#fafaf6',
      panel: '#ffffff',
      panelSoft: '#f2f1eb',
      ink: '#1f2937',
      muted: '#4b5563',
      line: '#ddd9ce',
      navy: '#14261c',
      accent: '#1d4ed8',
      accentSoft: '#eff6ff',
      teal: '#b45309',
      tealSoft: '#fffbeb',
      shadow: 'rgba(20, 38, 28, 0.06)',
      codeBg: '#14261c',
      codeInk: '#e7f0ea',
      topStripe: 'linear-gradient(90deg, #1d4ed8, #14261c)',
      closingBg: 'linear-gradient(135deg, #14261c 0%, #1e3a2f 100%)',
      closingInk: '#fafaf6',
      coverKey: 'academic',
      coverTone: 'light',
      coverScrimRgb: '250, 250, 246',
      closingScrimRgb: '20, 38, 28',
    }),
  },
  {
    id: 'swiss',
    name: 'Swiss Typographic Grid',
    tagline: 'High-contrast modernist grid with razor hairline rules and international red',
    bestFor: 'Product launches, design reviews, clinical science readouts',
    fonts: 'Plus Jakarta Sans + JetBrains Mono',
    isDark: false,
    swatches: ['#ffffff', '#111111', '#dc2626', '#525252'],
    css: buildThemedCss({
      id: 'swiss',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');",
      fontBody: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontDisplay: "'Plus Jakarta Sans', system-ui, sans-serif",
      bg: '#ffffff',
      panel: '#fafafa',
      panelSoft: '#f4f4f5',
      ink: '#18181b',
      muted: '#52525b',
      line: '#e4e4e7',
      navy: '#09090b',
      accent: '#dc2626',
      accentSoft: '#fef2f2',
      teal: '#09090b',
      tealSoft: '#f4f4f5',
      shadow: 'rgba(0, 0, 0, 0.04)',
      codeBg: '#09090b',
      codeInk: '#f4f4f5',
      topStripe: '#dc2626',
      closingBg: '#09090b',
      closingInk: '#ffffff',
      coverKey: 'studio',
      coverTone: 'light',
      coverScrimRgb: '255, 255, 255',
      closingScrimRgb: '9, 9, 11',
      extraCss: `
        section::before { height: 6px; }
        .card, .kpi-card, .timeline-step, .formula-box, .table-wrap { border-radius: 4px; }
      `,
    }),
  },
  {
    id: 'executive',
    name: 'Executive Slate',
    tagline: 'Boardroom alabaster and deep navy with tabular KPI grids',
    bestFor: 'Quarterly reviews, financial decks, investor briefings',
    fonts: 'Manrope + JetBrains Mono',
    isDark: false,
    swatches: ['#f8fafc', '#0f172a', '#0369a1', '#0f766e'],
    css: buildThemedCss({
      id: 'executive',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');",
      fontBody: "'Manrope', system-ui, sans-serif",
      fontDisplay: "'Manrope', system-ui, sans-serif",
      bg: '#f8fafc',
      panel: '#ffffff',
      panelSoft: '#f1f5f9',
      ink: '#1e293b',
      muted: '#64748b',
      line: '#cbd5e1',
      navy: '#0f172a',
      accent: '#0369a1',
      accentSoft: '#f0f9ff',
      teal: '#0f766e',
      tealSoft: '#f0fdfa',
      shadow: 'rgba(15, 23, 42, 0.06)',
      codeBg: '#0f172a',
      codeInk: '#e2e8f0',
      topStripe: 'linear-gradient(90deg, #0f172a, #0369a1)',
      closingBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      closingInk: '#f8fafc',
      coverKey: 'studio',
      coverTone: 'dark',
      coverScrimRgb: '15, 23, 42',
      closingScrimRgb: '15, 23, 42',
    }),
  },
  {
    id: 'obsidian',
    name: 'Obsidian Terminal',
    tagline: 'Deep charcoal engineering canvas built for systems architecture and ML code',
    bestFor: 'Engineering RFCs, ML papers, developer keynotes, postmortems',
    fonts: 'Plus Jakarta Sans + JetBrains Mono',
    isDark: true,
    swatches: ['#0b0f19', '#131b2e', '#38bdf8', '#34d399'],
    css: buildThemedCss({
      id: 'obsidian',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');",
      fontBody: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontDisplay: "'Plus Jakarta Sans', system-ui, sans-serif",
      bg: '#0b0f19',
      panel: '#131b2e',
      panelSoft: '#1a243d',
      ink: '#e2e8f0',
      muted: '#94a3b8',
      line: '#26334d',
      navy: '#f8fafc',
      accent: '#38bdf8',
      accentSoft: '#0c273b',
      teal: '#34d399',
      tealSoft: '#0d2e24',
      shadow: 'rgba(0, 0, 0, 0.35)',
      codeBg: '#060911',
      codeInk: '#e2e8f0',
      topStripe: 'linear-gradient(90deg, #38bdf8, #34d399)',
      closingBg: 'linear-gradient(135deg, #060911 0%, #131b2e 100%)',
      closingInk: '#f8fafc',
      coverKey: 'blueprint',
      coverTone: 'dark',
      coverScrimRgb: '11, 15, 25',
      closingScrimRgb: '6, 9, 17',
      extraCss: `
        th { background: #1e293b; color: #f8fafc; }
      `,
    }),
  },
  {
    id: 'monograph',
    name: 'Editorial Monograph',
    tagline: 'Warm archival paper with literary serif headings and sienna rules',
    bestFor: 'Humanities colloquia, history lectures, legal & policy briefings',
    fonts: 'Cormorant Garamond + DM Sans + JetBrains Mono',
    isDark: false,
    swatches: ['#f5f2eb', '#1c1917', '#9a3412', '#57534e'],
    css: buildThemedCss({
      id: 'monograph',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');",
      fontBody: "'DM Sans', system-ui, sans-serif",
      fontDisplay: "'Cormorant Garamond', Georgia, serif",
      bg: '#f5f2eb',
      panel: '#fcfbf8',
      panelSoft: '#ece6da',
      ink: '#292524',
      muted: '#57534e',
      line: '#d6cfc2',
      navy: '#1c1917',
      accent: '#9a3412',
      accentSoft: '#fff7ed',
      teal: '#3f6212',
      tealSoft: '#f7fee7',
      shadow: 'rgba(28, 25, 23, 0.05)',
      codeBg: '#1c1917',
      codeInk: '#f5f2eb',
      topStripe: 'linear-gradient(90deg, #9a3412, #57534e)',
      closingBg: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
      closingInk: '#f5f2eb',
      coverKey: 'academic',
      coverTone: 'light',
      coverScrimRgb: '245, 242, 235',
      closingScrimRgb: '28, 25, 23',
    }),
  },
  {
    id: 'beamer-madrid',
    name: 'Cambridge Academic',
    tagline: 'Overleaf Beamer Madrid/CambridgeUS frame banners, titled theorem blocks, and structured footlines',
    bestFor: 'Conference paper defenses, peer reviews, formal university lectures',
    fonts: 'Source Serif 4 + DM Sans + JetBrains Mono',
    isDark: false,
    swatches: ['#fcfcfc', '#271317', '#881c28', '#0f766e'],
    css: buildThemedCss({
      id: 'beamer-madrid',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:ital,wght@0,600;0,700;1,500&display=swap');",
      fontBody: "'DM Sans', system-ui, sans-serif",
      fontDisplay: "'Source Serif 4', Georgia, serif",
      bg: '#fcfcfc',
      panel: '#ffffff',
      panelSoft: '#f4f0f1',
      ink: '#1f2937',
      muted: '#57534e',
      line: '#e2d8da',
      navy: '#271317',
      accent: '#881c28',
      accentSoft: '#fdf2f4',
      teal: '#0f766e',
      tealSoft: '#f0fdfa',
      shadow: 'rgba(39, 19, 23, 0.06)',
      codeBg: '#271317',
      codeInk: '#faf5f6',
      topStripe: '#881c28',
      closingBg: 'linear-gradient(135deg, #5c121b 0%, #271317 100%)',
      closingInk: '#fcfcfc',
      coverKey: 'academic',
      coverTone: 'light',
      coverScrimRgb: '252, 252, 252',
      closingScrimRgb: '39, 19, 23',
      extraCss: `
        section::before { display: none; }
        header {
          top: 0; left: 0; right: 0;
          padding: 6px var(--pad-x);
          background: #5c121b;
          color: rgba(255, 255, 255, 0.9);
          font-size: 10px;
          font-weight: 600;
        }
        section:not(.lead):not(.closing):not(.standout):not(.quote):not(.split-hero) {
          padding-top: 98px;
        }
        section:not(.lead):not(.closing):not(.standout):not(.quote):not(.split-hero) > h1:first-of-type {
          position: absolute;
          top: 26px;
          left: 0;
          right: 0;
          margin: 0;
          padding: 13px var(--pad-x);
          background: #881c28;
          color: #ffffff;
          font-size: 25px;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        section.lead .title-banner {
          width: 100%;
          max-width: 100%;
          background: #881c28;
          color: #ffffff;
          border-radius: 12px;
          padding: 28px 34px;
          box-shadow: 0 12px 30px rgba(39, 19, 23, 0.24);
        }
        section.lead .title-banner h1 { color: #ffffff; font-size: 46px; line-height: 1.12; margin-bottom: 10px; }
        section.lead .title-banner p { color: rgba(255,255,255,0.92); font-size: 20px; margin-bottom: 0; }
        footer {
          left: 0; right: 0; bottom: 0;
          padding: 8px var(--pad-x);
          background: #f4f0f1;
          border-top: 2px solid #881c28;
          color: #3f2e32;
          font-weight: 600;
        }
        section.closing footer {
          background: #271317;
          border-top-color: rgba(255, 255, 255, 0.22);
          color: rgba(255, 255, 255, 0.8);
        }
        footer::before { display: none; }
        .beamer-block .beamer-block-title { background: #271317; color: #ffffff; }
      `,
    }),
  },
  {
    id: 'metropolis',
    name: 'Metropolis Progress',
    tagline: 'Overleaf Metropolis clean geometric architecture with charcoal frame headers and amber progress rules',
    bestFor: 'Thesis seminars, CS colloquia, structured research talks',
    fonts: 'Fira Sans + Fira Mono',
    isDark: false,
    swatches: ['#fafafa', '#23373b', '#eb811b', '#14817c'],
    css: buildThemedCss({
      id: 'metropolis',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500&family=Fira+Sans:wght@400;500;600;700&display=swap');",
      fontBody: "'Fira Sans', system-ui, sans-serif",
      fontDisplay: "'Fira Sans', system-ui, sans-serif",
      bg: '#fafafa',
      panel: '#ffffff',
      panelSoft: '#eff2f3',
      ink: '#23373b',
      muted: '#5c6b6e',
      line: '#d6dfe1',
      navy: '#23373b',
      accent: '#eb811b',
      accentSoft: '#fff7ed',
      teal: '#14817c',
      tealSoft: '#f0fdfa',
      shadow: 'rgba(35, 55, 59, 0.06)',
      codeBg: '#1c2b2f',
      codeInk: '#edf2f4',
      topStripe: 'linear-gradient(90deg, #23373b 70%, #eb811b 70%)',
      closingBg: '#23373b',
      closingInk: '#fafafa',
      coverKey: 'keynote',
      coverTone: 'dark',
      coverScrimRgb: '35, 55, 59',
      closingScrimRgb: '28, 43, 47',
      extraCss: `
        header {
          top: 19px; left: auto; right: var(--pad-x);
          text-align: right; color: rgba(250, 250, 250, 0.72); z-index: 20;
        }
        section:not(.lead):not(.closing):not(.standout):not(.quote):not(.split-hero) {
          padding-top: 86px;
        }
        section:not(.lead):not(.closing):not(.standout):not(.quote):not(.split-hero) > h1:first-of-type {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          margin: 0;
          padding: 15px var(--pad-x);
          background: #23373b;
          color: #fafafa;
          font-size: 25px;
          font-weight: 600;
          border-bottom: 3px solid #eb811b;
        }
        section.lead { background-color: #23373b; color: #fafafa; }
        section.lead h1, section.lead p, section.lead strong { color: #fafafa; }
        section.lead h1 { padding-bottom: 14px; border-bottom: 3px solid #eb811b; }
        section.lead .eyebrow { background: rgba(235, 129, 27, 0.18); color: #fdba74; border-color: rgba(235, 129, 27, 0.45); }
        section.lead footer { color: rgba(250, 250, 250, 0.72); }
        section.lead footer::before { background: rgba(250, 250, 250, 0.2); }
        section.standout h1 { border-bottom: 3px solid #eb811b; padding-bottom: 12px; }
      `,
    }),
  },
  {
    id: 'editorial-split',
    name: 'Studio Splitscreen',
    tagline: 'Editorial agency lookbook with split-canvas covers, sculptural serifs, and moss highlights',
    bestFor: 'Client case studies, creative portfolios, before-and-after reviews',
    fonts: 'Fraunces + Plus Jakarta Sans + JetBrains Mono',
    isDark: false,
    swatches: ['#f5f4f0', '#18181b', '#3f6212', '#b45309'],
    css: buildThemedCss({
      id: 'editorial-split',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');",
      fontBody: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontDisplay: "'Fraunces', Georgia, serif",
      bg: '#f5f4f0',
      panel: '#ffffff',
      panelSoft: '#eae8e1',
      ink: '#27272a',
      muted: '#52525b',
      line: '#d6d3cb',
      navy: '#18181b',
      accent: '#3f6212',
      accentSoft: '#f7fee7',
      teal: '#b45309',
      tealSoft: '#fffbeb',
      shadow: 'rgba(24, 24, 27, 0.05)',
      codeBg: '#18181b',
      codeInk: '#f5f4f0',
      topStripe: 'linear-gradient(90deg, #18181b, #3f6212)',
      closingBg: '#18181b',
      closingInk: '#f5f4f0',
      coverKey: 'studio',
      coverTone: 'light',
      coverScrimRgb: '245, 244, 240',
      closingScrimRgb: '24, 24, 27',
    }),
  },
  {
    id: 'botanical-esg',
    name: 'Verdant Impact',
    tagline: 'Deep forest emerald and sage report styling tailored for annual impact and sustainability decks',
    bestFor: 'ESG annual reports, nonprofit briefings, healthcare & climate programs',
    fonts: 'Bricolage Grotesque + DM Sans + JetBrains Mono',
    isDark: false,
    swatches: ['#f6faf7', '#064e3b', '#059669', '#d97706'],
    css: buildThemedCss({
      id: 'botanical-esg',
      fontImport: "@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');",
      fontBody: "'DM Sans', system-ui, sans-serif",
      fontDisplay: "'Bricolage Grotesque', system-ui, sans-serif",
      bg: '#f6faf7',
      panel: '#ffffff',
      panelSoft: '#e8f3ec',
      ink: '#1b3129',
      muted: '#4d6b5f',
      line: '#cde0d4',
      navy: '#064e3b',
      accent: '#059669',
      accentSoft: '#ecfdf5',
      teal: '#d97706',
      tealSoft: '#fffbeb',
      shadow: 'rgba(6, 78, 59, 0.06)',
      codeBg: '#064e3b',
      codeInk: '#ecfdf5',
      topStripe: 'linear-gradient(90deg, #064e3b, #059669)',
      closingBg: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
      closingInk: '#f6faf7',
      coverKey: 'botanical',
      coverTone: 'dark',
      coverScrimRgb: '6, 44, 34',
      closingScrimRgb: '4, 38, 29',
    }),
  },
];

const THEME_MAP = new Map(THEMES.map((t) => [t.id, t]));

module.exports = {
  THEMES,
  THEME_MAP,
};

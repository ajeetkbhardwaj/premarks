---
marp: true
theme: anime
size: 16:9
paginate: true
math: mathjax
header: 'Algebraic Geometry \u00b7 Motion Lab'
footer: 'Animation System \u00b7 Ajeet Kumar'
transition: fade 0.5s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Complete Feature Showcase</span>

# Anime Slides

## Every animation & layout feature in one deck

<kbd>Space</kbd>/<kbd>\u2192</kbd> = next fragment · <kbd>\u2190</kbd> = previous · <kbd>Home</kbd>/<kbd>End</kbd> = reset/all

---

<!-- _class: section animate-in -->

# Layout Classes

<div class="row" data-fragment="1">

<div class="stack">

### `lead`
Title slide, centered, gradient bg

</div>

<div class="stack">

### `section`
Chapter divider, accent underline

</div>

<div class="stack">

### `split`
Two-column equal grid

</div>

<div class="stack">

### `centered`
Centered content

</div>

<div class="stack">

### `quote`
Large centered blockquote

</div>

<div class="stack">

### `closing`
Dark gradient finale

</div>

</div>

<p data-fragment="2" class="eyebrow">All classes work with <code>animate-in</code> for staggered entrance</p>

---

<!-- transition: rise 0.55s -->
<!-- _class: section animate-in -->

# Spacing & Grid Utilities

<div class="row-3" data-fragment="1">

<div class="card">

### `.stack`
Vertical flex column

</div>

<div class="card">

### `.row`
2-col grid

</div>

<div class="card">

### `.row-3`
3-col grid

</div>

</div>

<div class="row" data-fragment="2">

<div class="card">

### `.split`
50/50 split

</div>

<div class="card">

### `.media`
Image + text

</div>

<div class="card">

### `.card-list`
2-col card grid

</div>

</div>

<div data-fragment="3" class="eyebrow">Modifiers: <code>.compact</code> <code>.spacious</code> <code>.fill</code></div>

---

<!-- transition: veil 0.55s -->
<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### Cards & Panels

<div class="card">

**`.card`** — Elevated panel with hover lift

</div>

<div class="card">

**`.formula-box`** — Framed math container

</div>

<div class="card">

**`.table-wrap`** — Styled scrollable table

</div>

<div class="card">

**`blockquote`** — Accent-left quote

</div>

</div>

<div class="stack" data-fragment="2">

### Interactive States

<div class="card" style="transition: all 0.2s;">

**Hover this card** → lifts + shadow

</div>

<div class="formula-box">

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

</div>

<blockquote data-fragment="3">

Responsive: stacks to 1-col at <code>1100px</code>

</blockquote>

</div>

---

<!-- _class: section animate-in -->

# Typography System

<div class="row" data-fragment="1">

<div class="stack">

### Headings

# H1 — clamp(36px, 3vw, 56px)
## H2 — clamp(26px, 2.2vw, 36px)
### H3 — accent color
#### H4
##### H5
###### H6

</div>

<div class="stack">

### Inline Elements

**Strong** · <em>Emphasis</em> · <code>code</code> · <a href="#">link</a> · <mark>mark</mark>

<span class="eyebrow">eyebrow</span>
<span class="kicker">kicker</span>
<span class="pill">pill</span>
<span class="metric">metric 42</span>

</div>

</div>

<div data-fragment="2">

### Lists

- Unordered list item
- Second item with <strong>bold</strong>
- Third item

1. Ordered step one
2. Ordered step two
3. Ordered step three

</div>

---

<!-- transition: focus 0.6s -->
<!-- _class: section animate-in -->

# Color Palette (CSS Variables)

<div class="row-3" data-fragment="1">

<div class="card">

### Light Theme (default)

```css
--bg: #fafafa
--panel: #ffffff
--ink: #1a1a2e
--muted: #52525b
--line: #e4e4e7
--navy: #0f172a
--accent: #c0392b
--accent-soft: #fef2f2
--teal: #0d9488
--teal-soft: #f0fdfa
--shadow: rgba(15,23,42,0.06)
```

</div>

<div class="card">

### Dark Theme (auto)

```css
@media (prefers-color-scheme: dark) {
  --bg: #0d1117
  --panel: #161b22
  --ink: #e6edf3
  --muted: #8b949e
  --line: #30363d
  --navy: #f0f6fc
  --accent: #f85149
  --accent-soft: #3d1515
  --teal: #39c5bb
  --teal-soft: #0d2d2b
}
```

</div>

<div class="card">

### High Contrast (auto)

```css
@media (prefers-contrast: high) {
  --line: #000
  --muted: #333
  --shadow: rgba(0,0,0,0.15)
}
.card { border-width: 2px; }
```

</div>

</div>

<p data-fragment="2" class="eyebrow">Override any variable in frontmatter <code>style: |</code> block</p>

---

<!-- _class: section animate-in -->

# Slide-to-Slide Transitions

<div class="table-wrap" data-fragment="1">

| Transition | Directive | Best For |
|---|---|---|
| **fade** | `transition: fade 0.5s` | Default, sections |
| **rise** | `transition: rise 0.55s` | New concepts |
| **veil** | `transition: veil 0.55s` | Progressive proofs |
| **focus** | `transition: focus 0.6s` | Conceptual pivots |
| **zoom** | `transition: zoom 0.65s` | Title/closing |
| **slide** | `transition: slide 0.5s` | Sequential steps |
| **cover** | `transition: cover 0.5s` | Layering |
| **none** | `transition: none` | Dense material |

</div>

<div class="row" data-fragment="2">

<div class="card">

### Per-slide override

```markdown
<!-- transition: rise 0.6s -->
## Next slide rises in
```

</div>

<div class="card">

### Disable for one slide

```markdown
<!-- _transition: none -->
## No transition into this slide
```

</div>

</div>

<p data-fragment="3" class="eyebrow">33 built-in + 3 custom (rise, veil, focus) — all direction-aware</p>

---

<!-- transition: rise 0.55s -->
<!-- _class: section animate-in -->

# Morphing (View Transitions)

<div class="row" data-fragment="1">

<div class="stack">

### Slide A — Algebraic View

<div class="morph-target formula-box" data-morph-name="variety">

$$
I = \langle x^2 + y^2 - 1 \rangle
$$

</div>

<p data-fragment="2">Ideal defining a circle</p>

</div>

<div class="stack">

### Slide B — Geometric View

<div class="morph-target formula-box" data-morph-name="variety">

$$
V(I) = \{(x,y) : x^2 + y^2 = 1\}
$$

</div>

<p data-fragment="2">Same object, continuous morph</p>

</div>

</div>

<div data-fragment="3" class="eyebrow">Requires same <code>data-morph-name</code> on both slides · Unique per slide</p>

---

<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### Entrance Animations (`.animate-in`)

<div class="card">

Auto-staggered fade+rise

</div>

<div class="card">

Cards/formulas: slower cardIn

</div>

<div class="card">

Eyebrows: fast fadeIn

</div>

<div class="card">

Respects <code>prefers-reduced-motion</code>

</div>

</div>

<div class="stack" data-fragment="2">

### Click-to-Reveal Fragments

<div class="card" data-fragment="1">

<kbd>Space</kbd> → shows this

</div>

<div class="card" data-fragment="2">

<kbd>Space</kbd> → shows this

</div>

<div class="card" data-fragment="3">

<kbd>Space</kbd> → shows this

</div>

<div class="card" data-fragment="4">

<kbd>←</kbd> hides previous

</div>

</div>

---

<!-- _class: section animate-in -->

# Fragment Patterns

<div class="row" data-fragment="1">

<div class="card">

### On any element

```markdown
<p data-fragment="1">Paragraph</p>
<div class="card" data-fragment="2">Card</div>
<div class="formula-box" data-fragment="3">Formula</div>
<li data-fragment="4">List item</li>
```

</div>

<div class="card">

### Staggered groups

```markdown
<div class="row">
  <div class="card" data-fragment="1">First</div>
  <div class="card" data-fragment="2">Second</div>
  <div class="card" data-fragment="3">Third</div>
</div>
```

</div>

<div class="card">

### Inline + block

```markdown
<p data-fragment="1">Start <span data-fragment="2">middle</span> end</p>
<blockquote data-fragment="3">Quote</blockquote>
```

</div>

</div>

<div data-fragment="2">

### Counter (bottom-right)

Shows `3/5` — current/total fragments on slide

</div>

<div data-fragment="3" class="eyebrow">Works with all transitions, morph, entrance animations</div>

---

<!-- transition: veil 0.55s -->
<!-- _class: section animate-in -->

# Math & Code

<div class="row" data-fragment="1">

<div class="stack">

### Display Math

<div class="formula-box">

$$
\operatorname{Hilb}_P(t) = \frac{Q(t)}{(1-t)^d}
$$

</div>

<div class="formula-box">

$$
\mathcal{O}_X(D) \otimes \mathcal{O}_X(E) \cong \mathcal{O}_X(D+E)
$$

</div>

</div>

<div class="stack">

### Inline Math

$k[x_1,\dots,x_n]$, $\mathbb{A}^n_k$, $V(I) \subseteq \mathbb{A}^n$, $\sqrt{I}$, $\mathcal{F}^\vee$

</div>

</div>

<div data-fragment="2">

### Code Blocks

```python
def groebner_basis(ideal, order='grevlex'):
    \"\"\"Compute reduced Gröbner basis.\"\"\"
    G = list(ideal.gens)
    pairs = [(i, j) for i in range(len(G)) for j in range(i+1, len(G))]
    while pairs:
        i, j = pairs.pop(0)
        S = spoly(G[i], G[j], order)
        r = reduce(S, G, order)
        if r != 0:
            G.append(r)
            pairs.extend((k, len(G)-1) for k in range(len(G)-1))
    return G
```

</div>

---

<!-- _class: section animate-in -->

# Tables & Media

<div class="row" data-fragment="1">

<div class="stack">

### Styled Table

<div class="table-wrap">

| Property | Light | Dark | High Contrast |
|---|---|---|---|
| `--bg` | `#fafafa` | `#0d1117` | `#fff` |
| `--ink` | `#1a1a2e` | `#e6edf3` | `#000` |
| `--accent` | `#c0392b` | `#f85149` | `#c00` |
| `--line` | `#e4e4e7` | `#30363d` | `#000` |
| `--shadow` | `0.06` | `0.3` | `0.15` |

</div>

</div>

<div class="stack">

### Media Layout

<div class="media">

<div class="stack">

**`.media`** — 50/50 image + text

<div class="formula-box" style="min-height: 120px; display: flex; align-items: center; justify-content: center;">
Placeholder for diagram
</div>

</div>

<div class="stack">

**`.media.reverse`** — Swaps sides

<div class="card">
Content on right, image on left
</div>

</div>

</div>

</div>

</div>

---

<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### Responsive Breakpoints

```css
@media (max-width: 1100px) {
  :root { --pad-x: 44px; --pad-y: 40px; }
  .row, .row-3, .split, .media, .card-list {
    grid-template-columns: 1fr;
  }
  .media.reverse { direction: ltr; }
}
```

**All grids collapse to 1-col** automatically

</div>

<div class="stack" data-fragment="2">

### Print / PDF Safety

```css
@media print {
  .animate-in > *,
  .card, .formula-box, blockquote {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .morph-target { view-transition-name: none; }
  section.closing { print-color-adjust: exact; }
}
```

**Static, clean PDF** — no hidden content

</div>

---

<!-- _class: section animate-in -->

# Accessibility

<div class="row-3" data-fragment="1">

<div class="card">

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
  .morph-target { view-transition-name: none; }
}
```

Fragments still keyboard-navigable

</div>

<div class="card">

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root { /* full dark palette */ }
}
```

Automatic — no config needed

</div>

<div class="card">

### High Contrast

```css
@media (prefers-contrast: high) {
  --line: #000;
  --muted: #333;
  .card { border-width: 2px; }
}
```

System-level preference

</div>

</div>

<div class="row" data-fragment="2">

<div class="card">

### Focus Visible

```css
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

Keyboard navigation clear

</div>

<div class="card">

### Semantic HTML

- `<header>`/`<footer>` for Marp headers
- `<section>` per slide
- `aria-live` on fragment counter
- `<kbd>` for key hints

</div>

</div>

---

<!-- _class: section animate-in -->

# Configuration Variables

<div class="table-wrap" data-fragment="1">

| Variable | Default | Controls |
|---|---|---|
| `--pad-x` | `60px` | Horizontal padding |
| `--pad-y` | `48px` | Vertical padding |
| `--gap` | `20px` | Grid/flex gap |
| `--tight-gap` | `12px` | Compact gap |
| `--ease` | `cubic-bezier(.2,.6,.2,1)` | Standard easing |
| `--ease-out` | `cubic-bezier(0,0,.2,1)` | Entrance easing |
| `--dur-fast` | `0.3s` | Eyebrow/badge |
| `--dur-base` | `0.45s` | Standard entrance |
| `--dur-slow` | `0.6s` | Card/formula |
| `--stagger` | `0.07s` | Sibling delay |

</div>

<div data-fragment="2" class="eyebrow">Override in frontmatter:</div>

```yaml
style: |
  :root {
    --accent: #1e40af;    /* brand blue */
    --pad-x: 80px;        /* wider margins */
    --dur-base: 0.6s;     /* slower entrances */
    --stagger: 0.1s;      /* more delay */
  }
```

---

<!-- _class: section animate-in -->

# Custom Transitions (in theme.css)

<div class="row" data-fragment="1">

<div class="stack">

### Rise (direction-aware)

```css
@keyframes marp-outgoing-transition-rise {
  to { transform: translateY(calc(var(--marp-transition-direction,1) * -5%)) scale(0.99); }
}
@keyframes marp-incoming-transition-rise {
  from { transform: translateY(calc(var(--marp-transition-direction,1) * 5%)) scale(0.99); }
}
```

</div>

<div class="stack">

### Veil (clip-path)

```css
@keyframes marp-incoming-transition-veil {
  from { clip-path: inset(0 0 100% 0); }
  to { clip-path: inset(0 0 0 0); }
}
```

</div>

<div class="stack">

### Focus (blur + scale)

```css
@keyframes marp-incoming-transition-focus {
  from { filter: blur(8px); transform: scale(0.98); }
  to { filter: blur(0); transform: scale(1); }
}
```

</div>

</div>

<div data-fragment="2" class="eyebrow">Add your own: <code>@keyframes marp-incoming-transition-<name></code></div>

---

<!-- _class: quote animate-in -->

> Every animation should serve the argument. If it doesn't clarify, it distracts.

<cite>Anime Slides Design Principle</cite>

---

<!-- transition: zoom 0.65s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">Complete</span>

# All Features Working

<div data-fragment="1">✅ 6 layout classes</div>
<div data-fragment="2">✅ 10+ layout utilities</div>
<div data-fragment="3">✅ 13 CSS color variables</div>
<div data-fragment="4">✅ 8 slide transitions</div>
<div data-fragment="5">✅ Morphing with View Transitions</div>
<div data-fragment="6">✅ Entrance animations (`.animate-in`)</div>
<div data-fragment="7">✅ Click-to-reveal fragments</div>
<div data-fragment="8">✅ Math (MathJax) + code blocks</div>
<div data-fragment="9">✅ Tables, media, responsive grids</div>
<div data-fragment="10">✅ Print/PDF safety</div>
<div data-fragment="11">✅ Reduced motion, dark mode, high contrast</div>
<div data-fragment="12">✅ Focus visible, semantic HTML</div>
<div data-fragment="13">✅ Configurable via CSS variables</div>
<div data-fragment="14">✅ Extensible custom transitions</div>

<p data-fragment="15" class="eyebrow">Ready for your algebraic geometry deck</p>
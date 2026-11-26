# Anime Slides — Animated Marp Deck for Algebraic Geometry

A production-ready Marp project demonstrating purposeful motion in academic presentations.

## Project structure

```
anime-slides/
├── theme.css      # Animated theme with custom transitions and entrance animations
├── slides.md      # Demo deck: algebraic geometry with motion recipes
├── package.json   # Build scripts (install marp-cli first)
└── README.md      # This file
```

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Preview in browser (live reload)
npm run preview

# 3. Export formats
npm run html   # animated HTML (bespoke template, transitions work)
npm run pdf    # static PDF (transitions not preserved, entrance animations disabled)
npm run pptx   # PowerPoint (transitions limited)
```

## Animation system overview

| Layer | Purpose | Implementation |
|-------|---------|----------------|
| Slide-to-slide | Guide the viewer between sections | `transition` directive (33 built-in + 3 custom) |
| Within-slide entrance | Reveal structure progressively | CSS `@keyframes` + `animation` on `section > *` |
| Morph | Keep recurring objects continuous | `view-transition-name` on matching elements |

## Slide-to-slide transitions

### Built-in (33 effects)
fade, slide, cover, coverflow, cube, cylinder, diamond, drop, explode, fade-out, fall, flip, glow, implode, in-out, iris-in, iris-out, melt, overlap, pivot, pull, push, reveal, rotate, star, swap, swipe, swoosh, wipe, wiper, zoom, clockwise, counterclockwise

### Custom (defined in `theme.css`)
- **rise** — subtle upward shift with scale (direction-aware)
- **veil** — clip-path reveal from bottom
- **focus** — blur + scale transition

### Usage

```markdown
---
transition: fade 0.55s
---

# Global default (applies to every boundary)

---

<!-- transition: rise 0.6s -->
## Next slide uses "rise"

---

<!-- _transition: none -->
## This slide enters without transition
```

**Recommendations for mathematics:**

| Moment | Transition | Duration |
|--------|------------|----------|
| New section / chapter | `fade` | 0.55s |
| New definition / concept | `rise` | 0.6s |
| Progressive proof steps | `veil` | 0.6s |
| Major conclusion | `zoom` | 0.7s |
| Dense table / proof | `none` | — |

## Entrance animations (within a slide)

Automatically applied by `theme.css` when viewed in browser (`@media screen`):

- Headings, paragraphs, lists, formulas, cards: staggered `fadeRise` (0.45s base, 0.09s stagger)
- Cards, formula boxes, tables, blockquotes: `cardIn` (0.6s)
- Eyebrows: `fadeIn`

To disable on a specific element, add `style="animation: none"`.

## Morphing recurring objects

Give the same element on consecutive slides an identical `view-transition-name`:

```markdown
---
---

<div class="morph-object formula-box">
### Slide A
$$ f(x) = x^2 + 1 $$
</div>

---

<div class="morph-object formula-box">
### Slide B
$$ V(f) = \varnothing \text{ over } \mathbb{R} $$
</div>
```

In `theme.css`:
```css
section .morph-object {
  view-transition-name: morph-object;
  animation: none;
}
```

**Rules:**
- Each `view-transition-name` must be unique within a single slide
- Works best with identical layout containers (same dimensions)
- Requires browser View Transitions API (Chrome 111+, Edge 111+, Safari 18.2+, Firefox 144+)

## Accessibility

- `@media (prefers-reduced-motion: reduce)` disables all animations and transitions
- Marp CLI forces a simple `fade` when viewer has reduced-motion enabled
- PDF export uses `@media print` to show static final state (opacity 1, no transforms)

## VS Code Marp extension

Add to `.vscode/settings.json`:

```json
{
  "markdown.marp.themes": [
    "./theme.css"
  ],
  "markdown.marp.enableHtml": true
}
```

Then open `slides.md` and use "Marp: Toggle Preview".

## Export notes

| Format | Transitions | Entrance animations | Morph |
|--------|-------------|---------------------|-------|
| HTML (bespoke) | ✅ Yes | ✅ Yes | ✅ Yes |
| PDF | ❌ No (static) | ❌ Disabled via print CSS | ❌ No |
| PPTX | Limited | Static | No |
| Images | No | Static | No |

For animated presentations, **always present from the HTML export** (`npm run html` then open `slides.html` in browser, or `npm run preview`).

## Customizing transitions

Add new custom transitions in `theme.css`:

```css
@keyframes marp-outgoing-transition-<name> {
  from { /* outgoing start */ }
  to   { /* outgoing end */ }
}
@keyframes marp-incoming-transition-<name> {
  from { /* incoming start */ }
  to   { /* incoming end */ }
}

/* Optional: backward-specific */
@keyframes marp-outgoing-transition-backward-<name> { ... }
@keyframes marp-incoming-transition-backward-<name> { ... }

/* Optional: default duration */
@keyframes marp-incoming-transition-<name> {
  from {
    --marp-transition-duration: 0.8s;
    /* ... */
  }
}
```

Then use `transition: <name> [duration]` in Markdown.

## License

MIT — use freely for your own presentations.
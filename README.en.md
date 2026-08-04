# Guizang PPT Skill · XREAL Style Web Decks

![GitHub stars](https://img.shields.io/github/stars/op7418/guizang-ppt-skill?style=flat-square)
![License](https://img.shields.io/github/license/op7418/guizang-ppt-skill?style=flat-square)
![Skill](https://img.shields.io/badge/Skill-Agent-111111?style=flat-square)
![HTML Deck](https://img.shields.io/badge/HTML-Deck-0A7CFF?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude%20Code-Supported-6B5B95?style=flat-square)
![Codex](https://img.shields.io/badge/Codex-Supported-222222?style=flat-square)

An agent skill for Claude Code, Codex, and similar environments. It generates **single-file HTML horizontal-swipe decks**, image assets, and social covers. It now ships with one visual system only: **XREAL Style**, built on a strict grid, sharp geometry, hairlines, and a restrained XREAL color system.

## Visual system

Grid-first, a black/white/gray structure with restrained red semantics, sharp rectangles, 1px hairlines, extreme type contrast, and sans-serif typography. Body slides use the locked `S01-S22` layouts. It is designed for:

- AI / technology launches, demo days, and product analysis
- Data reviews, annual summaries, benchmarks, workflows, and system maps
- Design, engineering, methodology, city, and history presentations

![XREAL Style preview](https://github.com/user-attachments/assets/8960e78c-69bb-4b7e-aa95-6fad64b70314)

## 30-second start

```bash
npx skills add https://github.com/op7418/guizang-ppt-skill --skill guizang-ppt-skill
```

Then ask your agent:

```text
Create an XREAL Style deck from this article, around 7 slides, with 2-3 generated visuals.
```

Other useful prompts:

```text
Turn this product analysis into an 8-slide XREAL Style deck using the black/white/gray base with restrained red semantic emphasis. Preserve 3 screenshots and fit them to the template slots.
Create a 21:9 cover and a paired 1:1 share card from this deck's core idea.
Redesign this product screenshot as an XREAL Style 16:10 slide visual.
```

## What you get

- 📐 Horizontal swipe navigation: keyboard, scroll wheel, touch, dots, and ESC index
- 🧱 22 locked layouts: Cover, Statement, KPI Tower, Loop Diagram, Duo Compare, Image Hero, Closing, and more
- 🎨 Fixed XREAL Style color roles: black/white/gray as the base; red is reserved for key semantic emphasis
- 🔤 XREAL Diatype + IBM Plex Sans SC brand fonts
- ◼️ XREAL logo + Google Material Symbols Outlined icon standard
- 🖼 Optional image flow: documentary photos, infographics, flow diagrams, system maps, UI scenes, and data visuals
- 📰 Social covers: 21:9 hero images, 1:1 share cards, 3:4 covers, and 16:9 thumbnails
- ✅ XREAL Style validator: layout registration, image slots, SVG text, title alignment, and rendered boundaries

## Workflow

1. Clarify audience, duration, source material, image/screenshot needs, brand semantics, and hard constraints
2. Copy `assets/template-swiss.html`, `assets/fonts/`, and `assets/brand/`
3. Use the fixed XREAL black/white/gray system; red is reserved for key data, warnings, and actions
4. Read `swiss-layout-lock.md` and `layouts-swiss.md`, then select `S01-S22` layouts
5. Fill content and images while keeping sharp corners, no gradients, no shadows, and no rounded cards
6. Run the XREAL Style validator and inspect the HTML page by page

```bash
node scripts/validate-swiss-deck.mjs path/to/index.html
```

The full workflow is in [`SKILL.md`](./SKILL.md). Brand rules are in [`references/brand-xreal.md`](./references/brand-xreal.md).

## XREAL Style theme colors

`references/themes-swiss.md` contains one preset only: **the XREAL black/white/gray system with restrained red semantics. Arbitrary custom colors are not allowed.**

| Role | Color | Use |
|---|---|---|
| Structural anchor | `#0A0A0A` | Primary text, structure, grid, navigation |
| Semantic emphasis | `#D71920` | Key data, warnings, key actions |
| Technical texture | `#A7ADB4` | Sparse technical markers |
| Brand value | `#B08D57` | Sparse value markers |

## Images and screenshots

Image prompts live in [`references/image-prompts.md`](./references/image-prompts.md). Screenshot framing rules live in [`references/screenshot-framing.md`](./references/screenshot-framing.md).

- Prefer 21:9 for S22 hero images; keep S15/S16 image grids consistent in ratio and height
- Preserve raw screenshots with programmatic framing and `.fit-contain`
- Never generate slide headers, footers, titles, page numbers, logos, or PPT chrome inside an image
- XREAL Style images must use square corners, no shadows, no rounded cards, and only the fixed brand color roles

## Directory

```
guizang-ppt-skill/
├── SKILL.md
├── assets/
│   ├── template-swiss.html
│   ├── brand/xreal-logo-black.svg
│   ├── fonts/                 ← XREAL Diatype + IBM Plex Sans SC
│   ├── screenshot-backgrounds/xreal-style/
│   └── motion.min.js
├── scripts/
│   └── validate-swiss-deck.mjs
└── references/
    ├── swiss-layout-lock.md
    ├── layouts-swiss.md
    ├── swiss-map-component.md
    ├── themes-swiss.md
    ├── brand-xreal.md
    ├── image-prompts.md
    ├── screenshot-framing.md
    └── checklist.md
```

## FAQ

**Can it export to PPTX?**

The core output is HTML. Present it in a browser, screenshot it, or record it; PPTX conversion is a separate workflow.

**Why are custom colors not allowed?**

The skill is designed for stable visual output, so it uses the fixed XREAL Style color roles only.

**Can I add my own layout?**

Yes, but update `template-swiss.html`, `layouts-swiss.md`, `swiss-layout-lock.md`, and the validator together, and mark experimental layouts explicitly.

**Is Codex image generation required?**

No. Decks work without generated images; use the image flow only when photos, infographics, UI scenes, or covers are needed.

## Contributing

- When changing template classes, update `layouts-swiss.md` and `swiss-layout-lock.md`
- When adding XREAL Style rules, update `scripts/validate-swiss-deck.mjs` or `checklist.md`
- Keep black/white/gray as the base and red as semantic emphasis; do not add arbitrary color entry points

## License

AGPL-3.0 © 2026 [op7418](https://github.com/op7418)

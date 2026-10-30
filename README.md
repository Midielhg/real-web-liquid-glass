# Real Web Liquid Glass

Liquid glass for the web that actually bends light. A WebGL lens shader refracts whatever sits under each control
(posters, photos, text) with a colour fringe, a lit rim and a soft shadow. No SVG filter tricks, so it works in
Safari on iPhone, not just Chromium.

**Live demo:** https://midielhg.github.io/real-web-liquid-glass/

Drag the posters, open the ••• menu and the Details sheet, then tune every setting.

## What's here

| Path | What it is |
|---|---|
| `docs/index.html` | The demo. One self-contained page, no build step. |
| `src/glass-renderer.js` | The renderer as an ES module: `createGlassRenderer(canvas)` and the shipped defaults. |
| `skills/liquid-glass/SKILL.md` | The full design language as a Claude skill: which material goes where, the renderer rules, frosted fallback, motion, components, iOS traps. |

## Use the renderer

```js
import { createGlassRenderer, WEBGL, CLEAR_TINT } from "./src/glass-renderer.js";

const renderer = createGlassRenderer(glassCanvas); // null without WebGL: fall back to frosted CSS
// sceneCanvas holds a picture of what's under the glass, same size and DPR as glassCanvas
renderer.draw(sceneCanvas, [
  { x: 16, y: 14, width: 45, height: 45, radius: 22.5, tint: CLEAR_TINT },
], devicePixelRatio, WEBGL);
```

Redraw whenever what's under the glass moves. The skill file explains how to paint the scene, keep scrolling in sync
on iOS, and when to use frosted glass instead.

## Settings

| Option | Default | What it does |
|---|---|---|
| `refraction` | 0.6 | How far the bevel bends the picture |
| `chromAberration` | 0.04 | Colour fringe at the rim |
| `edgeHighlight` | 0.2 | Lit inner stroke, rim light, inner glow |
| `fresnel` | 0.35 | Whitening toward the edge |
| `specular` | 0 | Fixed highlights (keep 0 for UI) |
| `saturation` | 0.12 | Colour boost through the glass |
| `brightness` | 0 | Exposure through the glass |
| `zRadius` | 14/3 | Bevel height in px |
| `shadowOpacity` / `shadowSpread` / `shadowOffsetY` | 0.12 / 10 / 2 | Soft contact shadow |

## Use the skill with Claude

Copy `skills/liquid-glass/` into `~/.claude/skills/` (Claude Code), or upload `SKILL.md` as a skill in Claude.

## License

MIT. The lens shader is adapted from [@ybouane/liquidglass](https://github.com/ybouane/liquidglass) (MIT); see
`NOTICE`.

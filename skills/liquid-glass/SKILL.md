---
name: "liquid-glass"
description: "Apply our Liquid Glass design language (WebGL lens glass, frosted panels, spring pills, tab bars, glass menus) when building or restyling UI chrome in any project."
---

# Liquid Glass

Our iOS-style glass system. It has two materials and one motion language.

- **WebGL lens glass** (current, shipped in Recline / reclinetv.com): a WebGL shader that bends what is under a control through a
  biconvex lens, with a faint colour fringe, a lit rim and a soft contact shadow. Used for controls (bars, tabs, pills,
  chips, round buttons, player controls) and pop-up menus.
- **Frosted glass** (the original IMC HelpDesk material, still correct for panels): translucent fill + `blur()` +
  `saturate(180%)` + one hairline + a soft shadow. Used for sheets, cards, dialogs and big panels, and as the fallback
  wherever WebGL is missing or off (TV boxes, `?glass=0`).

Everything is vanilla CSS + vanilla JS + one WebGL context, with **no dependencies and no build step**. Do not
introduce a UI library to deliver this.

## Live references

| Where | What to read |
|---|---|
| `~/Dev/ReclineTV/xtream-web/public/glassrender.js` | **The lens shader and renderer.** One WebGL pass draws every glass shape. |
| `~/Dev/ReclineTV/xtream-web/public/glassbar.js` | Top bar glass: painting what's under the bar, page-owned scrolling, measuring shapes. |
| `~/Dev/ReclineTV/xtream-web/public/glasslayer.js` | Lens glass for every other frosted control, the menu look, which elements stay frosted. |
| `~/Dev/ReclineTV/xtream-web/public/glass.js` | `slidePill()` with stretch toward travel, `openGlassMenu()` as ES modules. |
| `~/Dev/ReclineTV/xtream-web/public/lab/glass.html` | Side-by-side test: lens vs frosted, over real posters. |
| `~/Dev/ReclineTV/xtream-web/public/style.css` | Glass tokens, `--spring`, frosted fallbacks, TV overrides. |
| `~/Dev/imc-helpdesk/public/app.html` | The frosted system in a no-build vanilla app. |
| `~/Dev/CelysPets/PetsFlow` (`src/index.css`, `src/components/Layout/MobileFriendlyNavbar.tsx`) | Bottom tab bar, installed-PWA behaviour, React/Tailwind port, matched against a native iOS build. |

## Files in this skill

| File | What it is |
|---|---|
| `reference/liquid-glass.css` | The frosted system: tokens, glass surfaces, segmented pill, menu, select, toast/bar/dialog, press feedback, reduced motion. Values copied verbatim from the HelpDesk. |
| `reference/glass-menu.js` | `openGlassMenu()` / `closeGlassMenu()`: the pop-up menu, including search, keyboard nav and the touch behaviours. |
| `reference/segmented-pill.js` | `slidePill()` / `_pillMeasure()`: the pill that travels between tabs. |
| `reference/react-tailwind.md` | Read this **before** porting into a React/Tailwind project. |
| `reference/demo.html` + `serve.cjs` | Self-test page for the frosted components in both themes. `node serve.cjs` then open `localhost:8791` (must be served, not opened as `file://`). |

The lens renderer is embedded below, so this skill works even where those files or the Recline repo are absent.

To adopt the frosted system: copy `liquid-glass.css` in once, copy the JS you need, use `class="glass"`,
`.seg`/`.seg-btn`, `.glass-sel-btn`, `.glass-toast`, `.glass-scrim`/`.glass-dialog`. **Keep its scoped
`box-sizing:border-box` block (section 1b).** The components size themselves with `calc(100% - Npx)` plus padding
and border; without the scoped rule the menu's search field computes 6px wider than its panel, which reads as the
choices being off-centre.

## Which material goes where

| Surface | Material | Why |
|---|---|---|
| Top bar controls, tabs capsule, round icon buttons, chips, player controls, small badges | **Clear lens**, tint `[0,0,0,.14]` | Small, floating, over moving content: the bend is the point. |
| Pop-up menus (`.app-menu`, `.glass-menu`) | **Blurred lens**: scene blurred 26px, saturation 110%, tint `[.42,.42,.45,.3]` | Matches the iPhone app's menus. 180% saturation turned posters into purple and orange blobs. |
| Sheets, cards, dialogs, settings panels, anything frosted 24px or more, or larger than about 40,000 px² | **Frosted** | Apple's own sheets stay frosted. Drawn as a lens from a snapshot, they lost their frost and showed what was under them. |
| Anything that covers the screen, or scrolls inside itself | **Frosted** | A scrim isn't a control; scrolling content would carry its glass away. |
| A filled state (selected chip, white button) | **Its own fill**, no glass | Selection reads as a solid object. |
| TV boxes, no WebGL | **Frosted** or solid | Lens glass costs GPU every frame. |

## The lens renderer

`createGlassRenderer(canvas)` then `draw(scene, lenses, dpr, options)` every frame something moved.

- `scene`: a canvas holding a picture of what is under the glass, same size and DPR as the glass canvas.
- `lenses`: `[{ x, y, width, height, radius, tint:[r,g,b,a] }]` in CSS px, measured from the controls' rects.
- One draw handles up to `MAX` shapes (10 here, 6 in Recline's bar). One WebGL context for all of them; per-element
  canvases cost 9 to 25 ms a frame on an iPhone.

### Settings (WebGL defaults, as shipped)

| Option | WebGL | What it does |
|---|---|---|
| `refraction` | 0.6 | How far the bevel bends the picture through both lens faces |
| `chromAberration` | 0.04 | Colour fringe at the rim |
| `edgeHighlight` | 0.2 | Lit inner stroke, rim light, inner glow |
| `fresnel` | 0.35 | Whitening toward the edge |
| `specular` | 0 | Four fixed highlights. Keep 0 for UI; it reads as plastic |
| `saturation` | 0.12 | Colour boost of what's seen through |
| `brightness` | 0 | Exposure through the glass |
| `zRadius` | 14/3 | Bevel height px. A third of the library's, so less of the edge is bent and labels stay readable |
| `shadowOpacity` | 0.12 (bar), 0 (layer) | Soft contact shadow |
| `shadowSpread` | 10 | Shadow falloff px |
| `shadowOffsetY` | 2 | Shadow drop px |
| `tint` | `[0,0,0,.14]` | Laid over the glass. The light dark tint keeps white labels legible over bright posters |

### Rules that make the lens work

1. **Paint the scene yourself, sharp.** The glass bends a picture, not the live page. Paint what is under each
   control into a small canvas: page backdrop, then boxes, images and text found under it, back to front. No frost on
   that picture (the library's blur re-blurred every frame and made scrolling lag).
2. **Render at 1.5x, not 3x.** A quarter of an iPhone's pixels; a soft glass edge doesn't show the difference.
3. **Images must be CORS-clean.** Fetch them with `crossOrigin="anonymous"` at the size the glass needs (TMDB `w780`).
   A copy the page already loaded without CORS is reused by the browser and taints the canvas.
4. **Decode before drawing.** Use an image once `decode()` resolves; drawing an undecoded image decodes it on that
   frame and stalls it.
5. **The page owns vertical scrolling** wherever glass sits over scrolling content. Safari scrolls ahead of page code,
   so the glass trails the posters. Take vertical drags yourself (iOS feel: momentum decays 0.998 per ms; past an end
   follow the finger at a third and spring back) and move content and glass in the same frame. Sideways shelves,
   sheets, menus and fields keep the browser's own scrolling.
6. **Redraw only on change**: scroll, a row sliding, an image arriving, the page map rebuilt. Otherwise draw nothing,
   glass included. Rebuild the "what's under it" map a moment after DOM changes, never more than 0.5s late, never
   mid-scroll.
7. **Blur on a canvas by halving.** Safari draws canvas `filter: blur()` as streaks and one-step downscales band. Halve
   repeatedly, then double back up. Saturation can be boosted on the way down.
8. **Wait for things to settle.** A control still scaling into place (a sheet opening) is drawn once it reaches its
   own size, or the glass comes out small and off centre.
9. **Size the canvas exactly.** A canvas left at its default 300×150 makes Safari fit the picture inside it, small and
   centred.
10. **Show nothing until there's a picture.** With an empty scene the shader draws white for a moment: fade the glass
    layer in once the first scene exists.

### Portable renderer (tested; per-lens tint, options per draw)

```js
const MAX = 10;
const VERT = `attribute vec2 a_pos;varying vec2 v_uv;void main(){v_uv=vec2((a_pos.x+1.0)*0.5,(1.0-a_pos.y)*0.5);gl_Position=vec4(a_pos,0.0,1.0);}`;
const FRAG = `precision highp float;varying vec2 v_uv;uniform sampler2D u_bgTex;uniform vec2 u_css;uniform float u_dpr;uniform int u_count;
uniform vec4 u_rect[${MAX}];uniform float u_rad[${MAX}];uniform vec4 u_tints[${MAX}];
uniform float u_refract;uniform float u_chroma;uniform float u_edgeHL;uniform float u_spec;uniform float u_fresnel;uniform float u_sat;uniform float u_zRadius;uniform float u_brightness;uniform float u_shadowAlpha;uniform float u_shadowSpread;uniform float u_shadowOffY;
float rrSDF(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+vec2(r);return min(max(q.x,q.y),0.0)+length(max(q,vec2(0.0)))-r;}
float bevelHeight(float d,float zR){if(d<=0.0)return 0.0;if(d>=zR)return zR;return sqrt(d*(2.0*zR-d));}
vec4 glass(vec2 local,vec2 half_,float r,vec2 screenUV,vec2 res,vec4 tint){
 float sdf=rrSDF(local,half_,r);
 if(sdf>0.0){float sdfShadow=rrSDF(local-vec2(0.0,u_shadowOffY),half_,r);float d=max(sdfShadow-1.0,0.0);float spread=max(u_shadowSpread,1.0);float falloff=1.0/(spread*spread);
  float outerShadow=exp(-d*d*falloff)*0.65;float contactShadow=exp(-d*0.08/max(spread*0.04,0.01))*0.35;return vec4(0.0,0.0,0.0,(outerShadow+contactShadow)*u_shadowAlpha);}
 float mask=1.0-smoothstep(-1.5,0.5,sdf);float maxD=min(half_.x,half_.y);float inside=-sdf;float edge=smoothstep(maxD*0.35,0.0,inside);
 float zR=u_zRadius;float e=2.0;float hC=bevelHeight(inside,zR);
 float hR=bevelHeight(-rrSDF(local+vec2(e,0.0),half_,r),zR);float hL=bevelHeight(-rrSDF(local-vec2(e,0.0),half_,r),zR);
 float hU=bevelHeight(-rrSDF(local+vec2(0.0,e),half_,r),zR);float hD=bevelHeight(-rrSDF(local-vec2(0.0,e),half_,r),zR);
 vec2 hGrad=vec2(hR-hL,hU-hD)/(2.0*e);vec3 N=normalize(vec3(-hGrad,1.0));float depth=smoothstep(0.0,zR,inside);
 vec2 pxToUV=vec2(1.0)/res;float refrPow=1.0-1.0/1.5;float thickNorm=(hC*2.0)/max(zR*2.0,1.0);
 vec2 exitRefr=hGrad*refrPow;vec2 entryRefr=hGrad*refrPow;vec2 refrPx=(exitRefr+entryRefr+entryRefr*thickNorm*0.5)*u_refract*30.0;
 refrPx+=(-local/max(half_,vec2(1.0)))*u_refract*4.0*depth;vec2 base=screenUV+refrPx*pxToUV;
 float caS=u_chroma*18.0*(edge*0.7+0.3)*2.0;vec2 caD=N.xy*caS*pxToUV;
 vec3 col=vec3(texture2D(u_bgTex,base+caD).r,texture2D(u_bgTex,base).g,texture2D(u_bgTex,base-caD).b);
 col*=1.0+u_brightness;float lum=dot(col,vec3(0.299,0.587,0.114));col=mix(vec3(lum),col,1.0+u_sat);col*=1.0+0.06*depth;
 float fres=pow(1.0-abs(N.z),4.0)*u_fresnel;vec3 V=vec3(0.0,0.0,1.0);float totalSpec=0.0;
 if(u_spec>0.0){vec3 H1=normalize(normalize(vec3(0.4,0.7,1.0))+V);vec3 H2=normalize(normalize(vec3(-0.3,-0.5,1.0))+V);vec3 L3=normalize(vec3(0.1,0.3,1.0));vec3 H4=normalize(normalize(vec3(0.0,0.9,0.4))+V);
  totalSpec=(pow(max(dot(N,H1),0.0),90.0)+pow(max(dot(N,H2),0.0),50.0)*0.3+pow(max(dot(N,L3),0.0),6.0)*0.1+pow(max(dot(N,H4),0.0),120.0)*0.6)*u_spec;}
 float borderWidth=1.5;float innerStroke=smoothstep(-borderWidth-1.0,-borderWidth,sdf)*(1.0-smoothstep(-1.0,0.0,sdf));innerStroke*=0.4+0.6*(0.5+0.5*(-local.y/half_.y));
 float rim=edge*u_edgeHL*0.22;float innerGlow=smoothstep(5.0,0.0,-sdf)*u_edgeHL*0.15;float envRefl=(N.y*0.5+0.5)*fres*0.08;
 vec3 fin=col+vec3(totalSpec)+vec3(rim+innerGlow)+vec3(innerStroke*u_edgeHL*0.55)+vec3(envRefl);fin=mix(fin,vec3(1.0),fres*0.2);fin=mix(fin,tint.rgb,tint.a);
 return vec4(fin,mask);}
void main(){vec2 res=u_css*u_dpr;vec2 p=v_uv*res;vec2 suv=p/res;vec4 acc=vec4(0.0);
 for(int i=0;i<${MAX};i++){if(i>=u_count)break;vec4 R=u_rect[i]*u_dpr;vec2 half_=R.zw*0.5;vec2 local=p-(R.xy+half_);
  if(abs(local.x)>half_.x+24.0*u_dpr||abs(local.y)>half_.y+24.0*u_dpr)continue;float r=min(u_rad[i]*u_dpr,min(half_.x,half_.y));
  vec4 g=glass(local,half_,r,suv,res,u_tints[i]);vec3 rgb=clamp(g.rgb,0.0,1.0);acc=vec4(rgb*g.a,g.a)+acc*(1.0-g.a);}
 gl_FragColor=acc;}`;

export function createGlassRenderer(canvas) {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null; // fall back to frosted CSS
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a_pos"); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const u = (n) => gl.getUniformLocation(prog, n); gl.uniform1i(u("u_bgTex"), 0);
  const rects = new Float32Array(MAX * 4), radii = new Float32Array(MAX), tints = new Float32Array(MAX * 4);
  let lost = false; canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; });
  return {
    get lost() { return lost; },
    draw(scene, lenses, dpr, o) {
      if (lost) return;
      const w = scene.width, h = scene.height;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene);
      gl.uniform1f(u("u_refract"), o.refraction); gl.uniform1f(u("u_chroma"), o.chromAberration);
      gl.uniform1f(u("u_edgeHL"), o.edgeHighlight); gl.uniform1f(u("u_spec"), o.specular);
      gl.uniform1f(u("u_fresnel"), o.fresnel); gl.uniform1f(u("u_sat"), o.saturation); gl.uniform1f(u("u_brightness"), o.brightness);
      gl.uniform1f(u("u_shadowAlpha"), o.shadowOpacity); gl.uniform1f(u("u_zRadius"), o.zRadius * dpr);
      gl.uniform1f(u("u_shadowSpread"), o.shadowSpread * dpr); gl.uniform1f(u("u_shadowOffY"), o.shadowOffsetY * dpr);
      const n = Math.min(MAX, lenses.length); rects.fill(0); tints.fill(0);
      for (let i = 0; i < n; i++) { const l = lenses[i]; rects.set([l.x, l.y, l.width, l.height], i * 4); radii[i] = l.radius; tints.set(l.tint || [0, 0, 0, 0], i * 4); }
      gl.uniform2f(u("u_css"), w / dpr, h / dpr); gl.uniform1f(u("u_dpr"), dpr); gl.uniform1i(u("u_count"), n);
      gl.uniform4fv(u("u_rect"), rects); gl.uniform1fv(u("u_rad"), radii); gl.uniform4fv(u("u_tints"), tints);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

export const WEBGL = { refraction: 0.6, chromAberration: 0.04, edgeHighlight: 0.2, fresnel: 0.35, specular: 0,
  saturation: 0.12, brightness: 0, zRadius: 14 / 3, shadowOpacity: 0.12, shadowSpread: 10, shadowOffsetY: 2 };
export const CLEAR_TINT = [0, 0, 0, 0.14];
export const MENU_LOOK = { blur: 26, saturation: 110, tint: [0.42, 0.42, 0.45, 0.3] };
```

Layering: scene canvas (or the live page) → glass canvas (`pointer-events:none`, `aria-hidden`) → the controls' DOM
on top, with transparent backgrounds so the glass shows. Measure each lens from its control's
`getBoundingClientRect()` relative to the glass canvas, radius from `border-radius` clamped to half the height. Menus
use a second renderer fed the blurred scene.

## Frosted glass (panels and fallback)

Recline tokens (dark app):

```css
--glass-bg: rgba(44, 44, 44, 0.42);
--glass-border: rgba(255, 255, 255, 0.2);
--glass-shadow: 0 4px 18px rgba(0, 0, 0, 0.22);
--glass-strong: rgba(26, 26, 26, 0.86);   /* menus and dialogs as frost */
--spring: linear(0, .04, .16, .36, .6, .82, .97, 1.04, 1.05, 1.04, 1.02, 1.007, 1);
```

1. **Frost is four properties together, never fewer.** Translucent fill + `blur()` **with `saturate(180%)`** + one
   hairline + a soft shadow. Drop the saturate and the backdrop goes muddy grey; drop the border and it stops reading
   as a pane. Always write `-webkit-backdrop-filter` too.
2. **Glass needs something behind it.** `backdrop-filter` over a flat background is a tinted rectangle that costs GPU.
   Over a solid panel use the panel colour and a border instead.
3. **Blur is elevation**: `8px` inside a glass panel · `16px` chrome (buttons, bars, pills) · `20px` floating
   (toast, action bar) · `24px` dropdowns · `44px` modals and sheets. Frost of 24px or more is what marks a surface as a
   panel that stays frosted when lenses are on. A frosted pop-up menu with a near-opaque fill is the exception at
   `5px`: a heavy blur smeared the text behind it.
4. **One border, never two.** A `1px` border plus a `0 0 0 0.5px` ring shadow read as a hard outline together. Light UI:
   `0.5px solid rgba(60,60,67,.12)`, the iOS separator. Dark UI: `--glass-border`. `0.5px` is the thinnest a 3x screen
   renders.
5. **Radii**: `999px` pills and round buttons · `26–30px` menus · `22px` toasts, dialogs, sheets · `12–16px` rows,
   inputs, menu items · `7px` dense buttons. Mixing radii within one surface is the fastest way to make this look wrong.
6. **TV boxes drop `backdrop-filter` entirely** and use solid fills (`rgb(40,40,42)`); the hardware can't afford it.

## Motion

1. **One spring for all geometry**: `--spring` above, a damped overshoot peaking at 1.05. A second bespoke easing per
   component makes an interface feel assembled from parts.
2. **Move one object; don't crossfade many.** The selected tab is a separate pill that travels. On travel it stretches
   toward the direction of motion, by distance (`1 + min(.3, dist/width × .85)`), origin on the leading side, then
   settles. Measure the target's settled size with transitions suppressed (`pillMeasure`).
3. **Springs for geometry; plain fast ease for opacity.** A springy fade looks like a rendering fault.
4. **Animate `scale` / `translate`, never `transform: scale()`.** A transition on `transform` replaces the transform
   the element already has (a pill placed with `translateX`, a control centred with `translate(-50%)` or Tailwind's
   `-translate-y-1/2`), so it snaps out of place mid-animation. Individual properties compose. Safari 14.1+.
5. **Press = dim, never move.** `opacity:.6` in `.06s`. If a project insists on a pop (CelysPets does), keep it at
   `1.012` for a whole bar and `1.04` for a bubble, ~220ms, ease-out, no overshoot. It shipped at 1.045 and 1.14 on a
   spring and was called "very aggressive".
6. **Hover only inside `@media (hover:hover)`.** On touch the travelling pill is the feedback; a sticky hover after a
   tap is worse than none.
7. **Reduced motion keeps the material** (glass, colour) and drops springs and travel.

## Components

- **Top bar** (Recline): 45px circles (profile, search) and a 45px capsule with 3px inset, 39px tab buttons, 17px bold
  labels, selected pill `rgba(43,43,43,.7)` + `0.5px rgba(255,255,255,.14)` + `0 4px 18px rgba(0,0,0,.22)`. All three
  are clear lenses.
- **Bottom tab bar** (CelysPets): floating pill inset from three edges, 4 tabs + **More** (`•••`, never `☰`: three dots
  promise a few more tabs, a hamburger promises a full menu).
  - Labels under icons, never `aria-label` alone: icon 28px, label 11px semibold, `flex-col gap-0.5`. Shorten with a
    separate `shortLabel` (*Appointments → Appts*) so the desktop sidebar keeps the full word.
  - 56px per tab, 48px compact. Size for labels from the start.
  - The bottom inset is identical in every size state, and the bar never resizes because something opened.
  - Active bubble is grey `rgba(120,120,128,.1)` plus the hairline, not a brand-tinted glow (that reads as a badge).
  - Custom glyphs are filled, not stroked, and flagged `filled: true` so they skip the stroke-width utility.
- **Pop-up menu**: `openGlassMenu()` with search, keyboard nav and a finger-following highlight. Blurred lens when lenses
  are on, `--glass-strong` frost otherwise. Opens with a spring scale from its anchor corner, closes with a 0.16s ease.
- **Glass select**: a `<button>` + hidden input opening the menu (`.glass-sel-btn` + `openGlassMenu`). A `<select>` can't
  take this material. Wire printable keys on the trigger to open the menu and seed its search, or keyboard users lose
  type-to-jump.
- **Toast** 22px radius, 20px frost, springs in, fades plain. **Dialog / sheet** 22px radius, 44px frost over a scrim,
  never a lens.

## Installed PWA and iOS traps

- **Never lock scroll with `position: fixed` on `<body>`.** It lifts fixed bottom bars off the viewport in standalone
  mode. Use `overflow:hidden` on `html`, `body` and the scroll container, plus capture-phase `touchmove`/`wheel`
  preventers. Don't "fix" it by hiding the bar.
- That gap only appears when the viewport is taller than the content, which is exactly standalone mode, so it looks
  right in every browser you test in. Debug on the device with an on-screen readout of rects, computed styles,
  `offsetParent` and safe-area insets, shown unconditionally for one deploy (a PWA can't open `?debug=1`).
- Only `transform`, `filter`, `backdrop-filter`, `perspective`, `contain` and `will-change` make a containing block for
  `fixed` descendants. A `fixed` ancestor does not.
- The iOS keyboard accessory bar can't be hidden or covered from a web page. Don't design a floating bottom input that
  assumes otherwise (the HelpDesk built and reverted exactly this).

## Accessibility

- Labels over lens glass rely on the dark tint (0.14). Check over the brightest poster or image it will sit on, not
  the average one; raise the tint or add a text shadow if it fails.
- `--text3` (hints, 2.88:1 on white) never carries real content; use `--text2` (6.82:1) or `--text`.
- Every glass control is a real `<button>` with a visible focus ring; the glass canvas is `aria-hidden` and
  `pointer-events:none`.

## One inherited bug, do not copy it

The HelpDesk references `var(--text1)` in 67 places but never defines it, so those hover colours silently do nothing.
`liquid-glass.css` defines `--text1` as the hover/emphasis grade; adding those two token lines in the HelpDesk fixes all
67 call sites.

## Extending it

New surface? Decide its material from the table first. Add tokens rather than one-off `rgba()` literals; a value the
tokens don't cover is a signal to add a token. Test the lens over the brightest content it will ever sit on, while
scrolling, on an iPhone in standalone mode.
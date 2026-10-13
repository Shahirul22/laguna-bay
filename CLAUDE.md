# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal project. It turns the **Type A (900 sq ft) floor plan** of Laguna Bay Residences (`0804_Floor_Plan_A_Update_v1.jpg`) into a 3D interior you can walk through in first person in a web browser. The owner wants spatial accuracy and visual quality. They do not want non-functional extras: no backend, no CI, no test infrastructure unless asked.

## Stack (decided)

- **Three.js + Vite + TypeScript.** Static site, run locally (`npm run dev`). No backend.
- **First-person controls.** Pointer-lock mouse-look and WASD movement, eye height 1600 mm, about 1.4 m/s walking speed. Collisions are tested against the wall rectangles. Free movement, not jumps between fixed viewpoints.
- **Furniture is built in code from exact dimensions** (rounded boxes, legs, cushions). If a downloaded model (e.g. a CC0 GLB) is ever used, scale it to the exact bounding box in the layout data. Sizes are absolute and must never be eyeballed.
- **Looks.** PBR materials using the hex palette in `analysis/ROOM_ANALYSIS.md` §1, an indoor environment map, soft shadows, and light fixtures placed where the analysis specifies.
- **Verification tools in the app.** A tape measure (click two points to read mm) and a top-down plan toggle.

## Commands

```bash
npm run dev     # walkthrough at http://localhost:5173
npm run build   # type-check (tsc) + production build into dist/
npm run plans   # regenerate analysis/plan-trace.svg and analysis/proposed-layout.svg (plain Node, no deps)
```

There is no test suite. Accuracy is checked **in the app**: open `http://localhost:5173/?verify` and read the console table (also on `window.__verify`). It reports:
- every furniture/AC body's real bounding box against its plan rectangle and height, per side, in mm;
- wall-to-wall clear dimensions of each enclosed room (ray casts at 2450 mm) against the room rectangle.

Run it after any geometry change. The expected result is 0 mm room deltas and no item exceeding its envelope.

Other URL hooks, useful for screenshots:
- `?vp=<viewpoint id>&mode=evening&plan=1&ui=0`
- `?at=x,y,yaw` (plan mm)
- `window.__app` (`goto`, `setMode`, `setPlan`, `render`, `walker`)

## App structure (`src/`)

- `plan.ts`: typed re-export of `layout.mjs`, plus `roomAt` / `inFootprint`.
- `architecture.ts`: walls, floors, ceilings, windows, door frames and leaves.
  - Walls are emitted **face by face**, not as boxes. Each face is split at room boundaries and at neighbouring solids' edges.
  - Each face takes its finish from `wallFinishes`. Skirting is added on dry painted faces.
  - Openings become sill and lintel solids.
- `furniture.ts`: one parametric builder per item id (or id pattern).
  - Builders work in a local frame: front = +Z, width X, depth Z, origin at the footprint centre. `geom.place` rotates the result by the item's `front`.
  - Handles, taps, trunking and decor are tagged `hw()` / `decor()`, so `?verify` measures only the body.
- `fixtures.ts`: L-boxes with cove (`rgb` for the gaming room), curtains, blinds, hexagon wall panels, framed art (procedural prints), backsplash, mirrors (`Reflector`), shower kit.
- `models.ts`: CC0 glTF plants/vases, scaled uniformly to fit their envelope and loaded asynchronously (not merged). Plants are `kind: 'plant'` furniture items, so their position is in `layout.mjs`; `?verify` measures them once loaded.
- `lighting.ts`: fixtures and lights from `lights` (incl. `wash`: coloured rect lights for the gaming room's RGB cove and screen glow), the sun, rect-area "sky" lights at the openings, and the day/evening switch.
- `materials.ts`: palette plus procedural canvas textures. **UVs are metres** (`geom.metreUV`), so tile and plank sizes are real.
- `touch.ts`: on-screen controls for touch devices (`(pointer: coarse)`, or `?touch=1` to test on desktop): walk stick, drag to look, Door/Light/Plan/Tape/Rooms buttons that dispatch the same key events, tap to mark the tape point, +/− zoom in plan view. Touch has no pointer lock, so `Walker.touchMode` replaces the lock check.
- `controls.ts`: pointer-lock walking, 200 mm-radius body, per-axis collision against plan rectangles (mm).
- `tools.ts`: tape measure and plan view (ortho camera; layer 1 = ceiling-level items hidden in plan; layer 2 = plan-only wall caps).
- `main.ts`: loading screen (`#loading` in `index.html`; each build stage awaits a paint so the text updates, and it fades out after frame 3 once textures are in; `__ready` still marks frame 3), assembly, `mergeStatic` (one mesh per material), GTAO post-processing, colliders, keys.

Assets (all CC0, in `public/`):
- `textures/`: ambientCG scans, `Wood049` (oak), `Fabric019`, `Carpet016` and `PaintedPlaster017` (colour, normal, roughness at 1K), and `Marble012` (grey marble, colour + roughness at 2K, no normal: polished).
  - `materials.ts` tints each colour map so its average equals the palette hex (`SCAN_MEAN` holds the scans' sRGB means). Re-measure the mean if you swap a scan.
  - Walnut reuses the oak scan.
- `models/`: Poly Haven glTF (1k): `potted_plant_01/02/04`, `ceramic_vase_01/03`. The two floor plants were decimated with meshoptimizer (176k → 58k and 70k → 44k triangles).
- `env/day.jpg`, `env/evening.jpg`: Poly Haven pure-sky panoramas (`kloofendal_48d_partly_cloudy_puresky`, `qwantani_dusk_2_puresky`).
  - Below the horizon the panorama was replaced with a generated hazy sea, to read as a high-rise sea view.
  - The panorama is rotated so its sun matches the directional light (`SUN` in `lighting.ts`).

Performance rules (the scene is forward-rendered with ~30 lights):
- **Off lights are `visible = false`,** never just intensity 0. Hidden lights drop out of the shaders; mode switches recompile once.
- **The sun's shadow map is cached** (`shadowMap.autoUpdate = false`). Set `renderer.shadowMap.needsUpdate = true` whenever something that casts shadows moves (doors, mode or plan switch).
- **Mirrors (`Reflector`) re-render the whole scene,** and frustum culling ignores walls. Each mirror therefore reflects only when the viewer is in one of its `seenFrom` rooms, at half the frame rate, and never during the GTAO pass.
- **Resolution adapts** between 60% and min(devicePixelRatio, 1.5) to hold ~50+ fps.
- **Models are culled by room** (`models.cullModels`, like the mirrors): a plant behind walls would still be fully shaded. Alpha-tested leaves use Lambert, about 10× cheaper than Standard for layered foliage.
- **The HUD (top right) shows FPS, resolution and the GPU** the browser is using. It warns on integrated or software GPUs, and says so when the browser hides the GPU name (Brave Shields).

Rendering notes:
- Tone mapping is per mode (`lighting.setMode`): Khronos PBR Neutral by day (true palette colours), ACES in the evening (Neutral turns warm LEDs orange).
- Screens and art use 0..1 UVs (`PlaneGeometry` via `geom.mesh`), not metre UVs.
- Meshes marked `userData.keep` are not merged: door leaves, mirrors, transparent sheers.
- The shadow pass uses the *view* camera's layers. So the sun is disabled in plan view, where the ceiling layer is hidden.

## Architecture: geometry has a single source

`analysis/tools/layout.mjs` is **the source of truth for every coordinate**.
- **Exports:** walls, windows, doors (hinge, leaf width, swing angles), rooms, furniture (with `front`), AC units, checked clearance dimensions. The 3D-only exports are `wallFinishes`, `fixtures`, `lights`, `viewpoints` and `context` (the placeholder common corridor).
- **Consumers:** both SVG drawings and the 3D app (via `src/plan.ts`) are built from it. Never duplicate coordinates elsewhere. If the layout changes, change it there, then update `ROOM_ANALYSIS.md` so the stated clearances still match.

Conventions in `layout.mjs`:
- **Units:** millimetres.
- **Origin:** the **outer top-left corner** of the plan. **+X = right, +Y = down** on the drawing. "North" in the docs means the top of the drawing (the window side).
- **Rectangles** are `r: [x0, y0, x1, y1]`. Round items use `c: [x, y]` plus `d` (diameter).
- **Heights:** `h` is the top of an item and `z` its underside (floating or upper items). For WCs `h` is the cistern top; the seat is at 400.
- **`front`** is the compass side an item's face points to (N = −Y / window side, S, E, W). For beds it is the foot end.
- **Door angles** use the SVG convention: 0° = +X, 90° = +Y.
- **Mapping to Three.js:** plan X → world X, plan Y → world Z, height → world Y.
- **`kind` values:** `upper` / `soft` mark wall-hung or ceiling items and rugs. `uncertain` marks elements drawn ambiguously on the plan: the M&E shaft, the grey nib in the master bedroom, and the yard's open side.

How the measurements were derived (in `ROOM_ANALYSIS.md` §0):
- Pixel tracing, with a separate scale per axis: X 9450/1188 mm/px, Y 9800/1253 mm/px. This keeps both printed dimensions exact.
- Validated against standard-size items on the plan. Tolerance is ±20 mm on wall faces.
- `plan-trace.svg` overlays the trace on the JPG for visual checking.

## Design inputs and precedence

1. **The floor plan.** Walls, doors, windows and their swings are fixed. Do not move or invent architecture. The kitchen glass screen is an owner-approved exception.
2. **Owner decisions** recorded in `analysis/ROOM_ANALYSIS.md`: struck-through "Settled" items and the v2 notes at the top. These override the brief.
3. **`design.md`**, the original interior brief: style, palette, room requirements, clearance rules and design-decision priorities.

Key settled facts that are easy to get wrong:
- **Ceiling 2800** (assumed).
- **Living window:** tall, door-like sliding window, sill 140, head 2100. All other windows: standard sliding, sill 900, head 2100.
- **Bathroom openings:** louvred ventilators with the exhaust fan, not glazed windows.
- **Floors:** 600×600 tile overlay everywhere except **Bedroom 3**, which is vinyl (smoked oak).
- **AC outdoor units:** outside the house; do not model them.
- **Kitchen glass screen:** render it **partly open**.
- **Foyer:** it lies *outside* the main door.
- **Room roles:** Bath 1 is the master ensuite. Bedroom 3 is the dual-PC gaming room, styled as one (black desks, racing chairs, RGB).
- **Master (v3):** bed head on the window wall (blind, not curtains), floating bedside drawers, 1485 sliding wardrobe on the bottom wall; no towers, corner wardrobe or dressing table.
- **Materials:** grey marble replaces most wood (owner, v3). Oak only on the dining chairs, walnut only on the main door.

# Laguna Bay Type A: 3D Walkthrough

A first-person 3D walkthrough of the **Type A (900 sq ft)** floor plan of Laguna Bay Residences, built from the original plan (`0804_Floor_Plan_A_Update_v1.jpg`). Walk through the unit in a web browser with the mouse and WASD keys.

Built with Three.js, Vite and TypeScript. It is a static site with no backend.

## Quick start

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click the page to lock the mouse.

To share it publicly, start a Cloudflare tunnel in a second terminal (needs `cloudflared` installed, see [Sharing it publicly](#sharing-it-publicly-with-a-cloudflare-tunnel)):

```bash
cloudflared tunnel --url http://localhost:5173
```

It prints a `https://<random-words>.trycloudflare.com` URL. Press Ctrl+C in each terminal to stop.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server at http://localhost:5173 |
| `npm run build` | Type-check and build a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run plans` | Regenerate the 2D drawings in `analysis/` |

## Controls

- **Mouse:** look around (pointer lock)
- **WASD:** walk (about 1.4 m/s, eye height 1.6 m)
- **Touch devices:** on-screen walk stick, drag to look, and buttons for Door, Light, Plan, Tape and Rooms
- **Tape measure:** click two points to read the distance in mm
- **Plan toggle:** switch to a top-down view

## Useful URL options

- `?verify`: run the accuracy check and print a table to the console
- `?mode=evening`: evening lighting
- `?plan=1`: start in top-down plan view
- `?ui=0`: hide the UI
- `?vp=<viewpoint id>`: jump to a saved viewpoint
- `?at=x,y,yaw`: start at a plan position (mm)
- `?touch=1`: test the touch controls on desktop

## Project overview

The plan is traced into millimetre coordinates, and the 3D scene is generated from them.

- `analysis/tools/layout.mjs` is the single source of every coordinate: walls, windows, doors, rooms, furniture, lights.
- Both the SVG drawings and the 3D app are built from that file.
- Furniture is built in code from exact dimensions, not eyeballed.
- Materials are PBR, using the palette in `analysis/ROOM_ANALYSIS.md`.
- Lighting has day and evening modes.

Layout of the repo:

- `src/`: the Three.js app (architecture, furniture, fixtures, lighting, controls, tools)
- `analysis/`: the room analysis, the traced plan and the proposed layout drawings
- `design.md`: the original interior design brief
- `public/`: textures, models and sky panoramas (all CC0)

Accuracy is checked in the app with `?verify`. It compares every item and room against its plan dimensions, and the expected result is 0 mm room deltas.

## Sharing it publicly with a Cloudflare tunnel

A quick tunnel gives the local server a temporary public URL, with no account needed.

1. Install `cloudflared`.
   - Debian/Ubuntu/WSL (download the binary):
     ```bash
     curl -fsSL -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
     chmod +x cloudflared
     sudo mv cloudflared /usr/local/bin/
     ```
   - macOS: `brew install cloudflared`
   - Windows: `winget install Cloudflare.cloudflared`
2. Start the dev server: `npm run dev`
3. In a second terminal: `cloudflared tunnel --url http://localhost:5173`
4. Open the `https://<random-words>.trycloudflare.com` URL it prints.

`vite.config.ts` already allows `.trycloudflare.com` hosts. The URL changes every time the tunnel restarts. Press Ctrl+C in each terminal to stop.

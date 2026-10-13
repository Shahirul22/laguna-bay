// Material library. Colours are the palette hex values from
// analysis/ROOM_ANALYSIS.md §1. Textures are CC0 scans (public/textures) or
// procedural canvases, authored in real units: geometry UVs are in metres, and
// each texture's repeat is 1 / (metres covered), so a 600 mm tile renders
// exactly 600 mm wide. Screens and pictures use 0..1 UVs instead.
import * as THREE from 'three';

let maxAniso = 8;
export function setMaxAnisotropy(a: number) { maxAniso = a; }

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function tex(c: HTMLCanvasElement, metresW: number, metresH: number, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / metresW, 1 / metresH);
  t.anisotropy = maxAniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Adds per-pixel luminance noise (amp in 0–255 units). */
function noise(ctx: CanvasRenderingContext2D, w: number, h: number, amp: number, seed: number) {
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amp;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Soft blotches for stone/porcelain variation. */
function clouds(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, count: number, alpha: number, seed: number) {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let i = 0; i < count; i++) {
    const cx = x + r() * w, cy = y + r() * h, rad = (0.05 + r() * 0.25) * Math.max(w, h);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const light = r() > 0.5;
    g.addColorStop(0, `rgba(${light ? '255,255,255' : '0,0,0'},${alpha * r()})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  ctx.restore();
}

function shade(hex: string, f: number) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l * f)));
  return '#' + c.getHexString();
}

interface TileOpts {
  tileW: number; tileH: number; // mm
  cols: number; rows: number;   // tiles in the canvas
  pxPerMm: number;
  base: string; grout: string; groutMm: number;
  vary: number; speckle: number; clouds: number;
  offset?: number;               // running-bond offset fraction per row
  seed: number;
}

/** Tile field: colour map + bump map (grout recessed). */
function tiles(o: TileOpts) {
  const W = Math.round(o.tileW * o.cols * o.pxPerMm), H = Math.round(o.tileH * o.rows * o.pxPerMm);
  const [c, ctx] = canvas(W, H);
  const [b, bctx] = canvas(W, H);
  const r = rng(o.seed);
  const tw = o.tileW * o.pxPerMm, th = o.tileH * o.pxPerMm, g = Math.max(1, o.groutMm * o.pxPerMm);
  ctx.fillStyle = o.grout; ctx.fillRect(0, 0, W, H);
  bctx.fillStyle = '#000'; bctx.fillRect(0, 0, W, H);
  for (let row = 0; row < o.rows; row++) {
    const off = ((o.offset ?? 0) * row % 1) * tw;
    for (let col = -1; col < o.cols; col++) {
      const x = col * tw + off, y = row * th;
      ctx.fillStyle = shade(o.base, 1 + (r() - 0.5) * o.vary);
      ctx.fillRect(x + g / 2, y + g / 2, tw - g, th - g);
      if (o.clouds) clouds(ctx, x + g / 2, y + g / 2, tw - g, th - g, 6, o.clouds, o.seed + row * 31 + col);
      bctx.fillStyle = '#fff';
      bctx.fillRect(x + g / 2, y + g / 2, tw - g, th - g);
    }
  }
  if (o.speckle) noise(ctx, W, H, o.speckle, o.seed + 7);
  const mW = (o.tileW * o.cols) / 1000, mH = (o.tileH * o.rows) / 1000;
  return { map: tex(c, mW, mH), bump: tex(b, mW, mH, false) };
}

/** Wood veneer/laminate: boards along U with wavy grain lines. */
function wood(base: string, o: { boardMm: number; lenMm: number; seed: number; contrast?: number; pxPerMm?: number }) {
  const ppm = o.pxPerMm ?? 0.5;
  const W = Math.round(o.lenMm * ppm), H = Math.round(o.boardMm * 6 * ppm);
  const [c, ctx] = canvas(W, H);
  const r = rng(o.seed);
  const k = o.contrast ?? 1;
  const bh = H / 6;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = shade(base, 1 + (r() - 0.5) * 0.12 * k);
    ctx.fillRect(0, i * bh, W, bh);
    // grain lines
    const lines = 26 + Math.floor(r() * 14);
    for (let j = 0; j < lines; j++) {
      const y0 = i * bh + r() * bh, amp = 1 + r() * bh * 0.08, freq = (1 + r() * 3) * Math.PI * 2 / W, ph = r() * 6;
      ctx.strokeStyle = r() > 0.5 ? `rgba(60,35,15,${(0.05 + r() * 0.12) * k})` : `rgba(255,240,215,${(0.04 + r() * 0.08) * k})`;
      ctx.lineWidth = 0.6 + r() * 1.6;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y = y0 + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 3.7 + ph) * amp * 0.25;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // occasional cathedral arcs
    for (let j = 0; j < 2; j++) {
      const cx = r() * W, cy = i * bh + bh / 2, len = W * (0.1 + r() * 0.15);
      for (let a = 0; a < 6; a++) {
        ctx.strokeStyle = `rgba(70,40,15,${0.06 * k})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, len * (1 - a * 0.13), bh * 0.35 * (1 - a * 0.13), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  noise(ctx, W, H, 8 * k, o.seed + 3);
  // the canvas tiles in both directions; boards seam vertically via clip
  return tex(c, o.lenMm / 1000, (o.boardMm * 6) / 1000);
}

/** Staggered plank floor (SPC vinyl). */
function planks(base: string, seed: number) {
  const ppm = 0.6, L = 1220, Wd = 180, rows = 8, cols = 2;
  const W = Math.round(L * cols * ppm), H = Math.round(Wd * rows * ppm);
  const [c, ctx] = canvas(W, H);
  const [b, bctx] = canvas(W, H);
  const grain = wood(base, { boardMm: Wd, lenMm: L * 2, seed, contrast: 1.3, pxPerMm: ppm }).image as HTMLCanvasElement;
  const r = rng(seed + 1);
  bctx.fillStyle = '#000'; bctx.fillRect(0, 0, W, H);
  for (let row = 0; row < rows; row++) {
    const off = r() * L * ppm;
    for (let col = -1; col <= cols; col++) {
      const x = col * L * ppm + off, y = row * Wd * ppm;
      const sy = Math.floor(r() * 5) * Wd * ppm;
      ctx.save();
      ctx.beginPath(); ctx.rect(x + 1, y + 1, L * ppm - 2, Wd * ppm - 2); ctx.clip();
      ctx.filter = `brightness(${0.9 + r() * 0.2})`;
      ctx.drawImage(grain, x - r() * L * ppm * 0.9, y - sy);
      ctx.restore();
      bctx.fillStyle = '#fff'; bctx.fillRect(x + 1, y + 1, L * ppm - 2, Wd * ppm - 2);
    }
  }
  ctx.filter = 'none';
  return { map: tex(c, (L * cols) / 1000, (Wd * rows) / 1000), bump: tex(b, (L * cols) / 1000, (Wd * rows) / 1000, false) };
}

function grass(seed: number) {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#5f7a3a'; ctx.fillRect(0, 0, 512, 512);
  const r = rng(seed);
  for (let i = 0; i < 9000; i++) {
    const x = r() * 512, y = r() * 512;
    ctx.strokeStyle = `hsl(${80 + r() * 30},${35 + r() * 25}%,${22 + r() * 25}%)`;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 6, y + (r() - 0.5) * 6); ctx.stroke();
  }
  return tex(c, 0.3, 0.3);
}

// ---------------------------------------------------------------------------
// Screen content and wall art (procedural canvases, UVs 0..1)

function screen(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, gain: number, w: number, h: number) {
  const [c, ctx] = canvas(w, h);
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(gain, gain, gain) });
}

function grad(ctx: CanvasRenderingContext2D, y0: number, y1: number, stops: string[]) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
  return g;
}

function ridge(ctx: CanvasRenderingContext2D, w: number, base: number, amp: number, fill: string, seed: number) {
  const r = rng(seed);
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.moveTo(0, base);
  let y = base;
  for (let x = 0; x <= w; x += 8) { y = Math.min(base + amp, Math.max(base - amp, y + (r() - 0.5) * amp * 0.5)); ctx.lineTo(x, y); }
  ctx.lineTo(w, 9999); ctx.lineTo(0, 9999); ctx.fill();
}

/** Open-world game: dusk landscape + HUD. */
function game(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = grad(ctx, 0, h * 0.6, ['#2a3f7a', '#b5687a', '#f3b46b']); ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffe2a8'; ctx.beginPath(); ctx.arc(w * 0.68, h * 0.5, 26, 0, Math.PI * 2); ctx.fill();
  ridge(ctx, w, h * 0.5, 40, '#5b4a6e', 3);
  ridge(ctx, w, h * 0.6, 30, '#3a3550', 5);
  ctx.fillStyle = grad(ctx, h * 0.66, h, ['#2f4a3a', '#1b2a20']); ctx.fillRect(0, h * 0.68, w, h);
  ridge(ctx, w, h * 0.7, 12, '#24382c', 7);
  // HUD: health/stamina, minimap, crosshair, hotbar
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(18, h - 52, 170, 30);
  ctx.fillStyle = '#e04848'; ctx.fillRect(22, h - 48, 120, 10);
  ctx.fillStyle = '#4fc36b'; ctx.fillRect(22, h - 34, 90, 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(w - 60, 60, 42, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(20,30,25,0.6)'; ctx.fill();
  ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.moveTo(w - 60, 48); ctx.lineTo(w - 52, 68); ctx.lineTo(w - 68, 68); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(w / 2 - 1, h / 2 - 9, 2, 18); ctx.fillRect(w / 2 - 9, h / 2 - 1, 18, 2);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(w / 2 - 105 + i * 36, h - 46, 30, 30); ctx.strokeStyle = i === 1 ? '#ffd34d' : 'rgba(255,255,255,0.5)'; ctx.strokeRect(w / 2 - 105 + i * 36, h - 46, 30, 30); }
}

/** Night city shooter-style scene with neon. */
function city(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = grad(ctx, 0, h, ['#090c1f', '#1b1440', '#40205a']); ctx.fillRect(0, 0, w, h);
  const r = rng(9);
  for (let i = 0; i < 26; i++) {
    const bw = 20 + r() * 50, bh = 80 + r() * 260, x = r() * w;
    ctx.fillStyle = `hsl(${240 + r() * 40},30%,${8 + r() * 8}%)`; ctx.fillRect(x, h - bh - 40, bw, bh + 40);
    for (let k = 0; k < 30; k++) { ctx.fillStyle = r() > 0.5 ? '#ffcf6b' : '#5fe1ff'; ctx.globalAlpha = 0.25 + r() * 0.6; ctx.fillRect(x + 3 + r() * (bw - 6), h - bh - 30 + r() * bh, 3, 4); }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#ff3fa4'; ctx.fillRect(w * 0.18, h * 0.42, 60, 6);
  ctx.fillStyle = '#29e6ff'; ctx.fillRect(w * 0.62, h * 0.35, 80, 6);
  ctx.fillStyle = '#111'; ctx.fillRect(0, h - 40, w, 40);
  ctx.fillStyle = '#29e6ff'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('30 / 120', w - 120, h - 14);
  ctx.fillStyle = '#fff'; ctx.fillRect(w / 2 - 1, h / 2 - 7, 2, 14); ctx.fillRect(w / 2 - 7, h / 2 - 1, 14, 2);
}

/** Portrait monitor: voice/chat app. */
function chat(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#313338'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1e1f22'; ctx.fillRect(0, 0, 44, h);
  ctx.fillStyle = '#2b2d31'; ctx.fillRect(44, 0, 100, h);
  const r = rng(4);
  for (let i = 0; i < 10; i++) { ctx.fillStyle = ['#5865f2', '#3ba55c', '#eb459e', '#faa61a'][i % 4]; ctx.beginPath(); ctx.arc(22, 26 + i * 44, 15, 0, Math.PI * 2); ctx.fill(); }
  for (let i = 0; i < 18; i++) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(54, 18 + i * 34, 40 + r() * 45, 8); }
  for (let i = 0; i < 11; i++) {
    const y = 20 + i * 54;
    ctx.fillStyle = ['#5865f2', '#3ba55c', '#eb459e'][i % 3]; ctx.beginPath(); ctx.arc(164, y + 10, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(182, y, 40 + r() * 40, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(182, y + 15, 80 + r() * 90, 7); ctx.fillRect(182, y + 27, 40 + r() * 120, 7);
  }
  ctx.fillStyle = '#383a40'; ctx.fillRect(154, h - 40, w - 166, 28);
}

const ART: Record<string, (ctx: CanvasRenderingContext2D, w: number, h: number) => void> = {
  arches: (ctx, w, h) => {
    ctx.fillStyle = '#efe7da'; ctx.fillRect(0, 0, w, h);
    const arch = (cx: number, base: number, rw: number, top: number, fill: string) => {
      ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(cx - rw, base); ctx.lineTo(cx - rw, top + rw);
      ctx.arc(cx, top + rw, rw, Math.PI, 0); ctx.lineTo(cx + rw, base); ctx.fill();
    };
    arch(w * 0.33, h * 0.86, w * 0.17, h * 0.2, '#c98a62');
    arch(w * 0.33, h * 0.86, w * 0.1, h * 0.4, '#e8cfb3');
    ctx.fillStyle = '#8c8f7a'; ctx.beginPath(); ctx.arc(w * 0.7, h * 0.86, w * 0.16, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#d9a441'; ctx.beginPath(); ctx.arc(w * 0.72, h * 0.3, w * 0.07, 0, Math.PI * 2); ctx.fill();
  },
  horizon: (ctx, w, h) => {
    ctx.fillStyle = grad(ctx, 0, h, ['#e9e2d6', '#d8cfc2', '#b9b4aa', '#8e9a9b', '#6f7f84']); ctx.fillRect(0, 0, w, h);
    const r = rng(21);
    for (let i = 0; i < 260; i++) { // dry-brush streaks
      const y = r() * h, x = r() * w;
      ctx.strokeStyle = `rgba(${r() > 0.5 ? '255,255,255' : '60,70,72'},${0.04 + r() * 0.06})`;
      ctx.lineWidth = 1 + r() * 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + r() * 160, y + (r() - 0.5) * 4); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(70,80,82,0.5)'; ctx.fillRect(0, h * 0.58, w, 3);
  },
  sun: (ctx, w, h) => {
    ctx.fillStyle = '#f1ebe1'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d18c5a'; ctx.beginPath(); ctx.arc(w / 2, h * 0.42, w * 0.2, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#c9b79c', '#a98f75', '#7f8c7a', '#c9b79c', '#e2d3bd'][i]; ctx.fillRect(w * 0.12, h * (0.66 + i * 0.05), w * 0.76, h * 0.035); }
  },
  stone: (ctx, w, h) => {
    ctx.fillStyle = '#ece6dc'; ctx.fillRect(0, 0, w, h);
    const blob = (x: number, y: number, rx: number, ry: number, a: number, fill: string) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); ctx.fill(); };
    blob(w * 0.4, h * 0.38, w * 0.26, h * 0.16, 0.4, '#b9b2a7');
    blob(w * 0.62, h * 0.62, w * 0.2, h * 0.13, -0.3, '#6f6a64');
    blob(w * 0.36, h * 0.7, w * 0.1, h * 0.07, 0.2, '#c9a27e');
    ctx.strokeStyle = '#2e2e2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w * 0.62, h * 0.3, w * 0.12, 0.2, 2.6); ctx.stroke();
  },
  synthwave: (ctx, w, h) => {
    ctx.fillStyle = grad(ctx, 0, h, ['#12002b', '#3b0a5e', '#ff3fa4', '#12002b']); ctx.fillRect(0, 0, w, h);
    const cy = h * 0.5, R = w * 0.26;
    ctx.save(); ctx.beginPath(); ctx.arc(w / 2, cy, R, Math.PI, 0); ctx.clip();
    ctx.fillStyle = grad(ctx, cy - R, cy, ['#ffe66d', '#ff6b9d']); ctx.fillRect(0, cy - R, w, R);
    ctx.fillStyle = '#3b0a5e'; for (let i = 0; i < 6; i++) ctx.fillRect(0, cy - R * 0.5 + i * R * 0.1, w, 2 + i * 2);
    ctx.restore();
    ctx.fillStyle = '#12002b'; ctx.fillRect(0, cy, w, h - cy);
    ctx.strokeStyle = '#29e6ff'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const y = cy + (h - cy) * (i / 11) ** 2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * 6, cy); ctx.lineTo(w / 2 + i * w * 0.18, h); ctx.stroke(); }
    ctx.fillStyle = '#ff3fa4'; ctx.font = `bold ${Math.round(w * 0.12)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('PLAYER 2', w / 2, h * 0.16);
  },
};

const artCache = new Map<string, THREE.MeshStandardMaterial>();
/** Canvas print for a framed picture (aspect w:h). */
export function artMaterial(style: string, aspect: number) {
  const key = `${style}|${aspect.toFixed(2)}`;
  if (!artCache.has(key)) {
    const W = 512, H = Math.round(512 / aspect);
    const [c, ctx] = canvas(W, H);
    (ART[style] ?? ART.stone)(ctx, W, H);
    noise(ctx, W, H, 6, 5); // paper/canvas grain
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    artCache.set(key, std({ map: t, roughness: 0.85 }));
  }
  return artCache.get(key)!;
}

export function kelvin(k: number) {
  // Tanner Helland approximation, good enough for 2700–6500 K
  const t = k / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const cl = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  return new THREE.Color().setRGB(cl(r), cl(g), cl(b), THREE.SRGBColorSpace);
}

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

// ---------------------------------------------------------------------------
// Scanned CC0 maps (ambientCG, public/textures). Colour maps are tinted so
// their average matches the palette hex: material.color = palette / scan mean
// (per channel, linear), so the scan adds real grain/weave without shifting
// the agreed colours.

const loader = new THREE.TextureLoader();
const SCAN_MEAN: Record<string, [number, number, number]> = { // sRGB means of the colour maps
  oak: [123, 99, 78], fabric: [240, 240, 240], rug: [188, 176, 148], plaster: [190, 190, 187], marble: [173, 173, 182],
};
const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };

function scan(name: string, metres: number, kind: 'color' | 'normal' | 'rough') {
  const t = loader.load(`${import.meta.env.BASE_URL}textures/${name}_${kind}.jpg`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / metres, 1 / metres);
  t.anisotropy = maxAniso;
  if (kind === 'color') t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function tint(name: string, hex: string) {
  const c = new THREE.Color(hex); // linear working space
  const mean = SCAN_MEAN[name].map(lin);
  return new THREE.Color(c.r / mean[0], c.g / mean[1], c.b / mean[2]);
}
/** Scanned PBR material tinted to a palette colour. */
function scanned(name: string, metres: number, hex: string, p: THREE.MeshStandardMaterialParameters & { normal?: number } = {}) {
  const { normal = 0.6, ...rest } = p;
  return std({
    map: scan(name, metres, 'color'), color: tint(name, hex),
    normalMap: scan(name, metres, 'normal'), normalScale: new THREE.Vector2(normal, normal),
    roughnessMap: scan(name, metres, 'rough'), roughness: 1, ...rest,
  });
}
/** Polished stone (no relief): tinted colour scan + roughness scan scaled by `rough`. */
function stone(name: string, metres: number, hex: string, rough: number) {
  return std({ map: scan(name, metres, 'color'), color: tint(name, hex), roughnessMap: scan(name, metres, 'rough'), roughness: rough });
}
/** Surface relief only (keeps a flat palette colour): plaster paint, felt... */
function relief(name: string, metres: number, hex: string, normal: number, roughness: number, p: THREE.MeshStandardMaterialParameters = {}) {
  return std({ color: hex, normalMap: scan(name, metres, 'normal'), normalScale: new THREE.Vector2(normal, normal), roughnessMap: scan(name, metres, 'rough'), roughness, ...p });
}

export function createMaterials() {
  const floorMain = tiles({ tileW: 600, tileH: 600, cols: 4, rows: 4, pxPerMm: 0.75, base: '#E3DCD1', grout: '#d2cabd', groutMm: 2, vary: 0.035, speckle: 7, clouds: 0.05, seed: 11 });
  const floorBath = tiles({ tileW: 600, tileH: 600, cols: 3, rows: 3, pxPerMm: 0.6, base: '#5C5D5B', grout: '#4a4b49', groutMm: 2, vary: 0.06, speckle: 10, clouds: 0.08, seed: 12 });
  const floorYard = tiles({ tileW: 600, tileH: 600, cols: 3, rows: 3, pxPerMm: 0.6, base: '#474846', grout: '#3a3a39', groutMm: 3, vary: 0.06, speckle: 22, clouds: 0.06, seed: 13 });
  const bathWall = tiles({ tileW: 1200, tileH: 600, cols: 2, rows: 3, pxPerMm: 0.5, base: '#ECE8E1', grout: '#dcd7cf', groutMm: 2, vary: 0.025, speckle: 5, clouds: 0.06, seed: 14 });
  const feature = tiles({ tileW: 75, tileH: 300, cols: 16, rows: 4, pxPerMm: 0.8, base: '#CFC6B8', grout: '#bdb4a6', groutMm: 2, vary: 0.08, speckle: 6, clouds: 0, seed: 15 });
  const corridor = tiles({ tileW: 600, tileH: 600, cols: 2, rows: 2, pxPerMm: 0.4, base: '#bdb8b0', grout: '#a9a49c', groutMm: 3, vary: 0.04, speckle: 10, clouds: 0.05, seed: 17 });
  const vinyl = planks('#A08F7C', 21);


  const tileMat = (t: ReturnType<typeof tiles>, rough: number, bump = 0.6) =>
    std({ map: t.map, bumpMap: t.bump, bumpScale: bump, roughness: rough, metalness: 0 });

  const M = {
    paint: relief('plaster', 1.6, '#F2EEE7', 0.18, 1.0),
    skirting: std({ color: '#F4F1EB', roughness: 0.55 }),
    ceiling: relief('plaster', 2.0, '#F7F6F2', 0.12, 1.0),
    exterior: relief('plaster', 1.6, '#D9D4CB', 0.3, 1.0),
    corridorWall: relief('plaster', 1.6, '#E4E1DA', 0.25, 1.0),
    charcoal: relief('plaster', 1.6, '#2E2E2E', 0.25, 0.95),
    sill: std({ color: '#E9E5DE', roughness: 0.4 }),

    floorMain: tileMat(floorMain, 0.42),
    floorBath: tileMat(floorBath, 0.7),
    floorYard: tileMat(floorYard, 0.85, 1),
    floorVinyl: std({ map: vinyl.map, bumpMap: vinyl.bump, bumpScale: 0.6, roughness: 0.75, roughnessMap: scan('oak', 1.2, 'rough') }),
    floorCorridor: tileMat(corridor, 0.8),
    bathTile: tileMat(bathWall, 0.55),
    yardTile: tileMat(bathWall, 0.55),
    featureTile: tileMat(feature, 0.6),

    oak: scanned('oak', 1.3, '#C9A57B', { normal: 0.45, roughness: 0.85 }),
    walnut: scanned('oak', 1.4, '#5B4433', { normal: 0.5, roughness: 0.8 }), // main door only
    // grey marble (sintered-stone look): light for tops/splash, mid grey for cladding and fronts.
    // The roughness scan averages ~0.07, so roughness 3 ≈ 0.2 (polished, soft reflections).
    marble: stone('marble', 1.6, '#D3D1CD', 3),
    marbleGrey: stone('marble', 1.6, '#9E9C98', 3.5),
    cream: std({ color: '#ECE5D8', roughness: 0.6 }),
    greige: std({ color: '#CFC6B8', roughness: 0.7 }),
    upholstery: scanned('fabric', 0.22, '#D9CFC0', { normal: 0.9 }),
    upholsteryDark: scanned('fabric', 0.22, '#B9AC98', { normal: 0.9 }),
    linen: scanned('fabric', 0.15, '#F4F0E8', { normal: 0.5 }),
    duvet: scanned('fabric', 0.15, '#EEE9E0', { normal: 0.5 }),
    throwBlanket: scanned('fabric', 0.3, '#A8907A', { normal: 1.2 }),
    rug: scanned('rug', 0.6, '#CDC3B3', { normal: 1.0 }),
    rugGreige: scanned('rug', 0.6, '#BDB2A2', { normal: 1.0 }),
    rugDark: scanned('rug', 0.5, '#34343a', { normal: 1.2 }),
    leather: std({ color: '#161616', roughness: 0.5 }),
    deskTop: std({ color: '#121212', roughness: 0.55 }),
    grass: std({ map: grass(44), roughness: 1 }),
    felt: relief('fabric', 0.3, '#3a3a3a', 1.0, 1.0),
    sheer: scanned('fabric', 0.2, '#F3EFE7', { normal: 0.4, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }),
    blackout: scanned('fabric', 0.25, '#CBBFAE', { normal: 0.7, side: THREE.DoubleSide }),
    blind: scanned('fabric', 0.25, '#B9AE9E', { normal: 0.5, side: THREE.DoubleSide }),

    black: std({ color: '#1B1B1B', roughness: 0.45, metalness: 0.6 }),
    blackMatte: std({ color: '#1B1B1B', roughness: 0.8 }),
    charcoalBody: std({ color: '#2E2E2E', roughness: 0.65 }),
    steel: std({ color: '#b7b9b9', roughness: 0.32, metalness: 0.75 }),
    alu: std({ color: '#4a4b4d', roughness: 0.45, metalness: 0.7 }),
    plastic: std({ color: '#f4f4f2', roughness: 0.35 }),
    ceramic: std({ color: '#FBFBF9', roughness: 0.12 }),
    screenOff: std({ color: '#060708', roughness: 0.08, metalness: 0.2 }),
    tinted: std({ color: '#151618', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.75 }),
    smoked: std({ color: '#202226', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.4, depthWrite: false }),
    glass: std({ color: '#ffffff', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.06, envMapIntensity: 0.5, depthWrite: false }),
    frosted: std({ color: '#e8eceb', roughness: 0.6, transparent: true, opacity: 0.7 }),
    mirror: std({ color: '#ffffff', roughness: 0.02, metalness: 1 }),

    // emissive materials (switched by the lighting mode)
    led3000: new THREE.MeshBasicMaterial({ color: kelvin(3000) }),
    led2700: new THREE.MeshBasicMaterial({ color: kelvin(2700) }),
    led4000: new THREE.MeshBasicMaterial({ color: kelvin(4000) }),
    shade: std({ color: '#efe6d6', roughness: 1, side: THREE.DoubleSide, emissive: kelvin(2700), emissiveIntensity: 0 }),
    // RGB (gaming room), switched with the LED strips
    rgbPurple: new THREE.MeshBasicMaterial({ color: '#7c4dff' }),
    rgbBlue: new THREE.MeshBasicMaterial({ color: '#3d7bff' }),
    rgbCyan: new THREE.MeshBasicMaterial({ color: '#22d3ee' }),
    rgbMagenta: new THREE.MeshBasicMaterial({ color: '#e040fb' }),
    accentRed: std({ color: '#b3262e', roughness: 0.5 }),
    accentCyan: std({ color: '#1c9fb3', roughness: 0.5 }),
    // screens (self-lit, procedural content)
    screenGame: screen(game, 1.3, 640, 360),
    screenGame2: screen(city, 1.3, 640, 360),
    screenChat: screen(chat, 1.1, 360, 640),
  };
  return M;
}
export type Materials = ReturnType<typeof createMaterials>;

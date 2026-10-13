// Furniture and built-ins, built parametrically from layout.mjs. The overall
// envelope of every item is exactly its plan rectangle × height; builders
// only decide the detailing inside that envelope.
//
// Builders work in a local frame: front faces +Z, width along X, depth along
// Z, origin at the footprint centre on the floor (see geom.place).
import * as THREE from 'three';
import type { Materials } from './materials';
import { box, cyl, mesh, place, rbox } from './geom';
import { model } from './models';
import { type Ctx, bed, decor, fronts, fridge, gamingChair, hw, sofa, washer } from './objects';
import { type Front, type Item, type Rect, acUnits, furniture, m } from './plan';

const GAP = 0.003; // door/drawer reveal

function legs(g: THREE.Group, mat: THREE.Material, w: number, d: number, inset: number, y1: number, size: number, round = false) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (w / 2 - inset), z = sz * (d / 2 - inset);
    g.add(round ? cyl(mat, x, z, 0, y1, size / 2, size / 2.6, { seg: 12 })
      : box(mat, x - size / 2, x + size / 2, 0, y1, z - size / 2, z + size / 2));
  }
}

// ---------------------------------------------------------------------------
// Generic pieces

function bowl(M: Materials, rTop: number, depth: number) {
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(rTop * Math.sin(t * Math.PI / 2) * 0.98 + 0.001, -depth * Math.cos(t * Math.PI / 2)));
  }
  pts.push(new THREE.Vector2(rTop + 0.008, 0.0));
  for (let i = 12; i >= 0; i--) {
    const t = i / 12;
    pts.push(new THREE.Vector2((rTop + 0.008) * Math.sin(t * Math.PI / 2) * 0.98 + 0.001, -depth * Math.cos(t * Math.PI / 2) - 0.008));
  }
  return mesh(new THREE.LatheGeometry(pts, 48), M.ceramic);
}

function monitor(M: Materials, parent: THREE.Group, x: number, z: number, wIn: number, portrait: boolean, bar: boolean, content: THREE.Material) {
  const g = decor(new THREE.Group());
  parent.add(g);
  const diag = wIn * 0.0254;
  let pw = diag * 16 / Math.hypot(16, 9), ph = diag * 9 / Math.hypot(16, 9);
  if (portrait) [pw, ph] = [ph, pw];
  const b = 0.008, y0 = portrait ? 0.86 : 0.95;
  g.add(box(M.blackMatte, x - 0.12, x + 0.12, 0.74, 0.748, z - 0.11, z + 0.08));            // foot
  g.add(box(M.blackMatte, x - 0.02, x + 0.02, 0.748, y0 + 0.15, z - 0.05, z - 0.02));       // neck
  g.add(box(M.blackMatte, x - pw / 2 - b, x + pw / 2 + b, y0, y0 + ph + 2 * b, z - 0.01, z + 0.012));
  const scr = mesh(new THREE.PlaneGeometry(pw, ph), content, { shadow: false }); // 0..1 UVs: the whole picture
  scr.position.set(x, y0 + b + ph / 2, z + 0.0125);
  scr.userData.emissive = true;
  g.add(scr);
  if (bar) {
    g.add(cyl(M.black, 0, 0, 0, 0.45, 0.012, 0.012, { seg: 12 }).rotateZ(Math.PI / 2).translateY(0));
    const lb = g.children[g.children.length - 1];
    lb.position.set(x, y0 + ph + 2 * b + 0.018, z - 0.01);
    const glow = box(M.led4000, x - 0.2, x + 0.2, y0 + ph + 2 * b + 0.004, y0 + ph + 2 * b + 0.007, z + 0.0, z + 0.01, { shadow: false });
    glow.userData.emissive = true;
    g.add(glow);
  }
}

/** Floating bedside drawer unit: greige body, `n` drawers, marble top, an ornament on top. */
function bedside({ M, it, w, d, z, h }: Ctx, n: number, ornament: string) {
  const g = new THREE.Group();
  const t = 0.02;
  g.add(box(M.greige, -w / 2, w / 2, z, h - t, -d / 2, d / 2 - 0.018));
  const step = (h - t - z) / n;
  for (let i = 0; i < n; i++) fronts(g, M.greige, -w / 2, w / 2, z + i * step, z + (i + 1) * step, d / 2 - 0.018, 1, { mat: M.black, kind: 'top' });
  g.add(box(M.marble, -w / 2, w / 2, h - t, h, -d / 2, d / 2));
  g.add(decor(model(ornament, 0.14, 0.14, 0.26, it.room)).translateX(w / 2 - 0.12).translateY(h).translateZ(-0.04));
  g.add(decor(box(M.cream, -w / 2 + 0.06, -w / 2 + 0.24, h, h + 0.025, -0.1, 0.1)));
  return g;
}

/** Sliding-door wardrobe (two tracks): black aluminium frames, cream panels. */
function sliding({ M, w, d, h }: Ctx, n: number) {
  const g = new THREE.Group();
  g.add(box(M.cream, -w / 2, w / 2, 0, h, -d / 2, d / 2 - 0.075));
  const pw = w / n + 0.02;
  for (let i = 0; i < n; i++) {
    const x0 = Math.max(-w / 2, -w / 2 + i * (w / n) - 0.01), x1 = Math.min(w / 2, x0 + pw);
    const z0 = d / 2 - (i % 2 ? 0.075 : 0.045);
    g.add(box(M.black, x0, x1, 0.03, h - 0.03, z0, z0 + 0.025, { rot: true }));
    g.add(box(M.cream, x0 + 0.02, x1 - 0.02, 0.05, h - 0.05, z0 + 0.025, z0 + 0.028, { shadow: false }));
    g.add(hw(box(M.black, x0 + 0.045, x0 + 0.057, 0.85, 1.35, z0 + 0.028, z0 + 0.04)));
  }
  g.add(box(M.blackMatte, -w / 2, w / 2, h - 0.03, h, d / 2 - 0.08, d / 2)); // top track
  return g;
}

// ---------------------------------------------------------------------------
// Item builders (by id or id prefix)

const builders: Record<string, (c: Ctx) => THREE.Object3D> = {
  'shoe-cabinet': ({ M, it, w, d, z, h }) => {
    const g = new THREE.Group();
    g.add(box(M.marbleGrey, -w / 2, w / 2, z, h, -d / 2, d / 2 - 0.018));
    fronts(g, M.cream, -w / 2 + 0.018, w / 2 - 0.018, z + 0.018, h - 0.018, d / 2 - 0.018, 4, { mat: M.black, kind: 'vbar-pair' });
    const led = hw(box(M.led2700, -w / 2 + 0.04, w / 2 - 0.04, z - 0.004, z, d / 2 - 0.06, d / 2 - 0.04, { shadow: false }));
    led.userData.emissive = true;
    g.add(led);
    // a vase on top
    g.add(decor(model('ceramic_vase_03', 0.12, 0.12, 0.42, it.room)).translateX(-w / 2 + 0.2).translateY(h));
    return g;
  },
  'grass-mat': ({ M, w, d, h }) => box(M.grass, -w / 2, w / 2, 0, h, -d / 2, d / 2),
  'tv-wall': ({ M, w, d, h }) => {
    // grey marble cladding: two 1200 slabs (joint hidden behind the TV), edge-lit LED channels
    const g = new THREE.Group();
    const e = 0.012;
    g.add(box(M.marbleGrey, -w / 2 + e, -0.0015, 0.0, h, -d / 2, d / 2));
    g.add(box(M.marbleGrey, 0.0015, w / 2 - e, 0.0, h, -d / 2, d / 2));
    g.add(box(M.charcoalBody, -0.0015, 0.0015, 0, h, -d / 2, d / 2 - 0.004, { shadow: false }));
    for (const s of [-1, 1]) {
      g.add(box(M.charcoalBody, s > 0 ? w / 2 - e : -w / 2, s > 0 ? w / 2 : -w / 2 + e, 0, h, -d / 2, -d / 2 + 0.006, { shadow: false }));
      const led = box(M.led3000, s > 0 ? w / 2 - e : -w / 2, s > 0 ? w / 2 : -w / 2 + e, 0.02, h - 0.005, -d / 2 + 0.006, -d / 2 + 0.012, { shadow: false });
      led.userData.emissive = true;
      g.add(led);
    }
    return g;
  },
  'tv-cabinet': ({ M, it, w, d, z, h }) => {
    // floating greige console with a marble top
    const g = new THREE.Group();
    const t = 0.02;
    g.add(box(M.greige, -w / 2, w / 2, z, h - t, -d / 2, d / 2 - 0.018));
    fronts(g, M.greige, -w / 2, w / 2, z, h - t, d / 2 - 0.018, 3);
    g.add(box(M.marble, -w / 2, w / 2, h - t, h, -d / 2, d / 2));
    g.add(decor(box(M.blackMatte, -0.45, 0.45, h, h + 0.065, -0.04, 0.06))); // soundbar
    g.add(decor(model('ceramic_vase_01', 0.16, 0.16, 0.3, it.room)).translateX(w / 2 - 0.22).translateY(h));
    g.add(decor(box(M.cream, -w / 2 + 0.15, -w / 2 + 0.38, h, h + 0.03, -0.1, 0.08)));
    g.add(decor(box(M.charcoalBody, -w / 2 + 0.16, -w / 2 + 0.36, h + 0.03, h + 0.05, -0.09, 0.07)));
    return g;
  },
  tv: ({ M, w, d, z, h }) => {
    const g = new THREE.Group();
    g.add(box(M.blackMatte, -w / 2, w / 2, z, h, -d / 2, d / 2 - 0.004));
    g.add(box(M.screenOff, -w / 2 + 0.006, w / 2 - 0.006, z + 0.006, h - 0.006, d / 2 - 0.004, d / 2, { shadow: false }));
    return g;
  },
  'sofa-3': (c) => sofa(c, 3),
  'sofa-2': (c) => sofa(c, 2),
  'coffee-table': ({ M, it, w, d, h }) => {
    const g = new THREE.Group();
    g.add(rbox(M.marble, -w / 2, w / 2, h - 0.03, h, -d / 2, d / 2, 0.012));
    g.add(rbox(M.blackMatte, -w / 2 + 0.06, w / 2 - 0.06, 0.12, 0.14, -d / 2 + 0.06, d / 2 - 0.06, 0.005));
    legs(g, M.black, w, d, 0.04, h - 0.03, 0.03, true);
    // books + tray
    g.add(decor(box(M.cream, -0.12, 0.12, h, h + 0.03, -0.2, 0.1)));
    g.add(decor(box(M.charcoalBody, -0.11, 0.1, h + 0.03, h + 0.055, -0.19, 0.08)));
    g.add(decor(model('potted_plant_04', 0.13, 0.13, 0.2, it.room)).translateX(0.05).translateZ(0.3).translateY(h));
    return g;
  },
  'dining-table': ({ M, it, w, d, h }) => {
    const g = new THREE.Group();
    g.add(rbox(M.marble, -w / 2, w / 2, h - 0.03, h, -d / 2, d / 2, 0.01));
    g.add(box(M.black, -w / 2 + 0.08, w / 2 - 0.08, h - 0.1, h - 0.03, -d / 2 + 0.08, d / 2 - 0.08));
    legs(g, M.black, w, d, 0.08, h - 0.03, 0.05);
    g.add(decor(model('ceramic_vase_01', 0.2, 0.2, 0.36, it.room)).translateY(h));
    return g;
  },
  chair: ({ M, w, d, h }) => {
    const g = new THREE.Group();
    const seatW = w, sd = d;
    const z0 = d / 2 - sd; // seat starts here, back at the rear
    for (const sx of [-1, 1]) for (const sz of [0, 1]) {
      const x = sx * (seatW / 2 - 0.03), z = sz ? d / 2 - 0.04 : z0 + 0.03;
      g.add(box(M.oak, x - 0.015, x + 0.015, 0, sz ? 0.43 : h, z - 0.015, z + 0.015));
    }
    g.add(box(M.oak, -seatW / 2, seatW / 2, 0.41, 0.43, z0, d / 2 - 0.02));
    g.add(rbox(M.upholstery, -seatW / 2 + 0.01, seatW / 2 - 0.01, 0.43, 0.47, z0 + 0.01, d / 2 - 0.03, 0.018));
    const back = rbox(M.oak, -seatW / 2, seatW / 2, h - 0.17, h, z0 + 0.005, z0 + 0.03, 0.008);
    g.add(back);
    return g;
  },
  'utility-tall': ({ M, w, d, h }) => {
    const g = new THREE.Group();
    g.add(box(M.cream, -w / 2, w / 2, 0.08, h, -d / 2, d / 2 - 0.018));
    g.add(box(M.blackMatte, -w / 2 + 0.03, w / 2 - 0.03, 0, 0.08, -d / 2, d / 2 - 0.05));
    fronts(g, M.cream, -w / 2, w / 2, 0.08, h, d / 2 - 0.018, 2, { mat: M.black, kind: 'vbar-pair' });
    return g;
  },
  'fridge-housing': fridge,
  counter: ({ M, it, w, d }) => {
    // carcass + fronts only; the marble worktop is built in world space (worktops())
    const g = new THREE.Group();
    const top = 0.88, plinth = 0.1;
    const sinkUnit = it.id === 'counter-sink';
    g.add(box(M.marbleGrey, -w / 2, w / 2, plinth, sinkUnit ? 0.66 : top, -d / 2, d / 2 - 0.018));
    if (sinkUnit) {
      g.add(box(M.marbleGrey, -w / 2, -w / 2 + 0.018, 0.66, top, -d / 2, d / 2 - 0.018));
      g.add(box(M.marbleGrey, w / 2 - 0.018, w / 2, 0.66, top, -d / 2, d / 2 - 0.018));
      g.add(box(M.marbleGrey, -w / 2, w / 2, 0.66, top, -d / 2, -d / 2 + 0.018));
    }
    g.add(box(M.blackMatte, -w / 2, w / 2, 0, plinth, -d / 2, d / 2 - 0.06));
    const seg = COUNTER_FRONTS[it.id] ?? [[-w / 2, w / 2, 1, 'door']];
    for (const [a, b, n, kind] of seg) {
      if (kind === 'drawers') {
        const rows = [plinth, 0.33, 0.6, top];
        for (let i = 0; i < 3; i++) fronts(g, M.marbleGrey, a, b, rows[i], rows[i + 1], d / 2 - 0.018, 1, { mat: M.black, kind: 'top' });
      } else fronts(g, M.marbleGrey, a, b, plinth, top, d / 2 - 0.018, n, { mat: M.black, kind: 'top' });
    }
    return g;
  },
  upper: ({ M, it, w, d, z, h }) => {
    const g = new THREE.Group();
    g.add(box(M.cream, -w / 2, w / 2, z, h, -d / 2, d / 2 - 0.018));
    const seg = UPPER_FRONTS[it.id] ?? [[-w / 2, w / 2, Math.max(1, Math.round(w / 0.5))]];
    for (const [a, b, n] of seg) fronts(g, M.cream, a, b, z, h, d / 2 - 0.018, n, { mat: M.black, kind: 'bottom' });
    if (it.id === 'upper-bottom-2') {
      // microwave in the left bay (Q-K3)
      const [a] = seg[0];
      g.add(box(M.screenOff, a + 0.03, a + 0.57, z + 0.02, z + 0.33, d / 2 - 0.002, d / 2, { shadow: false }));
    }
    const led = hw(box(M.led4000, -w / 2 + 0.02, w / 2 - 0.02, z - 0.005, z, d / 2 - 0.07, d / 2 - 0.05, { shadow: false }));
    led.userData.emissive = true;
    g.add(led);
    return g;
  },
  hood: ({ M, w, d, z, h }) => {
    const g = new THREE.Group();
    g.add(box(M.cream, -w / 2, w / 2, z + 0.06, h, -d / 2, d / 2 - 0.018));
    fronts(g, M.cream, -w / 2, w / 2, z + 0.06, h, d / 2 - 0.018, 2, { mat: M.black, kind: 'bottom' });
    g.add(box(M.black, -w / 2 + 0.02, w / 2 - 0.02, z, z + 0.06, -d / 2 + 0.02, d / 2));
    for (const s of [-1, 1]) {
      const l = cyl(M.led4000, s * 0.25, d / 2 - 0.12, z - 0.002, z, 0.025, 0.025, { shadow: false });
      l.userData.emissive = true;
      g.add(l);
    }
    return g;
  },
  hob: ({ M, w, d, z }) => {
    const g = new THREE.Group();
    g.add(box(M.screenOff, -w / 2, w / 2, z, z + 0.006, -d / 2, d / 2));
    const zones: [number, number, number][] = [[-0.2, 0.1, 0.1], [-0.2, -0.12, 0.08], [0.2, 0.1, 0.08], [0.2, -0.12, 0.1]];
    for (const [x, zz, r] of zones) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.003, r, 48), M.alu);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, z + 0.0065, zz);
      g.add(ring);
    }
    return g;
  },
  sink: ({ M, w, d, z }) => {
    // two undermount bowls in the cut-out; faucet behind on the window side
    const root = new THREE.Group();
    const g = hw(new THREE.Group()); // bowls hang below the worktop; tap stands behind the cut-out
    root.add(g);
    const depth = 0.2, t = 0.008;
    const halves: [number, number][] = [[-w / 2, -0.01], [0.01, w / 2]];
    for (const [a, b] of halves) {
      g.add(box(M.steel, a, b, z - depth, z - depth + t, -d / 2, d / 2));
      g.add(box(M.steel, a, a + t, z - depth, z, -d / 2, d / 2));
      g.add(box(M.steel, b - t, b, z - depth, z, -d / 2, d / 2));
      g.add(box(M.steel, a, b, z - depth, z, -d / 2, -d / 2 + t));
      g.add(box(M.steel, a, b, z - depth, z, d / 2 - t, d / 2));
      g.add(cyl(M.alu, (a + b) / 2, 0, z - depth + t, z - depth + t + 0.002, 0.03, 0.03, { shadow: false }));
    }
    g.add(box(M.marble, -0.01, 0.01, z - 0.02, z, -d / 2, d / 2));
    // gooseneck tap at the back (local -Z = window side)
    const zb = -d / 2 - 0.04;
    g.add(cyl(M.black, 0, zb, z, z + 0.32, 0.014, 0.016, { seg: 16 }));
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, z + 0.32, zb), new THREE.Vector3(0, z + 0.44, zb + 0.02), new THREE.Vector3(0, z + 0.3, zb + 0.22));
    g.add(mesh(new THREE.TubeGeometry(curve, 24, 0.011, 10), M.black));
    g.add(box(M.black, 0.03, 0.12, z + 0.2, z + 0.212, zb - 0.006, zb + 0.006));
    return root;
  },
  glass: ({ M, w, d, h, z, it }) => {
    const g = new THREE.Group();
    const f = 0.02;
    const y0 = z, y1 = h;
    g.add(box(M.black, -w / 2, w / 2, y0, y0 + f, -d / 2, d / 2));
    g.add(box(M.black, -w / 2, w / 2, y1 - f, y1, -d / 2, d / 2));
    if (!it.id.includes('screen')) {
      g.add(box(M.black, -w / 2, -w / 2 + f, y0, y1, -d / 2, d / 2));
      g.add(box(M.black, w / 2 - f, w / 2, y0, y1, -d / 2, d / 2));
    } else {
      g.add(box(M.black, -w / 2, -w / 2 + f, y0, y1, -d / 2, d / 2)); // wall channel side only
    }
    const gl = box(M.glass, -w / 2 + f, w / 2 - f, y0 + f, y1 - f, -0.004, 0.004, { shadow: false });
    gl.userData.glass = true;
    g.add(gl);
    if (it.id.startsWith('kitchen-glass-slide')) g.add(hw(box(M.black, w / 2 - 0.06, w / 2 - 0.045, 0.9, 1.4, d / 2, d / 2 + 0.015)));
    return g;
  },
  washer,
  'drying-rack': ({ M, w, d, z, h }) => {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      g.add(box(M.alu, -w / 2, w / 2, z, h, s > 0 ? d / 2 - 0.02 : -d / 2, s > 0 ? d / 2 : -d / 2 + 0.02));
      g.add(hw(cyl(M.alu, 0, s * (d / 2 - 0.01), h, 2.8, 0.004, 0.004, { seg: 6 })));
    }
    for (let i = 0; i < 6; i++) {
      const x = -w / 2 + 0.05 + i * ((w - 0.1) / 5);
      const rod = cyl(M.steel, 0, 0, -d / 2, d / 2, 0.009, 0.009, { seg: 10 });
      rod.rotation.x = Math.PI / 2;
      rod.position.set(x, (z + h) / 2, 0);
      g.add(rod);
    }
    return g;
  },
  'floor-trap': ({ M }) => cyl(M.steel, 0, 0, 0.003, 0.006, 0.06, 0.06),
  'bed2-bed': (c) => bed(c, c.h, { ledge: true, pillows: 2 }),
  'bed2-side': (c) => bedside(c, 1, 'ceramic_vase_03'),
  'bed2-wardrobe': (c) => sliding(c, 3),
  'master-bed': (c) => bed(c, c.h, { pillows: 4 }),
  'master-side-w': (c) => bedside(c, 2, 'ceramic_vase_01'),
  'master-side-e': (c) => bedside(c, 2, 'potted_plant_04'),
  'master-wardrobe': (c) => sliding(c, 2),
  rug: ({ M, it, w, d, h }) => box(it.id === 'rug-bed3' ? M.rugDark : it.id === 'master-rug' ? M.rugGreige : M.rug, -w / 2, w / 2, 0.001, h, -d / 2, d / 2),
  plant: ({ it, w, d, h }) => model(PLANTS[it.id], w, d, h, it.room),
  'floor-lamp': ({ M, h }) => {
    const g = new THREE.Group();
    g.add(cyl(M.black, 0, 0, 0, 0.02, 0.15, 0.15, { seg: 32 }));
    g.add(cyl(M.black, 0, 0, 0.02, h - 0.2, 0.01, 0.01, { seg: 10 }));
    const shade = cyl(M.shade, 0, 0, h - 0.3, h, 0.15, 0.175, { seg: 40, shadow: false });
    (shade.geometry as THREE.CylinderGeometry).dispose();
    shade.geometry = new THREE.CylinderGeometry(0.15, 0.175, 0.3, 40, 1, true);
    shade.userData.keep = true;
    g.add(shade);
    return g;
  },
  desk: ({ M, it, w, d, h }) => {
    // black gaming desk: RGB underglow on the wall edge, 27" + 24" portrait (Q-GR1)
    const g = new THREE.Group();
    g.add(rbox(M.deskTop, -w / 2, w / 2, h - 0.025, h, -d / 2, d / 2, 0.006));
    for (const sx of [-1, 1]) {
      const x = sx * (w / 2 - 0.05);
      g.add(box(M.blackMatte, x - 0.02, x + 0.02, 0, h - 0.025, -d / 2 + 0.04, -d / 2 + 0.08));
      g.add(box(M.blackMatte, x - 0.02, x + 0.02, 0, h - 0.025, d / 2 - 0.08, d / 2 - 0.04));
      g.add(box(M.blackMatte, x - 0.02, x + 0.02, h - 0.07, h - 0.025, -d / 2 + 0.04, d / 2 - 0.04));
    }
    g.add(box(M.blackMatte, -w / 2 + 0.05, w / 2 - 0.05, h - 0.07, h - 0.025, -d / 2 + 0.04, -d / 2 + 0.07));
    const glow = box(M.rgbPurple, -w / 2 + 0.04, w / 2 - 0.04, h - 0.03, h - 0.025, -d / 2 + 0.01, -d / 2 + 0.03, { shadow: false });
    glow.userData.emissive = true;
    g.add(glow);
    const outer = it.id === 'desk-a' ? -1 : 1;
    const zm = -d / 2 + 0.17;
    monitor(M, g, -outer * 0.12, zm, 27, false, true, it.id === 'desk-a' ? M.screenGame : M.screenGame2);
    monitor(M, g, outer * (w / 2 - 0.21), zm + 0.03, 24, true, false, M.screenChat);
    // XXL desk mat with a lit edge, keyboard, mouse, headset on a stand, controller
    const mat = decor(new THREE.Group());
    mat.add(box(M.rugDark, -0.45, 0.45, h, h + 0.003, -0.02, 0.32));
    mat.add(box(M.rgbCyan, -0.45, 0.45, h, h + 0.0035, 0.315, 0.32, { shadow: false }));
    mat.add(rbox(M.blackMatte, -0.3, 0.12, h + 0.003, h + 0.028, 0.06, 0.2, 0.006));
    mat.add(box(M.rgbCyan, -0.295, 0.115, h + 0.003, h + 0.006, 0.2, 0.203, { shadow: false }));
    mat.add(rbox(M.blackMatte, 0.2, 0.26, h + 0.003, h + 0.04, 0.09, 0.2, 0.02));
    const hx = outer * (w / 2 - 0.08), hz = -d / 2 + 0.45;
    mat.add(cyl(M.blackMatte, hx, hz, h, h + 0.01, 0.06, 0.06, { seg: 24 }));
    mat.add(cyl(M.black, hx, hz, h + 0.01, h + 0.3, 0.008, 0.008, { seg: 8 }));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 8, 24, Math.PI), M.leather);
    band.position.set(hx, h + 0.22, hz);
    band.rotation.y = Math.PI / 2;
    mat.add(band);
    for (const e of [-1, 1]) {
      const cup = cyl(M.leather, 0, 0, -0.025, 0.025, 0.045, 0.045, { seg: 20 });
      cup.rotation.x = Math.PI / 2;
      cup.position.set(hx, h + 0.15, hz + e * 0.085);
      mat.add(cup);
    }
    const pad = rbox(M.leather, -0.075, 0.075, h, h + 0.04, -0.05, 0.05, 0.02, { seg: 3 });
    pad.position.x = -outer * 0.42; pad.position.z = 0.2; pad.rotation.y = 0.3;
    mat.add(pad);
    g.add(mat);
    return g;
  },
  pc: ({ M, it, w, d, h }) => {
    // tower with a smoked-glass side towards the player and RGB fans in the front panel
    const g = new THREE.Group();
    const side = it.id === 'pc-a' ? 1 : -1;
    const t = 0.004;
    g.add(box(M.charcoalBody, -w / 2, w / 2, 0.02, 0.02 + t, -d / 2, d / 2));
    g.add(box(M.charcoalBody, -w / 2, w / 2, h - t, h, -d / 2, d / 2));
    const sx = -side * w / 2; // solid side opposite the glass
    g.add(box(M.charcoalBody, Math.min(sx, sx + side * t), Math.max(sx, sx + side * t), 0.02, h, -d / 2, d / 2));
    g.add(box(M.charcoalBody, -w / 2, w / 2, 0.02, h, -d / 2, -d / 2 + t));
    g.add(box(M.smoked, side > 0 ? w / 2 - t : -w / 2, side > 0 ? w / 2 : -w / 2 + t, 0.024, h - t, -d / 2 + t, d / 2 - 0.03, { shadow: false }));
    // inside: motherboard, glowing GPU and RAM, cooler ring
    g.add(box(M.blackMatte, -side * (w / 2 - 0.02), -side * (w / 2 - 0.02) + side * 0.01, 0.06, h - 0.03, -d / 2 + 0.03, d / 2 - 0.08));
    const lit = (mt: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
      const o = box(mt, x0, x1, y0, y1, z0, z1, { shadow: false });
      o.userData.emissive = true;
      g.add(o);
    };
    lit(M.rgbMagenta, -0.07, 0.07, 0.2, 0.205, -d / 2 + 0.06, d / 2 - 0.1);             // GPU light bar
    g.add(box(M.charcoalBody, -0.07, 0.07, 0.15, 0.2, -d / 2 + 0.06, d / 2 - 0.1));
    for (let i = 0; i < 4; i++) lit(M.rgbCyan, -side * 0.06 + side * i * 0.012, -side * 0.06 + side * i * 0.012 + side * 0.006, 0.33, 0.39, -0.02, 0.1);
    const ring = (y: number, z: number, axisX: boolean, mt: THREE.Material) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 8, 32), mt);
      r.position.set(axisX ? 0 : 0, y, z);
      if (axisX) r.rotation.y = Math.PI / 2;
      r.userData.emissive = true;
      g.add(r);
    };
    ring(0.38, -d / 2 + 0.12, true, M.rgbCyan);                                          // CPU cooler
    g.add(box(M.blackMatte, -w / 2 + t, w / 2 - t, 0.024, h - t, d / 2 - 0.016, d / 2 - 0.012)); // front fan mesh, rings in front of it
    for (const y of [0.12, 0.25, 0.38]) ring(y, d / 2 - 0.007, false, M.rgbPurple);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(M.blackMatte, sx * (w / 2 - 0.03) - 0.01, sx * (w / 2 - 0.03) + 0.01, 0, 0.02, sz * (d / 2 - 0.04) - 0.01, sz * (d / 2 - 0.04) + 0.01));
    return g;
  },
  'gaming-chair': gamingChair,
  'gaming-storage': ({ M, w, d, h }) => {
    const g = new THREE.Group();
    g.add(box(M.charcoalBody, -w / 2, w / 2, 0, h, -d / 2, d / 2 - 0.018));
    fronts(g, M.charcoalBody, -w / 2, w / 2, 0, 0.9, d / 2 - 0.018, 2, { mat: M.black, kind: 'top' });
    // lit glass display above: shelves seen through smoked doors
    for (const y of [1.25, 1.6, 1.95]) g.add(box(M.blackMatte, -w / 2 + 0.02, w / 2 - 0.02, y, y + 0.018, -d / 2 + 0.02, d / 2 - 0.05));
    for (const y of [0.92, 1.268, 1.618, 1.968]) {
      const led = box(M.rgbMagenta, -w / 2 + 0.03, w / 2 - 0.03, y + 0.31, y + 0.315, d / 2 - 0.08, d / 2 - 0.07, { shadow: false });
      led.userData.emissive = true;
      g.add(led);
    }
    // consoles, game boxes and figures on the shelves
    const items: [THREE.Material, number, number, number, number, number][] = [
      [M.plastic, -0.42, 0.938, 0.2, 0.26, 0.1], [M.blackMatte, 0.0, 0.938, 0.3, 0.06, 0.25], [M.accentRed, 0.35, 0.938, 0.03, 0.19, 0.14],
      [M.accentCyan, 0.39, 0.938, 0.03, 0.19, 0.14], [M.ceramic, -0.3, 1.286, 0.08, 0.2, 0.08], [M.accentRed, -0.05, 1.286, 0.07, 0.16, 0.07],
      [M.charcoalBody, 0.3, 1.286, 0.22, 0.04, 0.16], [M.accentCyan, -0.4, 1.636, 0.09, 0.22, 0.09], [M.plastic, 0.1, 1.636, 0.12, 0.12, 0.12],
      [M.blackMatte, -0.2, 1.986, 0.25, 0.18, 0.18], [M.accentRed, 0.35, 1.986, 0.08, 0.24, 0.08],
    ];
    for (const [mt, x, y, sw, sh, sd] of items) g.add(decor(box(mt, x - sw / 2, x + sw / 2, y, y + sh, -sd / 2 - 0.04, sd / 2 - 0.04)));
    // two smoked-glass doors in charcoal frames
    const pw = w / 2, z0 = d / 2 - 0.018, z1 = d / 2, fw = 0.03, y0 = 0.9 + GAP, y1 = h - GAP;
    for (let i = 0; i < 2; i++) {
      const a = -w / 2 + i * pw + GAP, b = -w / 2 + (i + 1) * pw - GAP;
      g.add(box(M.charcoalBody, a, b, y0, y0 + fw, z0, z1), box(M.charcoalBody, a, b, y1 - fw, y1, z0, z1),
        box(M.charcoalBody, a, a + fw, y0, y1, z0, z1), box(M.charcoalBody, b - fw, b, y0, y1, z0, z1));
      const gl = box(M.smoked, a + fw, b - fw, y0 + fw, y1 - fw, z0 + 0.006, z0 + 0.012, { shadow: false });
      gl.userData.keep = true; // transparent: sorted separately
      g.add(gl);
    }
    return g;
  },
  vanity: ({ M, w, d, z, h }) => {
    const g = new THREE.Group();
    g.add(box(M.marbleGrey, -w / 2, w / 2, z, h - 0.02, -d / 2, d / 2 - 0.018));
    fronts(g, M.marbleGrey, -w / 2, w / 2, z, h - 0.02, d / 2 - 0.018, 1, { mat: M.black, kind: 'top' });
    g.add(box(M.marble, -w / 2, w / 2, h - 0.02, h, -d / 2, d / 2));
    const b = bowl(M, 0.19, 0.12);
    b.position.set(0, h + 0.128, 0.03);
    b.scale.set(1, 1, 0.78);
    g.add(hw(b));
    // wall-mounted spout above the basin
    g.add(hw(box(M.black, -0.012, 0.012, h + 0.24, h + 0.26, -d / 2, -d / 2 + 0.18)));
    g.add(hw(cyl(M.black, 0.1, -d / 2 + 0.01, h + 0.22, h + 0.28, 0.025, 0.025).rotateX(Math.PI / 2)));
    return g;
  },
  wc: ({ M, w, d, h }) => {
    // close-coupled floor WC: seat 400, cistern to h, bowl front at the envelope edge
    const g = new THREE.Group();
    const seatH = 0.4, rx = w / 2, sz = 1.4, rz = rx * sz, cz = d / 2 - rz;
    g.add(rbox(M.ceramic, -w / 2 + 0.02, w / 2 - 0.02, seatH, h - 0.005, -d / 2, -d / 2 + 0.17, 0.02));
    g.add(hw(cyl(M.steel, 0, -d / 2 + 0.085, h - 0.005, h + 0.0, 0.025, 0.025)));
    const ell = (y0: number, y1: number, rt: number, rb: number) => {
      const c = cyl(M.ceramic, 0, 0, y0, y1, rt, rb, { seg: 40 });
      c.scale.set(1, 1, sz);
      c.position.z = cz;
      g.add(c);
    };
    ell(0, seatH - 0.035, rx - 0.012, rx * 0.62); // pedestal + bowl
    ell(seatH - 0.035, seatH - 0.005, rx, rx);     // seat
    ell(seatH - 0.005, seatH + 0.012, rx - 0.004, rx - 0.004); // lid
    g.add(rbox(M.ceramic, -0.12, 0.12, 0.1, seatH - 0.035, -d / 2 + 0.17, cz, 0.04));
    return g;
  },
};

const ALIAS: [RegExp, string][] = [
  [/^chair-[we]\d$/, 'chair'], [/^counter-/, 'counter'], [/^upper-/, 'upper'], [/^yard-cabinet$/, 'upper'],
  [/^kitchen-glass-|-screen$/, 'glass'], [/^desk-/, 'desk'], [/^pc-/, 'pc'],
  [/^chair-[ab]$/, 'gaming-chair'], [/-vanity$/, 'vanity'], [/-wc$/, 'wc'], [/-rug$|^rug-/, 'rug'], [/^plant-/, 'plant'],
];

// plant id → CC0 model (public/models)
const PLANTS: Record<string, string> = { 'plant-living': 'potted_plant_01', 'plant-bed2': 'potted_plant_02' };

// Front segmentation for runs whose ends are hidden by a corner neighbour.
// Values are local X ranges (m) computed from plan coordinates below.
const COUNTER_FRONTS: Record<string, [number, number, number, 'door' | 'drawers'][]> = {};
const UPPER_FRONTS: Record<string, [number, number, number][]> = {};

/** Local X (m) of a plan point inside an item's frame. */
function localX(it: Item, X: number, Y: number) {
  const r = it.r!;
  const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
  switch (it.front ?? 'S') {
    case 'S': return m(X - cx);
    case 'N': return -m(X - cx);
    case 'E': return -m(Y - cy);
    case 'W': return m(Y - cy);
  }
}

function initFronts() {
  const byId = (id: string) => furniture.find((f) => f.id === id)!;
  const cb = byId('counter-bottom'), cl = byId('counter-left'), cs = byId('counter-sink'), hob = byId('hob');
  // counter-bottom faces N; visible between the two return legs
  const a = localX(cb, cs.r![0], 0), b = localX(cb, cl.r![2], 0);
  const h0 = localX(cb, hob.r![2], 0), h1 = localX(cb, hob.r![0], 0);
  COUNTER_FRONTS['counter-bottom'] = [[a, h0, 1, 'door'], [h0, h1, 1, 'drawers'], [h1, b, 1, 'door']];
  const sw = m(cs.r![3] - cs.r![1]);
  COUNTER_FRONTS['counter-sink'] = [[-sw / 2, sw / 2, 2, 'door']];
  const ub1 = byId('upper-bottom-1'), ul = byId('upper-left');
  const u0 = localX(ub1, ub1.r![2], 0), u1 = localX(ub1, ul.r![2], 0);
  UPPER_FRONTS['upper-bottom-1'] = [[u0, u1, 2]];
  const ub2 = byId('upper-bottom-2');
  const w2 = m(ub2.r![2] - ub2.r![0]);
  UPPER_FRONTS['upper-bottom-2'] = [[-w2 / 2, -w2 / 2 + 0.6, 1], [-w2 / 2 + 0.6, w2 / 2, 1]];
}

export function buildFurniture(M: Materials) {
  initFronts();
  const group = new THREE.Group();
  const dynamic = new THREE.Group(); // non-merged (lamp shade)
  for (const it of furniture) {
    const key = builders[it.id] ? it.id : ALIAS.find(([re]) => re.test(it.id))?.[1];
    if (!key) { console.warn('no builder for', it.id); continue; }
    const front: Front = it.front ?? (it.id.startsWith('chair-') ? 'E' : 'S');
    const r: Rect = it.r ?? [it.c![0] - it.d! / 2, it.c![1] - it.d! / 2, it.c![0] + it.d! / 2, it.c![1] + it.d! / 2];
    const f = { w: 0, d: 0 };
    const sideways = front === 'E' || front === 'W';
    f.w = m(sideways ? r[3] - r[1] : r[2] - r[0]);
    f.d = m(sideways ? r[2] - r[0] : r[3] - r[1]);
    // always wrap: place() sets the root's position, which must not clobber a mesh's own offset
    const obj = new THREE.Group().add(builders[key]({ M, it, w: f.w, d: f.d, z: m(it.z ?? 0), h: m(it.h ?? 0) }));
    place(obj, r, front);
    obj.name = it.id;
    group.add(obj);
  }
  group.add(worktops(M));
  for (const ac of acUnits) group.add(acUnit(M, ac.r, ac.dir, m(ac.z), m(ac.h))).children.at(-1)!.name = ac.id;
  return { group, dynamic };
}

/** Marble worktops in world space, with the sink cut-out. */
function worktops(M: Materials) {
  const g = new THREE.Group();
  const T0 = 0.88, T1 = 0.9, over = 20;
  const byId = (id: string) => furniture.find((f) => f.id === id)!.r!;
  const [lx0, ly0, lx1, ly1] = byId('counter-left');
  const [bx0, by0, bx1, by1] = byId('counter-bottom');
  const [sx0, sy0, sx1, sy1] = byId('counter-sink');
  const [kx0, ky0, kx1, ky1] = byId('sink');
  const top = (x0: number, y0: number, x1: number, y1: number) => g.add(box(M.marble, m(x0), m(x1), T0, T1, m(y0), m(y1)));
  top(lx0, ly0, lx1 + over, ly1);
  top(bx0, by0 - over, bx1, by1);
  // sink leg around the cut-out (front edge overhang toward -X)
  top(sx0 - over, sy0, sx1, ky0);
  top(sx0 - over, ky1, sx1, sy1);
  top(sx0 - over, ky0, kx0, ky1);
  top(kx1, ky0, sx1, ky1);
  return g;
}

function acUnit(M: Materials, r: Rect, dir: number, z: number, h: number) {
  const front: Front = dir === 0 ? 'E' : dir === 180 ? 'W' : dir === 90 ? 'S' : 'N';
  const sideways = front === 'E' || front === 'W';
  const w = m(sideways ? r[3] - r[1] : r[2] - r[0]), d = m(sideways ? r[2] - r[0] : r[3] - r[1]);
  const g = new THREE.Group();
  g.add(rbox(M.plastic, -w / 2, w / 2, z, h, -d / 2, d / 2, 0.035, { seg: 4 }));
  g.add(box(M.charcoalBody, -w / 2 + 0.06, w / 2 - 0.06, z + 0.015, z + 0.06, d / 2 - 0.06, d / 2 - 0.004, { shadow: false }));
  const flap = box(M.plastic, -w / 2 + 0.05, w / 2 - 0.05, z + 0.055, z + 0.065, d / 2 - 0.08, d / 2 - 0.005);
  flap.rotation.x = 0.3;
  g.add(flap);
  g.add(box(M.led4000, w / 2 - 0.16, w / 2 - 0.12, h - 0.09, h - 0.08, d / 2, d / 2 + 0.001, { shadow: false }));
  // refrigerant/condensate trunking up to the ceiling L-box line
  g.add(hw(box(M.plastic, w / 2 - 0.12, w / 2 - 0.04, h, 2.8, -d / 2, -d / 2 + 0.06)));
  return place(g, r, front);
}

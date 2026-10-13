// The detailed hero objects: sofa, bed with bedding, gaming chair, fridge and
// top-load washer. Proportions follow real products (Castlery/IKEA sofas,
// Secretlab Titan Small, Panasonic bottom-freezer fridge, Samsung WA90 top
// loader); the envelope is still exactly the plan rectangle × height.
// Local frame as in furniture.ts: front +Z, width X, depth Z, origin at the
// footprint centre on the floor.
import * as THREE from 'three';
import type { Materials } from './materials';
import { box, cyl, mesh, rbox } from './geom';
import type { Item } from './plan';
import { m } from './plan';

const GAP = 0.003; // door/drawer reveal

export type Ctx = { M: Materials; it: Item; w: number; d: number; z: number; h: number };

// Hardware (handles, hoses) and decor (cushions on top, vases) may extend past the
// plan envelope; ?verify measures the item body without them.
export const hw = <T extends THREE.Object3D>(o: T) => { o.userData.hw = true; return o; };
export const decor = <T extends THREE.Object3D>(o: T) => { o.userData.decor = true; return o; };

const emissive = <T extends THREE.Object3D>(o: T) => { o.userData.emissive = true; (o as unknown as THREE.Mesh).castShadow = false; return o; };

// ---------------------------------------------------------------------------
// Soft goods

/**
 * A pillow of width w (X), height h (Y), thickness t (Z): plump in the middle,
 * pinched to a thin seam at the edges, with a few soft creases.
 */
export function pillow(mat: THREE.Material, w: number, h: number, t: number, seed = 1) {
  const geo = new THREE.BoxGeometry(w, h, t, 18, 18, 6);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), zz = pos.getZ(i);
    const u = Math.min(1, Math.abs(x) / (w / 2)), v = Math.min(1, Math.abs(y) / (h / 2));
    const plump = Math.max(0.1, Math.pow(1 - u * u, 0.55) * Math.pow(1 - v * v, 0.55));
    // corners pull in, the middle crowns; creases radiate from the corners
    const crease = 1 + 0.06 * Math.sin((x / w) * 9 + seed) * Math.sin((y / h) * 7 + seed * 2) * (1 - plump);
    pos.setXYZ(i, x * (1 - 0.05 * v * v), y * (1 - 0.04 * u * u), zz * plump * crease);
  }
  geo.computeVertexNormals();
  return mesh(geo, mat, { rot: false });
}

/**
 * A rounded-box cushion with piping at the top and bottom edges of its front
 * face. Keeps its overall extent exactly x0..x1 × y0..y1 × z0..z1.
 */
function cushion(g: THREE.Group, M: Materials, mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, r: number, welt = true) {
  g.add(rbox(mat, x0, x1, y0, y1, z0, z1, r, { seg: 6 }));
  if (!welt) return;
  const t = 0.007;
  for (const y of [y0 + r * 0.55, y1 - r * 0.55]) g.add(box(M.upholsteryDark, x0 + r, x1 - r, y - t / 2, y + t / 2, z1 - t, z1, { shadow: false }));
}

// ---------------------------------------------------------------------------
// Sofa

export function sofa({ M, w, d, h }: Ctx, seats: number) {
  const g = new THREE.Group();
  const U = M.upholstery;
  const legH = 0.11, arm = 0.13, deckTop = 0.3, seatTop = 0.45, armTop = 0.62;
  const zFront = d / 2;
  // tapered black legs; a centre-rear leg on wide sofas
  const leg = (x: number, z: number) => g.add(cyl(M.black, x, z, 0, legH, 0.018, 0.012, { seg: 12 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(sx * (w / 2 - 0.07), sz * (d / 2 - 0.08));
  if (w > 1.8) leg(0, -d / 2 + 0.1);
  // upholstered deck rail, slim track arms and the back frame
  g.add(rbox(U, -w / 2 + arm, w / 2 - arm, legH, deckTop, -d / 2, zFront, 0.02));
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -w / 2 : w / 2 - arm;
    g.add(rbox(U, x0, x0 + arm, legH, armTop, -d / 2, zFront, 0.03, { seg: 5 }));
    // piping along the front face of each arm
    g.add(box(M.upholsteryDark, x0 + 0.014, x0 + arm - 0.014, legH + 0.03, armTop - 0.02, zFront - 0.004, zFront, { shadow: false }));
  }
  g.add(rbox(U, -w / 2 + arm, w / 2 - arm, legH, 0.65, -d / 2, -d / 2 + 0.14, 0.03));
  // seat cushions: 600 deep, 150 thick, with piping
  const sw = (w - 2 * arm) / seats;
  const seatZ0 = zFront - 0.64, seatZ1 = zFront - 0.03;
  for (let i = 0; i < seats; i++) {
    const x0 = -w / 2 + arm + i * sw + 0.003, x1 = x0 + sw - 0.006;
    cushion(g, M, U, x0, x1, deckTop, seatTop, seatZ0, seatZ1, 0.05);
    // loose back cushion leaning back ~14°, narrower at the top
    const bc = new THREE.Group();
    cushion(bc, M, U, x0, x1, 0, 0.32, -0.085, 0.085, 0.045);
    bc.position.set(0, seatTop - 0.01, -d / 2 + 0.14 + 0.1);
    bc.rotation.x = -0.24;
    g.add(bc);
  }
  // two throw cushions in the corners
  for (const s of [-1, 1]) {
    const c = decor(pillow(s < 0 ? M.throwBlanket : M.upholsteryDark, 0.42, 0.4, 0.16, s + 3));
    c.position.set(s * (w / 2 - arm - 0.27), seatTop + 0.19, seatZ0 + 0.17);
    c.rotation.set(-0.35, s * 0.3, s * 0.08);
    g.add(c);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Bed

/** Cross-fold displacement of a duvet block: soft drape on the sides and foot, gentle waves on top. */
function drape(geo: THREE.BufferGeometry, topY: number, seed: number) {
  const pos = geo.getAttribute('position'), nor = geo.getAttribute('normal');
  geo.computeBoundingBox();
  const b = geo.boundingBox!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = nor.getX(i), ny = nor.getY(i), nz = nor.getZ(i);
    // 0 at the mattress edge, 1 at the hem
    const hang = Math.min(1, Math.max(0, (topY - 0.04 - y) / (topY - b.min.y - 0.04)));
    if (Math.abs(nx) > 0.5) pos.setX(i, x + Math.sign(nx) * hang * 0.028 * (Math.sin(z * 24 + seed + 2 * Math.sin(z * 7)) * 0.7 + 0.3));
    else if (nz > 0.5) pos.setZ(i, z + hang * 0.03 * (Math.sin(x * 21 + seed * 2 + 2 * Math.sin(x * 6)) * 0.7 + 0.3));
    else if (ny > 0.5) pos.setY(i, y + 0.012 * Math.sin(x * 9 + seed) * Math.sin(z * 7 + seed * 1.7) + 0.006 * Math.sin(x * 23 + z * 17));
  }
  geo.computeVertexNormals();
}

export function bed({ M, w, d }: Ctx, headH: number, opts: { ledge?: boolean; pillows: number }) {
  const g = new THREE.Group();
  const hbT = 0.09, base = 0.33, matTop = 0.6;
  const zHead = -d / 2 + hbT;
  const hbTop = opts.ledge ? headH - 0.025 : headH;
  // headboard: backing panel + raised vertical channels
  g.add(rbox(M.upholsteryDark, -w / 2, w / 2, 0.06, hbTop, -d / 2, zHead, 0.02));
  const n = 9, cw = (w - 0.04) / n;
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + 0.02 + i * cw + 0.004;
    g.add(rbox(M.upholstery, x0, x0 + cw - 0.008, 0.33, hbTop - 0.03, zHead, zHead + 0.03, 0.012, { seg: 3 }));
  }
  if (opts.ledge) {
    g.add(box(M.marble, -w / 2, w / 2, hbTop, headH, -d / 2, zHead + 0.04));
    g.add(emissive(box(M.led2700, -w / 2 + 0.05, w / 2 - 0.05, hbTop - 0.012, hbTop, zHead + 0.025, zHead + 0.035, { shadow: false })));
  }
  // lift-up storage base: recessed black plinth, upholstered box, shadow line where the deck lifts
  g.add(box(M.blackMatte, -w / 2 + 0.05, w / 2 - 0.05, 0, 0.07, zHead + 0.05, d / 2 - 0.05));
  g.add(rbox(M.upholstery, -w / 2, w / 2, 0.07, base, zHead, d / 2, 0.02));
  g.add(box(M.blackMatte, -w / 2 + 0.01, w / 2 - 0.01, 0.285, 0.289, d / 2 - 0.003, d / 2, { shadow: false }));
  for (const s of [-1, 1]) g.add(box(M.blackMatte, s < 0 ? -w / 2 : w / 2 - 0.003, s < 0 ? -w / 2 + 0.003 : w / 2, 0.285, 0.289, zHead + 0.01, d / 2 - 0.01, { shadow: false }));
  const strap = hw(new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 8, 16, Math.PI), M.upholsteryDark.clone()));
  strap.position.set(0, 0.2, d / 2);
  strap.castShadow = true;
  g.add(strap);
  // mattress with a quilted band, then a duvet draping over the sides and foot
  const mw = w - 0.07, mz0 = zHead + 0.01, mz1 = d / 2 - 0.03;
  g.add(rbox(M.linen, -mw / 2, mw / 2, base, matTop, mz0, mz1, 0.05, { seg: 4 }));
  const dz0 = mz0 + (mz1 - mz0) * 0.3, dz1 = mz1;
  const duvetTop = matTop + 0.06;
  const dv = rbox(M.duvet, -mw / 2, mw / 2, matTop - 0.24, duvetTop, dz0, dz1, 0.05, { seg: 13 });
  drape(dv.geometry, duvetTop, opts.pillows);
  g.add(dv);
  // turned-back fold at the head of the duvet
  g.add(rbox(M.duvet, -mw / 2 - 0.005, mw / 2 + 0.005, matTop - 0.15, duvetTop + 0.025, dz0 - 0.04, dz0 + 0.17, 0.06, { seg: 6 }));
  // folded throw across the foot
  const th = rbox(M.throwBlanket, -mw / 2 - 0.02, mw / 2 + 0.02, matTop - 0.26, duvetTop + 0.03, dz1 - 0.55, dz1 - 0.02, 0.03, { seg: 4 });
  g.add(th);
  // pillows: 500 × 750 sleeping pillows leaning on the headboard (kept under the headboard top), and a second, decorative row
  const cols = 2, rows = opts.pillows > 2 ? 2 : 1;
  const pw = Math.min(0.7, (mw - 0.1) / cols - 0.03);
  for (let c = 0; c < cols; c++) for (let k = 0; k < rows; k++) {
    const pH = k ? 0.4 : 0.44, pT = k ? 0.12 : 0.15, ang = k ? 0.3 : 0.5;
    const p = pillow(k ? M.upholsteryDark : M.linen, k ? pw * 0.62 : pw, pH, pT, c * 2 + k);
    const top = (pH / 2) * Math.cos(ang) + (pT / 2) * Math.sin(ang);
    const yc = Math.min(matTop + 0.2 - k * 0.04, headH - top - 0.004);
    p.position.set((c - 0.5) * (pw + 0.04), yc, mz0 + 0.1 + k * 0.17);
    p.rotation.x = -ang;
    g.add(p);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Gaming chair (Secretlab Titan Small proportions, fitted to the 680 × 680 footprint)

export function gamingChair({ M, h, it }: Ctx) {
  const g = new THREE.Group();
  const A = it.id === 'chair-a' ? M.accentRed : M.accentCyan, L = M.leather;
  const rad = m(it.d!) / 2 - 0.03;
  // five-star base with twin-wheel casters
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    const arm = new THREE.Group();
    arm.add(rbox(M.black, 0.02, rad, 0.075, 0.115, -0.026, 0.026, 0.012, { seg: 3 }));
    arm.rotation.y = -a;
    g.add(arm);
    const cx = Math.cos(a) * (rad - 0.01), cz = Math.sin(a) * (rad - 0.01);
    g.add(cyl(M.blackMatte, cx, cz, 0.058, 0.078, 0.011, 0.011, { seg: 8 }));
    const hood = rbox(M.blackMatte, -0.02, 0.02, 0.04, 0.075, -0.03, 0.03, 0.01, { seg: 3 });
    const wheels = new THREE.Group();
    wheels.add(hood);
    for (const s of [-1, 1]) {
      const wh = cyl(M.rubber, 0, 0, -0.008, 0.008, 0.026, 0.026, { seg: 16 });
      wh.rotation.z = Math.PI / 2;
      wh.position.set(s * 0.017, 0.03, 0);
      wheels.add(wh);
    }
    wheels.position.set(cx, 0, cz);
    wheels.rotation.y = -a + Math.PI / 2;
    g.add(wheels);
  }
  // gas lift with a telescoping shroud, tilt mechanism with paddle and knob
  g.add(cyl(M.steel, 0, 0, 0.115, 0.42, 0.025, 0.025, { seg: 20 }));
  g.add(cyl(M.blackMatte, 0, 0, 0.115, 0.2, 0.032, 0.05, { seg: 20 }));
  g.add(cyl(M.blackMatte, 0, 0, 0.2, 0.32, 0.034, 0.034, { seg: 20 }));
  g.add(cyl(M.blackMatte, 0, 0, 0.32, 0.43, 0.042, 0.042, { seg: 20 }));
  const zs = -0.17;                                           // seat rear; keeps the tilted back inside the footprint
  g.add(rbox(M.charcoalBody, -0.14, 0.14, 0.43, 0.49, zs + 0.03, zs + 0.5, 0.02, { seg: 3 }));
  g.add(hw(box(M.black, 0.14, 0.205, 0.45, 0.46, zs + 0.15, zs + 0.2)));
  g.add(hw(cyl(M.black, 0.17, zs + 0.3, 0.42, 0.45, 0.014, 0.014, { seg: 10 })));
  // seat: cushion with raised bolsters and contrast piping
  g.add(rbox(M.charcoalBody, -0.215, 0.215, 0.49, 0.53, zs, zs + 0.44, 0.015, { seg: 3 }));
  g.add(rbox(L, -0.19, 0.19, 0.51, 0.565, zs, zs + 0.44, 0.03, { seg: 4 }));
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -0.265 : 0.19;
    g.add(rbox(A, x0, x0 + 0.075, 0.5, 0.6, zs, zs + 0.44, 0.03, { seg: 4 }));
  }
  g.add(box(M.blackMatte, -0.19, 0.19, 0.545, 0.55, zs + 0.438, zs + 0.44, { shadow: false }));
  // backrest, pivoting at the seat rear, tilted back
  const bk = new THREE.Group();
  const bh = h - 0.555;
  bk.add(rbox(L, -0.2, 0.2, 0.0, bh * 0.72, -0.09, 0, 0.035, { seg: 4 }));          // lumbar / shoulder section
  bk.add(rbox(L, -0.15, 0.15, bh * 0.68, bh, -0.09, 0, 0.04, { seg: 4 }));           // head section
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -0.255 : 0.2;
    bk.add(rbox(A, x0, x0 + 0.055, 0.02, bh * 0.66, -0.09, 0.055, 0.03, { seg: 4 })); // side wings
    bk.add(box(A, s * 0.075 - 0.01, s * 0.075 + 0.01, 0.04, bh - 0.04, -0.001, 0.003, { shadow: false })); // stitch panels
  }
  bk.add(rbox(M.charcoalBody, -0.15, 0.15, 0.02, bh - 0.01, -0.1, -0.09, 0.01, { seg: 2 })); // rear shell
  bk.add(rbox(L, -0.115, 0.115, bh * 0.76, bh * 0.94, 0, 0.065, 0.035, { seg: 4 }));  // headrest pillow
  bk.add(box(A, -0.1, 0.1, bh * 0.84, bh * 0.86, 0.064, 0.067, { shadow: false }));
  bk.add(rbox(L, -0.13, 0.13, 0.1, 0.25, 0, 0.06, 0.035, { seg: 4 }));                // lumbar pillow
  bk.add(box(A, -0.115, 0.115, 0.165, 0.185, 0.059, 0.062, { shadow: false }));
  bk.position.set(0, 0.55, zs - 0.0);
  bk.rotation.x = -0.1;
  g.add(bk);
  // 4D armrests: post, pivot cap and padded top
  for (const s of [-1, 1]) {
    g.add(box(M.black, s * 0.265 - 0.016, s * 0.265 + 0.016, 0.5, 0.67, zs + 0.12, zs + 0.18));
    g.add(rbox(M.blackMatte, s * 0.265 - 0.047, s * 0.265 + 0.047, 0.67, 0.7, zs - 0.03, zs + 0.27, 0.012, { seg: 3 }));
  }
  return g;
}

// ---------------------------------------------------------------------------
// Bottom-freezer fridge in its housing (Panasonic NR-BX style: ~30% freezer drawer)

export function fridge({ M, w, d, h }: Ctx) {
  const g = new THREE.Group();
  const t = 0.018;
  const side = (x0: number, x1: number) => g.add(box(M.cream, x0, x1, 0, h, -d / 2, d / 2, { rot: true }));
  side(-w / 2, -w / 2 + t); side(w / 2 - t, w / 2);
  g.add(box(M.cream, -w / 2, w / 2, h - t, h, -d / 2, d / 2));
  // cupboard over the fridge
  fronts(g, M.cream, -w / 2 + t, w / 2 - t, 1.86, h - t, d / 2 - 0.018, 2, { mat: M.black, kind: 'bottom' });
  g.add(box(M.cream, -w / 2 + t, w / 2 - t, 1.84, 1.86, -d / 2, d / 2));
  // freestanding fridge: body, kick grille, brushed stainless doors with R4 edges and a 4 mm gap
  const fw = w - 2 * t - 0.008, fx0 = -fw / 2, fx1 = fw / 2;
  const zb = d / 2 - 0.07, zf = d / 2 - 0.03, top = 1.83, freezerTop = 0.66;
  g.add(box(M.fridgeSide, fx0, fx1, 0.07, top, -d / 2 + 0.03, zb));
  g.add(box(M.blackMatte, fx0 + 0.01, fx1 - 0.01, 0.01, 0.07, -d / 2 + 0.03, zb + 0.03));
  for (let i = 0; i < 6; i++) g.add(box(M.black, fx0 + 0.03, fx1 - 0.03, 0.02 + i * 0.008, 0.024 + i * 0.008, zb + 0.03, zb + 0.034, { shadow: false })); // louvres
  g.add(rbox(M.steel, fx0, fx1, 0.07, freezerTop - 0.004, zb, zf, 0.004, { seg: 2 }));    // freezer drawer
  g.add(rbox(M.steel, fx0, fx1, freezerTop + 0.004, top, zb, zf, 0.004, { seg: 2 }));     // fridge door
  g.add(box(M.rubber, fx0 + 0.004, fx1 - 0.004, freezerTop - 0.005, freezerTop + 0.005, zb + 0.005, zf - 0.004, { shadow: false })); // gasket in the gap
  // handles: stainless pull bar on the freezer drawer, full-height bar on the fridge door; display panel; hinge cap
  g.add(hw(box(M.steel, fx0 + 0.04, fx1 - 0.04, 0.62, 0.645, zf, zf + 0.03)));
  g.add(hw(cyl(M.steel, fx1 - 0.05, zf + 0.04, 0.9, 1.55, 0.0125, 0.0125, { seg: 12 })));
  for (const y of [0.93, 1.52]) g.add(hw(box(M.steel, fx1 - 0.056, fx1 - 0.044, y, y + 0.012, zf, zf + 0.04)));
  g.add(hw(box(M.screenOff, fx0 + 0.05, fx0 + 0.17, 1.58, 1.63, zf, zf + 0.002, { shadow: false })));
  g.add(hw(emissive(box(M.led4000, fx0 + 0.06, fx0 + 0.08, 1.6, 1.61, zf + 0.002, zf + 0.003, { shadow: false }))));
  g.add(hw(box(M.plastic, fx0 + 0.01, fx0 + 0.07, top, top + 0.012, zb + 0.02, zb + 0.06)));
  return g;
}

// ---------------------------------------------------------------------------
// Top-load washing machine (Samsung WA90-style: slanted rear console, glass lid)

export function washer({ M, w, d, h }: Ctx) {
  const g = new THREE.Group();
  const deckY = 0.91;
  g.add(rbox(M.blackMatte, -w / 2 + 0.015, w / 2 - 0.015, 0, 0.055, -d / 2 + 0.015, d / 2 - 0.015, 0.008, { seg: 2 })); // plinth
  g.add(rbox(M.washerBody, -w / 2, w / 2, 0.05, deckY - 0.01, -d / 2, d / 2, 0.02, { seg: 4 }));                          // cabinet
  g.add(box(M.blackMatte, -w / 2 + 0.01, w / 2 - 0.01, deckY - 0.012, deckY - 0.006, -d / 2 + 0.01, d / 2 - 0.01));        // shadow gap
  g.add(rbox(M.washerDeck, -w / 2, w / 2, deckY - 0.006, deckY, -d / 2, d / 2, 0.006, { seg: 2 }));                         // deck
  // console: a wedge whose front face slopes back, spanning the width at the rear
  const zc = -d / 2, zf = zc + 0.145, top = h;
  const shape = new THREE.Shape();
  shape.moveTo(-zc, deckY); shape.lineTo(-zf, deckY); shape.lineTo(-(zf + 0.03), top); shape.lineTo(-zc, top); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: w - 0.01, bevelEnabled: false });
  geo.translate(0, 0, -(w - 0.01) / 2);
  geo.rotateY(Math.PI / 2);
  g.add(mesh(geo, M.washerDeck, { rot: false }));
  // controls on the sloped face
  const tilt = Math.atan2(0.03, top - deckY);
  const panel = new THREE.Group();
  panel.position.set(0, (deckY + top) / 2, zf + 0.015);
  panel.rotation.x = -tilt;
  g.add(hw(panel));
  panel.add(box(M.screenOff, -0.07, 0.07, -0.014, 0.014, 0.0005, 0.002, { shadow: false }));
  panel.add(emissive(box(M.ledRed, -0.04, 0.04, -0.007, 0.007, 0.0022, 0.0028, { shadow: false })));
  for (let i = 0; i < 6; i++) panel.add(emissive(box(M.ledRed, -0.2 + i * 0.075, -0.2 + i * 0.075 + 0.006, 0.02, 0.026, 0.002, 0.0026, { shadow: false })));
  for (let i = 0; i < 6; i++) { // course buttons
    const b = box(M.plastic, -0.2 + i * 0.075 - 0.02, -0.2 + i * 0.075 + 0.02, -0.0095 - 0.002, 0.0095 - 0.002, 0.0, 0.006, { shadow: false });
    b.position.y -= 0.011;
    panel.add(b);
  }
  for (const s of [-1, 1]) { // power (left) and start/pause (right)
    const b = cyl(s < 0 ? M.plastic : M.blackMatte, 0, 0, 0, 0.007, 0.017, 0.017, { seg: 20, shadow: false });
    b.rotation.x = Math.PI / 2;
    b.position.set(s * 0.255, 0, 0.004);
    panel.add(b);
  }
  // tub opening under the glass lid: steel rim, dark well and pulsator
  const oz = 0.07;
  const well = cyl(M.blackMatte, 0, oz, deckY, deckY + 0.001, 0.172, 0.172, { seg: 40, shadow: false });
  g.add(well);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.007, 8, 40), M.steel);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, deckY + 0.002, oz);
  g.add(rim);
  g.add(cyl(M.steel, 0, oz, deckY + 0.001, deckY + 0.006, 0.075, 0.075, { seg: 32, shadow: false }));
  // lid: black frame around tinted glass, hinged behind, finger notch at the front
  const lx = 0.255, lz0 = zf - 0.01, lz1 = 0.285, ly = deckY, lt = 0.016, f = 0.045;
  g.add(rbox(M.blackMatte, -lx, lx, ly, ly + lt, lz0, lz0 + f, 0.004, { seg: 2 }));
  g.add(rbox(M.blackMatte, -lx, lx, ly, ly + lt, lz1 - f, lz1, 0.004, { seg: 2 }));
  for (const s of [-1, 1]) g.add(rbox(M.blackMatte, s < 0 ? -lx : lx - f, s < 0 ? -lx + f : lx, ly, ly + lt, lz0, lz1, 0.004, { seg: 2 }));
  const glass = box(M.smoked, -lx + f, lx - f, ly + 0.005, ly + 0.007, lz0 + f, lz1 - f, { shadow: false });
  glass.userData.keep = true;
  g.add(glass);
  g.add(box(M.washerDeck, -0.075, 0.075, ly + lt - 0.002, ly + lt + 0.001, lz1 - 0.026, lz1 - 0.006, { shadow: false }));
  // inlet hoses at the back
  for (const x of [-0.18, 0.18]) g.add(hw(cyl(M.rubber, x, -d / 2 - 0.03, 0.45, 0.88, 0.011, 0.011, { seg: 8 })));
  return g;
}

// ---------------------------------------------------------------------------

/** Door/drawer fronts across [x0,x1] × [y0,y1] on the plane z, split into n panels. */
export function fronts(g: THREE.Group, mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z: number, n: number,
  handle?: { mat: THREE.Material; kind: 'top' | 'bottom' | 'vbar' | 'vbar-pair' }) {
  const pw = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * pw + GAP / 2, b = x0 + (i + 1) * pw - GAP / 2;
    g.add(box(mat, a, b, y0 + GAP / 2, y1 - GAP / 2, z, z + 0.018, { rot: true }));
    if (!handle) continue;
    const zz = z + 0.018;
    if (handle.kind === 'top') g.add(hw(box(handle.mat, a + 0.02, b - 0.02, y1 - 0.025, y1 - GAP, zz, zz + 0.012)));
    else if (handle.kind === 'bottom') g.add(hw(box(handle.mat, a + 0.02, b - 0.02, y0 + GAP, y0 + 0.025, zz, zz + 0.012)));
    else {
      // vertical bar near the meeting edge (pairs meet in the middle)
      const right = handle.kind === 'vbar-pair' ? i % 2 === 0 : i < n - 1 || n === 1;
      const hx = right ? b - 0.04 : a + 0.03;
      const hy = Math.min(y1 - 0.05, Math.max(y0 + 0.4, 1.05));
      const len = Math.min(0.3, (y1 - y0) * 0.4);
      g.add(hw(box(handle.mat, hx, hx + 0.012, hy - len / 2, hy + len / 2, zz + 0.006, zz + 0.022)));
      for (const e of [-1, 1]) g.add(hw(box(handle.mat, hx + 0.003, hx + 0.009, hy + e * (len / 2 - 0.02) - 0.004, hy + e * (len / 2 - 0.02) + 0.004, zz, zz + 0.006)));
    }
  }
}

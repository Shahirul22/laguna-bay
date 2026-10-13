// Walls, floors, ceilings, windows and doors, all from layout.mjs.
//
// Walls are emitted face by face rather than as boxes: each vertical face is
// split where it crosses a room boundary and takes the finish of the room it
// faces (paint, bath tile, yard dado, charcoal monitor wall...). That gives
// per-room finishes on shared walls and lets skirting follow painted faces.
import * as THREE from 'three';
import type { Materials } from './materials';
import { box, flat, quad } from './geom';
import {
  CEIL, PLAN, type Door, type Front, type Rect, context, doors, inFootprint, m, roomAt, rooms,
  uncertain, wallFinishes, walls, windows,
} from './plan';

interface Solid { r: Rect; z0: number; z1: number; top?: 'sill' | 'coping' }

const WET = new Set(['bath1', 'bath2', 'yard']);
const SKIRT_H = 80, SKIRT_T = 10;

function solids(): Solid[] {
  const C = PLAN.ceiling;
  const out: Solid[] = [];
  for (const w of walls) out.push({ r: w.r, z0: 0, z1: C });
  for (const u of uncertain) {
    // Q-Y1 default: parapet at 1000 with open air above
    if (u.id === 'yard-open-side') out.push({ r: u.r, z0: 0, z1: 1000, top: 'coping' });
    else out.push({ r: u.r, z0: 0, z1: C });
  }
  for (const w of windows) {
    out.push({ r: w.r, z0: 0, z1: w.sill, top: 'sill' });
    out.push({ r: w.r, z0: w.head, z1: C });
  }
  for (const d of doors) out.push({ r: d.opening, z0: d.h, z1: C });
  // placeholder common corridor outside the foyer
  const [cx0, cy0, cx1, cy1] = context.corridor.r;
  out.push({ r: [cx0 - 150, cy1, cx1 + 150, cy1 + 150], z0: 0, z1: C });
  out.push({ r: [cx0 - 150, cy0 - 150, cx0, cy1], z0: 0, z1: C });
  out.push({ r: [cx1, cy0 - 150, cx1 + 150, cy1], z0: 0, z1: C });
  out.push({ r: [cx0, cy0 - 150, 0, cy0], z0: 0, z1: C });
  out.push({ r: [6420, cy0 - 150, cx1, cy0], z0: 0, z1: C });
  return out;
}

/** Collision rectangles (mm) for everything solid at walking height. */
export function wallColliders(): Rect[] {
  return solids().filter((s) => s.z0 < 1000).map((s) => s.r);
}

const inside = (r: Rect, x: number, y: number) => x > r[0] && x < r[2] && y > r[1] && y < r[3];

type Band = { z0: number; z1: number; finish: string; room?: string };

/** Finish bands for a face point q (just in front of the face) facing room side `side`. */
function finishAt(qx: number, qy: number, roomSide: Front, along: number, z0: number, z1: number): Band[] {
  const room = roomAt(qx, qy);
  if (!room) {
    const [cx0, cy0, cx1, cy1] = context.corridor.r;
    const f = inFootprint(qx, qy) ? 'paint' : qx > cx0 && qx < cx1 && qy > cy0 && qy < cy1 ? 'corridorWall' : 'exterior';
    return [{ z0, z1, finish: f }];
  }
  const rules = wallFinishes.filter((r) => r.room === room.id && (!r.side || r.side === roomSide) &&
    (!r.span || (along > r.span[0] && along < r.span[1])));
  const cuts = new Set([z0, z1]);
  for (const r of rules) for (const z of [r.z0, r.z1]) if (z !== undefined && z > z0 && z < z1) cuts.add(z);
  const zs = [...cuts].sort((a, b) => a - b);
  const bands: Band[] = [];
  for (let i = 0; i < zs.length - 1; i++) {
    const zm = (zs[i] + zs[i + 1]) / 2;
    let f = 'paint';
    for (const r of rules) if (zm > (r.z0 ?? -1) && zm < (r.z1 ?? 1e9)) f = r.finish;
    bands.push({ z0: zs[i], z1: zs[i + 1], finish: f, room: room.id });
  }
  return bands;
}

export function buildArchitecture(M: Materials) {
  const group = new THREE.Group();
  const all = solids();
  const mat = (k: string) => (M as unknown as Record<string, THREE.Material>)[k] ?? M.paint;
  const roomEdgesX = rooms.flatMap((r) => [r.r[0], r.r[2]]);
  const roomEdgesY = rooms.flatMap((r) => [r.r[1], r.r[3]]);
  const ruleSpans = wallFinishes.flatMap((r) => r.span ?? []);
  // faces are also split where another solid starts/ends, so a face only partly
  // buried in a neighbour (e.g. behind a column) keeps its exposed part
  const solidEdgesX = all.flatMap((o) => [o.r[0], o.r[2]]), solidEdgesY = all.flatMap((o) => [o.r[1], o.r[3]]);

  // ---- wall faces ----
  for (const s of all) {
    const [x0, y0, x1, y1] = s.r;
    // [normal dir, fixed coord, span from, span to, axis]
    const faces: [Front, number, number, number, 'x' | 'y'][] = [
      ['N', y0, x0, x1, 'x'], ['S', y1, x0, x1, 'x'], ['W', x0, y0, y1, 'y'], ['E', x1, y0, y1, 'y'],
    ];
    for (const [n, fixed, a0, a1, axis] of faces) {
      const edges = (axis === 'x' ? roomEdgesX.concat(solidEdgesX) : roomEdgesY.concat(solidEdgesY)).concat(ruleSpans).filter((v) => v > a0 && v < a1);
      const cuts = [...new Set([a0, a1, ...edges])].sort((a, b) => a - b);
      const off = n === 'N' || n === 'W' ? -5 : 5;
      const roomSide: Front = ({ N: 'S', S: 'N', W: 'E', E: 'W' } as const)[n];
      for (let i = 0; i < cuts.length - 1; i++) {
        const s0 = cuts[i], s1 = cuts[i + 1], mid = (s0 + s1) / 2;
        const qx = axis === 'x' ? mid : fixed + off, qy = axis === 'x' ? fixed + off : mid;
        // hidden inside another solid?
        if (all.some((o) => o !== s && inside(o.r, qx, qy) && o.z0 <= s.z0 && o.z1 >= s.z1)) continue;
        for (const b of finishAt(qx, qy, roomSide, mid, s.z0, s.z1)) {
          // quad winding: counter-clockwise seen from the outside of the face
          const [ax, az, bx, bz] = axis === 'x'
            ? (n === 'S' ? [s0, fixed, s1, fixed] : [s1, fixed, s0, fixed])
            : (n === 'E' ? [fixed, s1, fixed, s0] : [fixed, s0, fixed, s1]);
          group.add(quad(mat(b.finish), m(ax), m(az), m(bx), m(bz), m(b.z0), m(b.z1)));
          const dry = b.room ? !WET.has(b.room) : inFootprint(qx, qy);
          if (b.z0 === 0 && dry && (b.finish === 'paint' || b.finish === 'charcoal')) {
            const sk = b.finish === 'charcoal' ? M.charcoalBody : M.skirting;
            const e0 = s0 - SKIRT_T, e1 = s1 + SKIRT_T;
            const t0 = fixed, t1 = fixed + (off > 0 ? SKIRT_T : -SKIRT_T);
            group.add(axis === 'x'
              ? box(sk, m(e0), m(e1), 0, m(SKIRT_H), m(Math.min(t0, t1)), m(Math.max(t0, t1)), { shadow: false })
              : box(sk, m(Math.min(t0, t1)), m(Math.max(t0, t1)), 0, m(SKIRT_H), m(e0), m(e1), { shadow: false }));
          }
        }
      }
    }
    if (s.z1 < PLAN.ceiling) group.add(flat(s.top === 'sill' || s.top === 'coping' ? M.sill : M.paint, m(x0), m(y0), m(x1), m(y1), m(s.z1), true));
    if (s.z0 > 0) group.add(flat(M.paint, m(x0), m(y0), m(x1), m(y1), m(s.z0), false));
  }

  // ---- floors & ceilings ----
  const footprint: Rect[] = [[0, 0, PLAN.width, 6990], [0, 6990, 6420, PLAN.depth]];
  for (const r of footprint) {
    group.add(flat(M.floorMain, m(r[0]), m(r[1]), m(r[2]), m(r[3]), 0, true));
    group.add(flat(M.ceiling, m(r[0]), m(r[1]), m(r[2]), m(r[3]), CEIL, false, { layer: 1, shadow: true }));
  }
  const special: Record<string, THREE.Material> = { bath1: M.floorBath, bath2: M.floorBath, yard: M.floorYard, bed3: M.floorVinyl };
  for (const r of rooms) {
    const fm = special[r.id];
    if (fm) group.add(flat(fm, m(r.r[0]), m(r.r[1]), m(r.r[2]), m(r.r[3]), 0.003, true));
  }
  const cr = context.corridor.r;
  group.add(flat(M.floorCorridor, m(cr[0]), m(cr[1]), m(cr[2]), m(cr[3]), 0, true));
  group.add(flat(M.ceiling, m(cr[0]), m(cr[1]), m(cr[2]), m(cr[3]), CEIL, false, { layer: 1, shadow: true }));

  // ---- windows ----
  for (const w of windows) group.add(buildWindow(M, w.r, w.sill, w.head, w.type));

  // ---- door frames + leaves ----
  const doorObjs = doors.map((d) => buildDoor(M, d));
  for (const d of doorObjs) group.add(d.frame);

  return { group, doors: doorObjs };
}

/** Local frame for an opening: X along the wall, Z through it, origin at the rect centre. */
function openingFrame(r: Rect) {
  const along = r[2] - r[0] >= r[3] - r[1] ? 'x' : 'y';
  const g = new THREE.Group();
  g.position.set(m(r[0] + r[2]) / 2, 0, m(r[1] + r[3]) / 2);
  if (along === 'y') g.rotation.y = -Math.PI / 2;
  const L = m(along === 'x' ? r[2] - r[0] : r[3] - r[1]);
  const T = m(along === 'x' ? r[3] - r[1] : r[2] - r[0]);
  return { g, L, T };
}

function buildWindow(M: Materials, r: Rect, sill: number, head: number, type?: string) {
  const { g, L, T } = openingFrame(r);
  const y0 = m(sill), y1 = m(head);
  const F = 0.05, D = 0.07; // frame face width, depth
  const zc = 0; // frame centred in the wall
  const fr = (a: number, b: number, c: number, d: number) => g.add(box(M.alu, a, b, c, d, zc - D / 2, zc + D / 2));
  fr(-L / 2, L / 2, y0, y0 + F); fr(-L / 2, L / 2, y1 - F, y1);
  fr(-L / 2, -L / 2 + F, y0, y1); fr(L / 2 - F, L / 2, y0, y1);
  if (type === 'ventilator') {
    const n = Math.round((y1 - y0 - 2 * F) / 0.1);
    for (let i = 0; i < n; i++) {
      const y = y0 + F + (i + 0.5) * ((y1 - y0 - 2 * F) / n);
      const blade = box(M.frosted, -L / 2 + F, L / 2 - F, y - 0.003, y + 0.003, -0.05, 0.05, { shadow: false });
      blade.rotation.x = -0.6;
      g.add(blade);
    }
    return g;
  }
  // sliding sashes on two tracks; wide openings get 4 panels (2 fixed + 2 sliding)
  const panels = L > 1.8 ? 4 : 2;
  const pw = (L - 2 * F) / panels + 0.03;
  for (let i = 0; i < panels; i++) {
    const x0 = -L / 2 + F + i * ((L - 2 * F) / panels) - (i > 0 ? 0.015 : 0);
    const x1 = Math.min(x0 + pw, L / 2 - F);
    const z = (i % 2 ? 1 : -1) * 0.017;
    const sf = 0.04;
    const sash = (a: number, b: number, c: number, d: number) => g.add(box(M.alu, a, b, c, d, z - 0.015, z + 0.015));
    sash(x0, x1, y0 + F, y0 + F + sf); sash(x0, x1, y1 - F - sf, y1 - F);
    sash(x0, x0 + sf, y0 + F, y1 - F); sash(x1 - sf, x1, y0 + F, y1 - F);
    const glass = box(M.glass, x0 + sf, x1 - sf, y0 + F + sf, y1 - F - sf, z - 0.003, z + 0.003, { shadow: false });
    glass.userData.glass = true;
    g.add(glass);
  }
  return g;
}

export interface DoorObj {
  def: Door; frame: THREE.Group; pivot: THREE.Group;
  angle: number; target: number; // degrees, plan convention
}

function buildDoor(M: Materials, d: Door): DoorObj {
  const { g, L, T } = openingFrame(d.opening);
  const H = m(d.h);
  const main = d.id === 'd-main';
  const trim = main ? M.walnut : M.skirting;
  const lt = 0.02, aw = 0.06, at = 0.012;
  // jamb lining
  g.add(box(trim, -L / 2, -L / 2 + lt, 0, H, -T / 2, T / 2));
  g.add(box(trim, L / 2 - lt, L / 2, 0, H, -T / 2, T / 2));
  g.add(box(trim, -L / 2, L / 2, H - lt, H, -T / 2, T / 2));
  // architraves both faces
  for (const s of [-1, 1]) {
    const z0 = s * T / 2, z1 = s * (T / 2 + at);
    const zA = Math.min(z0, z1), zB = Math.max(z0, z1);
    g.add(box(trim, -L / 2 - aw, -L / 2, 0, H + aw, zA, zB));
    g.add(box(trim, L / 2, L / 2 + aw, 0, H + aw, zA, zB));
    g.add(box(trim, -L / 2 - aw, L / 2 + aw, H, H + aw, zA, zB));
  }
  // leaf: built along +X from the hinge, thickness on the side away from the swing
  const pivot = new THREE.Group();
  pivot.position.set(m(d.hinge[0]), 0, m(d.hinge[1]));
  const zSign = ((d.open - d.closed + 360) % 360) === 90 ? -1 : 1;
  const t = 0.04, leafLen = m(d.leaf);
  const leafMat = main ? M.walnut : M.cream;
  const z0 = zSign > 0 ? 0 : -t, z1 = zSign > 0 ? t : 0;
  const leaf = box(leafMat, 0.005, leafLen, 0.01, H - 0.005, z0, z1, { rot: true });
  leaf.userData.keep = true;
  pivot.add(leaf);
  // lever handles both sides, 1000 high, 65 from the free edge
  for (const s of [-1, 1]) {
    const zf = s > 0 ? z1 : z0;
    const rose = box(M.black, leafLen - 0.075, leafLen - 0.055, 0.99, 1.01, Math.min(zf, zf + s * 0.01), Math.max(zf, zf + s * 0.01));
    const lever = box(M.black, leafLen - 0.19, leafLen - 0.06, 0.995, 1.012, Math.min(zf + s * 0.045, zf + s * 0.06), Math.max(zf + s * 0.045, zf + s * 0.06));
    const neck = box(M.black, leafLen - 0.072, leafLen - 0.058, 0.995, 1.008, Math.min(zf, zf + s * 0.05), Math.max(zf, zf + s * 0.05));
    for (const p of [rose, lever, neck]) { p.userData.keep = true; pivot.add(p); }
  }
  if (main) {
    // peephole + digital lock body on the inside face
    const lock = box(M.black, leafLen - 0.11, leafLen - 0.04, 1.05, 1.4, Math.min(z0, z0 - 0.025), z0);
    lock.userData.keep = true;
    pivot.add(lock);
  }
  const obj: DoorObj = { def: d, frame: g, pivot, angle: d.open, target: d.open };
  setDoorAngle(obj, d.open);
  return obj;
}

export function setDoorAngle(d: DoorObj, deg: number) {
  d.angle = deg;
  d.pivot.rotation.y = -THREE.MathUtils.degToRad(deg);
}

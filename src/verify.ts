// Accuracy check (open the app with ?verify; results print to the console
// and to window.__verify). Compares the built 3D model against layout.mjs:
//  1. every furniture item's real bounding box vs its plan envelope (r × h);
//  2. wall-to-wall clear dimensions in each enclosed room, measured by ray
//     casting against wall finishes only, vs the room rectangle.
import * as THREE from 'three';
import type { Materials } from './materials';
import { acUnits, furniture, m, rooms } from './plan';

type Row = Record<string, string | number>;

export function runVerify(env: Map<string, THREE.Box3>, merged: THREE.Object3D, M: Materials) {
  const mm = (v: number) => Math.round(v * 1000);
  const items: Row[] = [];
  const all = [...furniture.map((f) => ({ id: f.id, r: f.r ?? [f.c![0] - f.d! / 2, f.c![1] - f.d! / 2, f.c![0] + f.d! / 2, f.c![1] + f.d! / 2], z: f.z ?? 0, h: f.h ?? 0 })),
    ...acUnits.map((a) => ({ id: a.id, r: a.r, z: a.z, h: a.h }))];
  for (const f of all) {
    const b = env.get(f.id);
    if (!b) { items.push({ id: f.id, issue: 'not built' }); continue; }
    if (b.isEmpty()) { items.push({ id: f.id, note: 'fitting only (cut-out / hardware)' }); continue; }
    const [x0, y0, x1, y1] = f.r;
    // positive = model sticks out of the plan envelope on that side
    const out = { W: x0 - mm(b.min.x), E: mm(b.max.x) - x1, N: y0 - mm(b.min.z), S: mm(b.max.z) - y1, top: mm(b.max.y) - f.h, bottom: f.z - mm(b.min.y) };
    items.push({ id: f.id, plan: `${x1 - x0}×${y1 - y0}×${f.h}`, model: `${mm(b.max.x - b.min.x)}×${mm(b.max.z - b.min.z)}×${mm(b.max.y)}`, ...out });
  }

  // wall-to-wall: rays at 2450 mm (above furniture, below L-boxes) hitting wall finishes only
  const wallMats = new Set<THREE.Material>([M.paint, M.bathTile, M.yardTile, M.charcoal, M.featureTile, M.exterior]);
  const ray = new THREE.Raycaster();
  ray.layers.enableAll();
  const cast = (x: number, z: number, h: number, dx: number, dz: number) => {
    ray.set(new THREE.Vector3(x, h, z), new THREE.Vector3(dx, 0, dz));
    const hit = ray.intersectObject(merged, true).find((q) => wallMats.has((q.object as THREE.Mesh).material as THREE.Material));
    return hit ? hit.distance : NaN;
  };
  // probe point inside each room (plan mm), probe height, and sides open on the plan
  const probes: Record<string, { p: [number, number]; h?: number; open?: ('W' | 'D')[] }> = {
    bed2: { p: [4800, 2400] }, master: { p: [6900, 2500] }, bed3: { p: [4500, 5700] },
    bath1: { p: [8800, 5800] }, bath2: { p: [7000, 5000] },
    yard: { p: [5600, 8100], h: 0.5 },          // parapet side is open above 1000
    kitchen: { p: [3300, 8800], open: ['D'] },  // mouth is the glass screen
    foyer: { p: [870, 9300], open: ['D'] },     // open to the common corridor
    lobby: { p: [8400, 3800], open: ['D'] },    // open to the master bedroom
  };
  const roomsOut: Row[] = [];
  for (const [id, pr] of Object.entries(probes)) {
    const r = rooms.find((q) => q.id === id)!.r;
    const x = m(pr.p[0]), z = m(pr.p[1]), h = pr.h ?? 2.45;
    const w = mm(cast(x, z, h, -1, 0) + cast(x, z, h, 1, 0)), d = mm(cast(x, z, h, 0, -1) + cast(x, z, h, 0, 1));
    const pw = r[2] - r[0], pd = r[3] - r[1];
    const dOpen = pr.open?.includes('D');
    roomsOut.push({ room: id, plan: `${pw} × ${pd}`, model: `${w} × ${dOpen ? 'open' : d}`, dW: w - pw, dD: dOpen ? '-' : d - pd });
  }
  const result = { items, rooms: roomsOut };
  (window as unknown as { __verify: unknown }).__verify = result;
  console.table(roomsOut);
  console.table(items);
  return result;
}

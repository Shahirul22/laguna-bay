// Geometry helpers. Everything here works in metres, in a local frame with
// Y up. UVs are planar in metres (picked per face by its dominant normal), so
// textures keep their real-world scale on any box.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { type Front, type Rect, m } from './plan';

/** Rewrites UVs as planar metre coordinates (offset = where the geometry sits). */
export function metreUV(geo: THREE.BufferGeometry, offset = new THREE.Vector3(), rotate = false) {
  const pos = geo.getAttribute('position');
  const nor = geo.getAttribute('normal');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + offset.x, y = pos.getY(i) + offset.y, z = pos.getZ(i) + offset.z;
    const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
    let u: number, v: number;
    if (ax >= ay && ax >= az) { u = z; v = y; } else if (ay >= az) { u = x; v = z; } else { u = x; v = y; }
    if (rotate) [u, v] = [v, u];
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

export interface MeshOpts { rot?: boolean; shadow?: boolean; layer?: number }

function finish(mesh: THREE.Mesh, o?: MeshOpts) {
  mesh.castShadow = o?.shadow ?? true;
  mesh.receiveShadow = true;
  if (o?.layer) mesh.layers.set(o.layer);
  return mesh;
}

/** Axis-aligned box from ranges (local metres). */
export function box(mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, o?: MeshOpts) {
  const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  const c = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  metreUV(g, c, o?.rot);
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.copy(c);
  return finish(mesh, o);
}

/** Rounded box from ranges. */
export function rbox(mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, radius: number, o?: MeshOpts & { seg?: number }) {
  const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
  const rad = Math.min(radius, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const g = new RoundedBoxGeometry(w, h, d, o?.seg ?? 3, rad);
  const c = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  metreUV(g, c, o?.rot);
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.copy(c);
  return finish(mesh, o);
}

/** Vertical cylinder standing on y0. */
export function cyl(mat: THREE.Material, x: number, z: number, y0: number, y1: number, rTop: number, rBot = rTop, o?: MeshOpts & { seg?: number }) {
  const g = new THREE.CylinderGeometry(rTop, rBot, y1 - y0, o?.seg ?? 32);
  metreUV(g, new THREE.Vector3(x, (y0 + y1) / 2, z), o?.rot);
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.set(x, (y0 + y1) / 2, z);
  return finish(mesh, o);
}

export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, o?: MeshOpts) {
  if (!geo.getAttribute('uv') || o?.rot !== undefined) metreUV(geo, undefined, o?.rot);
  return finish(new THREE.Mesh(geo, mat), o);
}

/** Vertical quad (wall face) between two plan points, from y0 to y1, facing `normal`. */
export function quad(mat: THREE.Material, ax: number, az: number, bx: number, bz: number, y0: number, y1: number, o?: MeshOpts) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array([ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y1, az]);
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  metreUV(g, undefined, o?.rot);
  return finish(new THREE.Mesh(g, mat), { shadow: true, ...o });
}

/** Horizontal rectangle (floor or ceiling) in world metres. up = normal points +Y. */
export function flat(mat: THREE.Material, x0: number, z0: number, x1: number, z1: number, y: number, up: boolean, o?: MeshOpts) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1]);
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setIndex(up ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  metreUV(g);
  return finish(new THREE.Mesh(g, mat), { shadow: false, ...o });
}

// ---------------------------------------------------------------------------
// Placing plan items: a builder works in a local frame where the item's front
// faces +Z, width runs along X, depth along Z, origin at the footprint centre
// on the floor. place() rotates it so the front points to the plan side.

const FRONT_ROT: Record<Front, number> = { S: 0, N: Math.PI, E: Math.PI / 2, W: -Math.PI / 2 };

export function frame(r: Rect, front: Front = 'S') {
  const wx = m(r[2] - r[0]), wz = m(r[3] - r[1]);
  const sideways = front === 'E' || front === 'W';
  return { w: sideways ? wz : wx, d: sideways ? wx : wz, cx: m(r[0] + r[2]) / 2, cz: m(r[1] + r[3]) / 2 };
}

export function place(obj: THREE.Object3D, r: Rect, front: Front = 'S') {
  const f = frame(r, front);
  obj.position.set(f.cx, 0, f.cz);
  obj.rotation.y = FRONT_ROT[front];
  return obj;
}

// ---------------------------------------------------------------------------

/**
 * Merges static meshes under `root` into one mesh per material, baking world
 * transforms. Keeps draw calls low (hundreds of boxes → a few dozen meshes).
 * Meshes with userData.keep stay separate.
 */
export function mergeStatic(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const buckets = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; shadow: boolean; layer: number }>();
  const remove: THREE.Mesh[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.keep || Array.isArray(mesh.material)) return;
    const mat = mesh.material as THREE.Material;
    const layer = mesh.layers.mask;
    const key = `${mat.uuid}|${mesh.castShadow}|${layer}`;
    let g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    if (!g.getAttribute('uv')) metreUV(g);
    const b = buckets.get(key) ?? { mat, geos: [], shadow: mesh.castShadow, layer };
    b.geos.push(g);
    buckets.set(key, b);
    remove.push(mesh);
  });
  for (const mesh of remove) mesh.removeFromParent();
  const out = new THREE.Group();
  out.name = 'merged';
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos, false);
    if (!merged) continue;
    const mm = new THREE.Mesh(merged, b.mat);
    mm.castShadow = b.shadow;
    mm.receiveShadow = true;
    mm.layers.mask = b.layer;
    out.add(mm);
  }
  return out;
}

// CC0 glTF models (Poly Haven, public/models/<name>/<name>.gltf) for plants
// and small decor. Each one is scaled uniformly to fit its plan envelope and
// stands on y = 0, centred; it loads asynchronously into the returned group.
//
// Dense foliage with alpha-tested leaves is costly to shade under ~30 lights,
// and frustum culling ignores walls, so a model is drawn only while the viewer
// is in a room it can be seen from (cullModels).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const sources = new Map<string, Promise<THREE.Object3D>>();
const pending: Promise<unknown>[] = [];

// rooms that see into each other (open plan, or through a usually-open door)
const OPEN = ['living', 'junction', 'corridor', 'dining', 'entry', 'kitchen', 'foyer'];
const SEEN_FROM: Record<string, string[]> = {
  bed2: ['bed2', 'corridor'], bed3: ['bed3', 'corridor'], bath2: ['bath2', 'corridor'],
  master: ['master', 'lobby'], bath1: ['bath1', 'lobby'], lobby: ['lobby', 'master', 'bath1'], yard: ['yard', 'entry', 'kitchen'],
};
const placed: { o: THREE.Object3D; rooms: Set<string> }[] = [];

/** Shows only the models visible from `room` (all of them when undefined, e.g. plan view). Returns true if anything changed. */
export function cullModels(room: string | undefined) {
  let changed = false;
  for (const { o, rooms } of placed) {
    const v = !room || rooms.has(room);
    if (o.visible !== v) { o.visible = v; changed = true; }
  }
  return changed;
}

export function model(name: string, w: number, d: number, h: number, room?: string) {
  const holder = new THREE.Group();
  holder.name = `model:${name}`;
  if (room) placed.push({ o: holder, rooms: new Set(OPEN.includes(room) ? OPEN : SEEN_FROM[room] ?? [room]) });
  let src = sources.get(name);
  if (!src) {
    src = loader.loadAsync(`${import.meta.env.BASE_URL}models/${name}/${name}.gltf`).then((g) => g.scene);
    sources.set(name, src);
  }
  pending.push(src.then((s) => {
    const o = s.clone(true);
    const b = new THREE.Box3().setFromObject(o);
    const size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    const k = Math.min(w / size.x, d / size.z, h / size.y);
    o.scale.multiplyScalar(k);
    o.position.set(-c.x * k, -b.min.y * k, -c.z * k);
    o.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = mesh.receiveShadow = true;
      // alpha-tested foliage: Lambert shading (no rect-area/specular terms) is ~10× cheaper on layered leaves
      const std = mesh.material as THREE.MeshStandardMaterial;
      if (std.alphaTest > 0) mesh.material = new THREE.MeshLambertMaterial({ map: std.map, normalMap: std.normalMap, alphaTest: std.alphaTest, side: std.side });
    });
    holder.add(o);
  }));
  return holder;
}

/** Resolves once every model requested so far is in the scene. */
export const modelsLoaded = () => Promise.all(pending);

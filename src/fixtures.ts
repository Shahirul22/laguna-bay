// Architectural fixtures from layout.mjs `fixtures`: L-boxes with cove
// light, curtains, blinds, hexagon wall tiles, framed art, backsplash,
// mirrors, shower kit.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { type Materials, artMaterial } from './materials';
import { box, cyl, mesh, place } from './geom';
import { CEIL, type Fixture, type Front, fixtures, m, roomAt } from './plan';

const em = <T extends THREE.Object3D>(o: T) => { o.userData.emissive = true; (o as unknown as THREE.Mesh).castShadow = false; return o; };

/** Ripple-fold curtain stack spanning world X [x0,x1] hung in the plane z. */
function curtain(mat: THREE.Material, x0: number, x1: number, z: number, y0: number, y1: number, amp: number, folds: number) {
  const w = x1 - x0;
  const geo = new THREE.PlaneGeometry(w, y1 - y0, folds * 8, 1);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, Math.sin(((x + w / 2) / w) * folds * Math.PI * 2) * amp);
  }
  geo.computeVertexNormals();
  const c = mesh(geo, mat);
  c.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
  c.userData.keep = mat.transparent; // transparent sheer stays separate for sorting
  return c;
}

const builders: Record<string, (f: Fixture, M: Materials) => THREE.Object3D> = {
  lbox: (f, M) => {
    const g = new THREE.Group();
    const [x0, y0, x1, y1] = f.r!.map(m);
    const z0 = m(f.z!), z1 = m(f.h!);
    g.add(box(M.ceiling, x0, x1, z0, z1, y0, y1, { layer: 1 }));
    // cove: LED line in a shadow gap along the room-facing bottom edge
    const t = 0.012;
    const led = f.rgb ? M.rgbPurple : M.led3000;
    const strip = (a: number, b: number, c: number, d: number) => g.add(em(box(led, a, b, z0 - 0.004, z0, c, d, { layer: 1 })));
    if (f.cove === 'S') strip(x0 + 0.02, x1 - 0.02, y1 - 0.03 - t, y1 - 0.03);
    if (f.cove === 'N') strip(x0 + 0.02, x1 - 0.02, y0 + 0.03, y0 + 0.03 + t);
    if (f.cove === 'E') strip(x1 - 0.03 - t, x1 - 0.03, y0 + 0.02, y1 - 0.02);
    return g;
  },
  curtain: (f, M) => {
    const g = new THREE.Group();
    const [x0, y0, x1, y1] = f.r!.map(m);
    const zb = m(f.z!), zt = m(f.h!);
    const folds = Math.max(4, Math.round((x1 - x0) / 0.075));
    g.add(curtain(M.sheer, x0, x1, y0 + 0.035, zb, zt, 0.03, folds));
    g.add(curtain(M.blackout, x0, x1, y1 - 0.045, zb + 0.005, zt, 0.035, folds));
    return g;
  },
  blind: (f, M) => {
    const g = new THREE.Group();
    const [x0, y0, x1, y1] = f.r!.map(m);
    const zb = m(f.z!), zt = m(f.h!);
    const tube = cyl(M.blind, 0, 0, -(x1 - x0) / 2, (x1 - x0) / 2, 0.025, 0.025, { seg: 20 });
    tube.rotation.z = Math.PI / 2;
    tube.position.set((x0 + x1) / 2, zt - 0.03, (y0 + y1) / 2);
    g.add(tube);
    g.add(box(M.blind, x0 + 0.01, x1 - 0.01, zb, zt - 0.03, y0 + 0.005, y0 + 0.007));
    g.add(box(M.alu, x0 + 0.01, x1 - 0.01, zb - 0.02, zb, y0, y0 + 0.012));
    return g;
  },
  hex: (f, M) => {
    // cluster of 20 mm felt hexagons on the wall; a few are backlit RGB panels
    const g = new THREE.Group();
    const r = f.r!;
    const w = m(r[3] - r[1]), d = m(r[2] - r[0]);
    const y0 = m(f.z!), y1 = m(f.h!);
    const R = 0.1, gap = 0.008;                       // circumradius, joint
    const dx = Math.sqrt(3) * (R + gap / 2), dy = 1.5 * (R + gap / 2);
    const lit = [M.rgbCyan, M.rgbPurple, M.rgbMagenta];
    const rnd = (i: number, j: number) => Math.abs(Math.sin(i * 12.9898 + j * 78.233 + r[1]) * 43758.5453) % 1;
    const cx = 0, cy = (y0 + y1) / 2;
    for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
      const x = cx + i * dx + (j & 1 ? dx / 2 : 0), y = cy + j * dy;
      if (Math.abs(x) + R * 0.87 > w / 2 || y - R < y0 || y + R > y1) continue;
      // organic outline: keep a rounded blob, thinning towards the edges
      const e = Math.hypot(x / (w / 2), (y - cy) / ((y1 - y0) / 2));
      if (e > 0.62 + rnd(i, j) * 0.45) continue;
      const k = rnd(j, i);
      const mat = k < 0.3 ? lit[Math.floor(k * 10) % 3] : k < 0.65 ? M.felt : M.charcoalBody;
      const hexm = mesh(new THREE.CylinderGeometry(R, R, d, 6), mat, { shadow: false });
      hexm.rotation.x = Math.PI / 2; // axis out of the wall, pointy-top
      hexm.position.set(x, y, 0);
      if (k < 0.3) hexm.userData.emissive = true;
      g.add(hexm);
    }
    return place(g, r, f.front as Front);
  },
  art: (f, M) => {
    // framed print: thin black frame, white mount, canvas
    const g = new THREE.Group();
    const r = f.r!;
    const sideways = f.front === 'E' || f.front === 'W';
    const w = m(sideways ? r[3] - r[1] : r[2] - r[0]), d = m(sideways ? r[2] - r[0] : r[3] - r[1]);
    const y0 = m(f.z!), y1 = m(f.h!), fw = 0.02, mount = Math.min(w, y1 - y0) * 0.08;
    g.add(box(M.black, -w / 2, w / 2, y0, y0 + fw, -d / 2, d / 2), box(M.black, -w / 2, w / 2, y1 - fw, y1, -d / 2, d / 2),
      box(M.black, -w / 2, -w / 2 + fw, y0, y1, -d / 2, d / 2), box(M.black, w / 2 - fw, w / 2, y0, y1, -d / 2, d / 2));
    g.add(box(M.plastic, -w / 2 + fw, w / 2 - fw, y0 + fw, y1 - fw, -d / 2, d / 2 - 0.006));
    const pw = w - 2 * (fw + mount), ph = y1 - y0 - 2 * (fw + mount);
    const pic = mesh(new THREE.PlaneGeometry(pw, ph), artMaterial(f.art ?? 'stone', pw / ph), { shadow: false });
    pic.position.set(0, (y0 + y1) / 2, d / 2 - 0.0055);
    g.add(pic);
    return place(g, r, f.front as Front);
  },
  splash: (f, M) => {
    const [x0, y0, x1, y1] = f.r!.map(m);
    return box(M.marble, x0, x1, m(f.z!), m(f.h!), y0, y1, { shadow: false });
  },
  mirror: (f, M) => {
    const g = new THREE.Group();
    const r = f.r!;
    const sideways = f.front === 'E' || f.front === 'W';
    const w = m(sideways ? r[3] - r[1] : r[2] - r[0]), d = m(sideways ? r[2] - r[0] : r[3] - r[1]);
    const y0 = m(f.z!), y1 = m(f.h!);
    if (d > 0.05) g.add(box(M.cream, -w / 2, w / 2, y0, y1, -d / 2, d / 2 - 0.006)); // mirror cabinet body
    g.add(box(M.black, -w / 2, w / 2, y0, y1, d / 2 - 0.006, d / 2 - 0.002, { shadow: false }));
    const mirror = new Reflector(new THREE.PlaneGeometry(w, y1 - y0), {
      textureWidth: 512, textureHeight: Math.round(512 * (y1 - y0) / w), color: 0xb8bcbc, clipBias: 0.003, multisample: 2,
    });
    // Each mirror re-renders the whole scene, and frustum culling ignores walls,
    // so a mirror behind a wall would still cost a full render. Reflect only when
    // the viewer stands in a room the mirror is visible from, and never for the
    // ambient-occlusion pass (scene.overrideMaterial set). The last reflection
    // stays on the mirror otherwise, and it refreshes at half the frame rate.
    const reflect = mirror.onBeforeRender;
    const seen = new Set(f.seenFrom ?? []);
    let tick = 0;
    mirror.onBeforeRender = function (renderer, scene, camera, ...rest) {
      if (scene.overrideMaterial || !(camera as THREE.PerspectiveCamera).isPerspectiveCamera) return;
      const room = roomAt(camera.position.x * 1000, camera.position.z * 1000)?.id;
      if (!room || !seen.has(room)) return;
      if (tick++ % 2) return; // refresh at half the frame rate
      reflect.call(this, renderer, scene, camera, ...rest);
    };
    mirror.position.set(0, (y0 + y1) / 2, d / 2 - 0.001);
    mirror.userData.keep = true;
    g.add(mirror);
    // backlit halo: LED strip set back around the edge
    const z = -d / 2 + 0.004;
    g.add(em(box(M.led3000, -w / 2 - 0.004, w / 2 + 0.004, y0 - 0.004, y0, z, z + 0.01)));
    g.add(em(box(M.led3000, -w / 2 - 0.004, w / 2 + 0.004, y1, y1 + 0.004, z, z + 0.01)));
    return place(g, r, f.front as Front);
  },
  shower: (f, M) => {
    const g = new THREE.Group();
    const [px, py] = f.p!.map(m);
    const a = THREE.MathUtils.degToRad(f.dir!);
    const arm = m(f.arm!), zh = m(f.z!);
    const ux = Math.cos(a), uz = Math.sin(a);
    // arm from the wall + square rain head
    const pipe = cyl(M.black, 0, 0, 0, arm, 0.01, 0.01, { seg: 12 });
    pipe.rotation.z = -Math.PI / 2;
    pipe.position.set(arm / 2, 0, 0);
    const holder = new THREE.Group();
    holder.add(pipe);
    holder.position.set(px, zh + 0.05, py);
    holder.rotation.y = -a;
    g.add(holder);
    const hx = px + ux * arm, hz = py + uz * arm;
    g.add(cyl(M.black, hx, hz, zh + 0.02, zh + 0.05, 0.012, 0.012));
    g.add(box(M.black, hx - 0.125, hx + 0.125, zh, zh + 0.012, hz - 0.125, hz + 0.125));
    // mixer plate + lever, hand shower on a rail
    const mx = px + ux * 0.01, mz = py + uz * 0.01;
    const plate = cyl(M.black, 0, 0, 0, 0.012, 0.075, 0.075, { seg: 32 });
    plate.rotation.z = Math.PI / 2;
    const ph = new THREE.Group();
    ph.add(plate);
    ph.position.set(mx, 1.1, mz);
    ph.rotation.y = -a;
    g.add(ph);
    g.add(box(M.black, mx + ux * 0.01 - 0.008, mx + ux * 0.06 + 0.008, 1.095, 1.105, mz - 0.008 + uz * 0.03, mz + 0.008 + uz * 0.03));
    const ox = -uz * 0.35, oz = ux * 0.35;
    g.add(cyl(M.black, px + ox + ux * 0.03, py + oz + uz * 0.03, 1.0, 1.9, 0.011, 0.011));
    return g;
  },
  trap: (f, M) => {
    const [x, y] = f.c!.map(m), s = m(f.d!) / 2;
    return box(M.steel, x - s, x + s, 0.003, 0.006, y - s, y + s, { shadow: false });
  },
  niche: (f, M) => {
    const g = new THREE.Group();
    const r = f.r!;
    const w = m(r[3] - r[1]), d = m(r[2] - r[0]);
    const y0 = m(f.z!), y1 = m(f.h!), t = 0.02;
    g.add(box(M.featureTile, -w / 2, w / 2, y0, y0 + t, -d / 2, d / 2));
    g.add(box(M.featureTile, -w / 2, w / 2, y1 - t, y1, -d / 2, d / 2));
    g.add(box(M.featureTile, -w / 2, -w / 2 + t, y0, y1, -d / 2, d / 2));
    g.add(box(M.featureTile, w / 2 - t, w / 2, y0, y1, -d / 2, d / 2));
    g.add(box(M.charcoalBody, -w / 2, w / 2, y0, y1, -d / 2, -d / 2 + 0.005));
    g.add(em(box(M.led3000, -w / 2 + t, w / 2 - t, y1 - t - 0.006, y1 - t, -d / 2 + 0.01, d / 2 - 0.01)));
    return place(g, r, f.front as Front);
  },
  exhaust: (f, M) => {
    const g = new THREE.Group();
    const [x, y] = f.c!.map(m), s = m(f.d!) / 2;
    g.add(box(M.plastic, x - s, x + s, CEIL - 0.012, CEIL, y - s, y + s, { layer: 1 }));
    for (let i = 0; i < 6; i++) {
      const yy = y - s + 0.03 + i * ((2 * s - 0.06) / 5);
      g.add(box(M.charcoalBody, x - s + 0.03, x + s - 0.03, CEIL - 0.013, CEIL - 0.012, yy - 0.006, yy + 0.006, { shadow: false, layer: 1 }));
    }
    return g;
  },
};

export function buildFixtures(M: Materials) {
  const group = new THREE.Group();
  for (const f of fixtures) {
    const b = builders[f.kind];
    if (!b) { console.warn('no fixture builder for', f.kind); continue; }
    const o = b(f, M);
    o.name = f.id;
    group.add(o);
  }
  return group;
}

// Light fixtures (layout.mjs `lights`), sun, window light and sky.
// Two modes: 'day' (sun + skylight through the openings, fixtures off) and
// 'evening' (designed fixtures + LED strips on).
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import type { Materials } from './materials';
import { kelvin } from './materials';
import { box, cyl } from './geom';
import { CEIL, PLAN, inFootprint, lights, m, roomAt, uncertain, windows } from './plan';

export type Mode = 'day' | 'evening';

// Artistic scale from lumens to three.js intensity (physically based units,
// tuned so a 450 lm downlight reads as a normally lit room at exposure 1).
const K = 0.012;

function skyTexture(top: string, horizon: string, ground: string) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, top); g.addColorStop(0.47, horizon); g.addColorStop(0.5, horizon); g.addColorStop(0.53, ground); g.addColorStop(1, ground);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildLighting(scene: THREE.Scene, M: Materials) {
  RectAreaLightUniformsLib.init();
  const group = new THREE.Group();
  const fixtures = new THREE.Group(); // fixture meshes (merged by caller)
  const interior: { light: THREE.Light; on: number }[] = [];

  const spot = (x: number, y: number, z: number, lm: number, k: number, angle: number) => {
    const s = new THREE.SpotLight(kelvin(k), 0, 0, angle, 0.85, 2);
    s.position.set(x, y, z);
    s.target.position.set(x, 0, z);
    group.add(s, s.target);
    interior.push({ light: s, on: (lm / (2 * Math.PI * (1 - Math.cos(angle)))) * K * 4 });
  };
  const point = (x: number, y: number, z: number, lm: number, k: number) => {
    const p = new THREE.PointLight(kelvin(k), 0, 0, 2);
    p.position.set(x, y, z);
    group.add(p);
    interior.push({ light: p, on: (lm / (4 * Math.PI)) * K * 4 });
  };
  const led = (k: number) => (k <= 2700 ? M.led2700 : k <= 3000 ? M.led3000 : M.led4000);

  for (const L of lights) {
    const [x, z] = L.p.map(m);
    const y = L.z !== undefined ? m(L.z) : CEIL;
    const k = L.k ?? 3000, lm = L.lm ?? 0;
    switch (L.type) {
      case 'down': {
        const trim = cyl(M.plastic, x, z, CEIL - 0.006, CEIL, 0.05, 0.05, { seg: 24, layer: 1, shadow: false });
        const disc = cyl(led(k), x, z, CEIL - 0.008, CEIL - 0.006, 0.036, 0.036, { seg: 24, layer: 1, shadow: false });
        disc.userData.emissive = true;
        fixtures.add(trim, disc);
        spot(x, CEIL - 0.02, z, lm, k, 0.95);
        break;
      }
      case 'pendant': {
        const len = m(L.len ?? 1200);
        fixtures.add(box(M.black, x - 0.02, x + 0.02, y, y + 0.045, z - len / 2, z + len / 2, { shadow: false }));
        const diff = box(led(k), x - 0.014, x + 0.014, y - 0.002, y, z - len / 2 + 0.01, z + len / 2 - 0.01, { shadow: false });
        diff.userData.emissive = true;
        fixtures.add(diff);
        for (const s of [-1, 1]) fixtures.add(cyl(M.black, x, z + s * len * 0.4, y + 0.045, CEIL, 0.0015, 0.0015, { seg: 4, shadow: false }));
        for (const s of [-1, 0, 1]) spot(x, y - 0.01, z + s * len / 3, lm / 3, k, 1.1);
        break;
      }
      case 'lamp':
        point(x, y, z, lm, k);
        break;
      case 'sconce': {
        const a = THREE.MathUtils.degToRad(L.dir ?? 0);
        const ux = Math.cos(a), uz = Math.sin(a);
        const bx = x + ux * 0.07, bz = z + uz * 0.07;
        fixtures.add(box(M.black, Math.min(x, bx) - 0.01, Math.max(x, bx) + 0.01, y - 0.01, y + 0.01, Math.min(z, bz) - 0.01, Math.max(z, bz) + 0.01));
        const shade = cyl(M.shade, bx + ux * 0.04, bz + uz * 0.04, y - 0.08, y + 0.08, 0.05, 0.05, { seg: 24, shadow: false });
        shade.userData.keep = true;
        group.add(shade);
        point(bx + ux * 0.05, y, bz + uz * 0.05, lm, k);
        break;
      }
      case 'wash': {
        // coloured rect light (RGB cove, screen glow), facing dir and tilted down
        const l = new THREE.RectAreaLight(L.color ?? '#ffffff', 0, m(L.w!), m(L.ht!));
        const a = THREE.MathUtils.degToRad(L.dir ?? 0), t = THREE.MathUtils.degToRad(L.tilt ?? 0);
        l.position.set(x, y, z);
        l.lookAt(x + Math.cos(a) * Math.cos(t), y - Math.sin(t), z + Math.sin(a) * Math.cos(t));
        group.add(l);
        interior.push({ light: l, on: L.nits ?? 1 });
        break;
      }
      case 'oyster': {
        const d = cyl(led(k), x, z, CEIL - 0.06, CEIL, 0.17, 0.17, { seg: 40, layer: 1, shadow: false });
        d.userData.emissive = true;
        fixtures.add(d);
        spot(x, CEIL - 0.07, z, lm, k, 1.35);
        break;
      }
    }
  }

  // ---- daylight ----
  const cx = m(PLAN.width) / 2, cz = m(PLAN.depth) / 2;
  const sun = new THREE.DirectionalLight(kelvin(5600), 0);
  // sun from the window side (north-west), ~47° up, matching the sun in the day panorama
  const SUN = new THREE.Vector3(-5, 13.7, -12);
  sun.position.set(cx + SUN.x, SUN.y, cz + SUN.z);
  sun.target.position.set(cx, 0, cz);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 3;
  group.add(sun, sun.target);

  // skylight through each opening: a rect light on the interior face looking in
  const sky: { light: THREE.RectAreaLight; on: number }[] = [];
  const bounce: { light: THREE.RectAreaLight; on: number }[] = [];
  const skyLight = (x: number, y: number, z: number, w: number, h: number, nx: number, nz: number, nits: number) => {
    const l = new THREE.RectAreaLight(kelvin(7000), 0, w, h);
    l.position.set(x, y, z);
    l.lookAt(x + nx, y, z + nz);
    group.add(l);
    sky.push({ light: l, on: nits });
  };
  for (const w of windows) {
    if (w.type === 'ventilator') continue;
    const [x0, y0, x1, y1] = w.r;
    const alongX = x1 - x0 > y1 - y0;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    // which side is outdoors (outside the footprint, or the semi-outdoor yard)?
    const outside = (x: number, y: number) => !inFootprint(x, y) || roomAt(x, y)?.id === 'yard';
    const [ax, ay, bx, by] = alongX ? [mx, y0 - 20, mx, y1 + 20] : [x0 - 20, my, x1 + 20, my];
    const aOut = outside(ax, ay), bOut = outside(bx, by);
    if (aOut === bOut) continue;
    // light sits on the interior face, pointing away from the outdoor side
    const s = aOut ? 1 : -1;
    const nx = alongX ? 0 : s, nz = alongX ? s : 0;
    const fx = alongX ? mx : aOut ? x1 : x0, fz = alongX ? (aOut ? y1 : y0) : my;
    const viaYard = roomAt(aOut ? ax : bx, aOut ? ay : by)?.id === 'yard';
    skyLight(m(fx) + nx * 0.01, m(w.sill + w.head) / 2, m(fz) + nz * 0.01, m(alongX ? x1 - x0 : y1 - y0), m(w.head - w.sill), nx, nz, viaYard ? 3 : 7);
    // sun bounce: where sunlight through this window lands on the floor, a warm
    // upward-facing area light stands in for the light it reflects (fake GI)
    if (!viaYard && nz > 0) {
      const hc = m(w.sill + w.head) / 2;
      const px = m(mx) - (SUN.x / SUN.y) * hc, pz = m(fz) - (SUN.z / SUN.y) * hc;
      const len = m(w.head - w.sill) * (Math.hypot(SUN.x, SUN.z) / SUN.y);
      const b = new THREE.RectAreaLight(kelvin(4300), 0, m(x1 - x0), len);
      b.position.set(px, 0.05, pz);
      b.rotation.x = Math.PI / 2; // emit straight up
      group.add(b);
      bounce.push({ light: b, on: 1.1 });
    }
  }
  // the yard's open side (above the parapet) and the corridor opening at the foyer
  const yo = uncertain.find((u) => u.id === 'yard-open-side')!.r;
  skyLight(m(yo[0]) - 0.01, 1.9, m(yo[1] + yo[3]) / 2, m(yo[3] - yo[1]), 1.8, -1, 0, 9);
  skyLight(m(110 + 1625) / 2, 1.4, m(PLAN.depth) + 0.01, m(1515), 2.8, 0, -1, 1.5);

  // ---- sky / environment ----
  // Pure-sky CC0 panoramas (Poly Haven) with a generated hazy sea below the
  // horizon, see public/env. Gradients stand in until they load.
  const skies: Record<Mode, THREE.Texture> = {
    day: skyTexture('#5d8fcf', '#d3e2ef', '#6f7d6c'),
    evening: skyTexture('#0b1424', '#33405a', '#151a20'),
  };
  for (const mode of ['day', 'evening'] as Mode[]) {
    new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}env/${mode}.jpg`, (t) => {
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.colorSpace = THREE.SRGBColorSpace;
      skies[mode] = t;
      if (current === mode) scene.background = t;
    });
  }
  // rotate the day panorama so its sun sits where the directional light comes from
  const sunAz = Math.atan2(SUN.z, SUN.x), panoSunAz = THREE.MathUtils.degToRad(33);
  scene.backgroundRotation.set(0, panoSunAz - sunAz, 0);

  const emissive = [M.led2700, M.led3000, M.led4000, M.rgbPurple, M.rgbBlue, M.rgbCyan, M.rgbMagenta];
  const ledOn = new Map(emissive.map((mt) => [mt, mt.color.clone()]));
  let current: Mode = 'day';

  /** Lights that are off are hidden, so the shaders don't evaluate them at all. */
  function setMode(mode: Mode, renderer: THREE.WebGLRenderer, plan = false) {
    current = mode;
    const day = mode === 'day';
    for (const { light, on } of interior) { light.intensity = on; light.visible = !day; }
    for (const { light, on } of sky) { light.intensity = on; light.visible = day; }
    for (const { light, on } of bounce) { light.intensity = on; light.visible = day && !plan; }
    sun.intensity = 3.2;
    sun.visible = day && !plan; // the plan camera hides the ceiling, so the sun would pour in
    scene.background = skies[mode];
    scene.backgroundIntensity = day ? 1.5 : 0.7;
    scene.environmentIntensity = day ? 0.2 : 0.08;
    for (const mt of emissive) mt.color.copy(ledOn.get(mt)!).multiplyScalar(day ? 0.55 : 5);
    M.shade.emissiveIntensity = day ? 0 : 1.6;
    // daylight: Khronos PBR Neutral keeps palette colours and contrast true;
    // evening: ACES rolls warm LED highlights off gently (Neutral turns them orange)
    renderer.toneMapping = day ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = day ? 0.62 : 0.95;
    renderer.shadowMap.needsUpdate = true;
  }

  return { group, fixtures, setMode, sun };
}

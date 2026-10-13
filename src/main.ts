import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createMaterials, setMaxAnisotropy } from './materials';
import { buildArchitecture, setDoorAngle, wallColliders, type DoorObj } from './architecture';
import { buildFurniture } from './furniture';
import { buildFixtures } from './fixtures';
import { buildLighting, type Mode } from './lighting';
import { mergeStatic } from './geom';
import { cullModels, modelsLoaded } from './models';
import { Walker, EYE } from './controls';
import { PlanView, Tape } from './tools';
import { initTouch, isTouch } from './touch';
import { type Rect, furniture, roomAt, viewpoints } from './plan';

THREE.DefaultLoadingManager.onLoad = () => { (window as unknown as { __loaded: boolean }).__loaded = true; };

// ---- renderer / scene ----
const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: q.get('ui') === '0' });
const MAX_RATIO = Math.min(devicePixelRatio, 1.5);
let pixelRatio = MAX_RATIO;
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
// the scene is static: re-render the sun's shadow map only when something moves or the mode changes
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.toneMapping = THREE.NeutralToneMapping; // per mode, see lighting.setMode
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app')!.appendChild(renderer.domElement);
setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.03, 600);
camera.layers.enable(1);

// ---- build the apartment ----
const M = createMaterials();
const arch = buildArchitecture(M);
const furn = buildFurniture(M);
const fix = buildFixtures(M);
const lighting = buildLighting(scene, M);

const statics = new THREE.Group();
statics.add(arch.group, furn.group, fix, lighting.fixtures);
// world-space envelopes of every furniture item, captured before merging (for ?verify)
function bodyBox(o: THREE.Object3D) {
  const b = new THREE.Box3();
  o.updateMatrixWorld(true);
  o.traverse((c) => {
    let skip = false;
    for (let p: THREE.Object3D | null = c; p && p !== o.parent; p = p.parent) if (p.userData.hw || p.userData.decor) skip = true;
    if ((c as THREE.Mesh).isMesh && !skip) b.union(new THREE.Box3().setFromObject(c, true));
  });
  return b;
}
const envelopes = new Map(furn.group.children.filter((o) => o.name).map((o) => [o.name, bodyBox(o)]));
const merged = mergeStatic(statics);
scene.add(statics, merged, lighting.group, furn.dynamic);
for (const d of arch.doors) scene.add(d.pivot);
// CC0 models (plants, vases) arrive asynchronously: re-render the cached sun shadows when they're in
const models = modelsLoaded().then(() => { renderer.shadowMap.needsUpdate = true; });
// ceiling-level meshes live on layer 1; the sun's shadow camera must still see them
lighting.group.traverse((o) => { if ((o as THREE.DirectionalLight).isDirectionalLight) (o as THREE.DirectionalLight).shadow.camera.layers.enableAll(); });

// ---- collision ----
const staticColliders: Rect[] = [
  ...wallColliders(),
  ...furniture
    .filter((f) => !['soft', 'upper'].includes(f.kind) && (f.z ?? 0) < 1000 && (f.h ?? 0) >= 100)
    .map((f): Rect => f.r ?? [f.c![0] - f.d! / 2, f.c![1] - f.d! / 2, f.c![0] + f.d! / 2, f.c![1] + f.d! / 2]),
];
const doorBlocking = (d: DoorObj) => Math.abs(d.angle - d.def.open) > 5 || d.target !== d.def.open;
const colliders = () => [...staticColliders, ...arch.doors.filter(doorBlocking).map((d) => d.def.opening)];

const walker = new Walker(camera, renderer.domElement, colliders);

// ---- post-processing ----
const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, rt);
const renderPass = new RenderPass(scene, camera);
const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1, scale: 1.1, samples: 12 });
gtao.blendIntensity = 0.85;
// soft glow around light sources and bright windows (HDR, before tone mapping)
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.22, 0.45, 1.6);
composer.addPass(renderPass);
composer.addPass(gtao);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---- tools / HUD ----
const labels = document.getElementById('labels')!;
const tape = new Tape(scene, [merged, statics, ...arch.doors.map((d) => d.pivot)], labels);
const plan = new PlanView(scene, labels);
const $ = (id: string) => document.getElementById(id)!;
const overlay = $('overlay');
let mode: Mode = 'day';
let planMode = false;

function setMode(m: Mode) {
  mode = m;
  lighting.setMode(m, renderer, planMode);
  bloom.threshold = m === 'day' ? 2.6 : 1.0;
  bloom.strength = m === 'day' ? 0.15 : 0.22;
}
setMode('day');

function setPlan(on: boolean) {
  planMode = on;
  document.body.classList.toggle('plan', on);
  plan.show(on);
  renderPass.camera = on ? plan.camera : camera;
  gtao.enabled = !on;
  setMode(mode);
  if (on) { walker.look.unlock(); overlay.hidden = true; }
  else overlay.hidden = isTouch || walker.look.isLocked;
}

function status() {
  const parts = [mode === 'day' ? 'Day' : 'Evening', planMode ? 'Plan view' : 'Walk'];
  if (tape.active) parts.push(tape.points.length === 1 ? 'Tape: click second point' : 'Tape: click first point');
  $('status').textContent = isTouch ? parts.join(' · ') : parts.join(' · ') + '   [E door · T tape · P plan · L light · Esc help]';
}

function goto(i: number) {
  const v = viewpoints[i];
  if (!v) return;
  walker.teleport(v.p[0], v.p[1], v.yaw, v.pitch);
}

// room buttons on the help card
const roomsEl = $('rooms');
viewpoints.forEach((v, i) => {
  const b = document.createElement('button');
  b.textContent = `${(i + 1) % 10} · ${v.name}`;
  b.onclick = (e) => { e.stopPropagation(); goto(i); enterWalk(); };
  roomsEl.appendChild(b);
});
/** Desktop captures the mouse; touch has no pointer lock, so it just closes the panel. */
function enterWalk() { if (isTouch) overlay.hidden = true; else walker.look.lock(); }
$('enter').onclick = () => { setPlan(false); enterWalk(); };
walker.look.addEventListener('lock', () => { overlay.hidden = true; });
walker.look.addEventListener('unlock', () => { if (!planMode) overlay.hidden = false; });

function nearestDoor() {
  const [px, py] = walker.planPos;
  let best: DoorObj | undefined, bd = 1700;
  for (const d of arch.doors) {
    const o = d.def.opening;
    const dist = Math.hypot((o[0] + o[2]) / 2 - px, (o[1] + o[3]) / 2 - py);
    if (dist < bd) { bd = dist; best = d; }
  }
  return best;
}

addEventListener('keydown', (e) => {
  if (e.repeat) return;
  switch (e.code) {
    case 'KeyE': {
      const d = nearestDoor();
      if (d) d.target = d.target === d.def.open ? d.def.closed : d.def.open;
      break;
    }
    case 'KeyT': tape.active = !tape.active; if (!tape.active) tape.clear(); break;
    case 'KeyP': setPlan(!planMode); break;
    case 'KeyL': setMode(mode === 'day' ? 'evening' : 'day'); break;
    case 'Escape': if (isTouch && !planMode) overlay.hidden = false; break;
    case 'KeyG': gtao.enabled = !gtao.enabled && !planMode; break;
    default:
      if (/^Digit\d$/.test(e.code)) {
        const n = Number(e.code.slice(5));
        goto(n === 0 ? 9 : n - 1);
        if (planMode) setPlan(false);
      }
  }
  status();
});

// clicks: tape in walk mode (crosshair) and plan mode (cursor); plan pan/zoom/teleport
const ndcOf = (e: MouseEvent) => new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
let down: { x: number; y: number; moved: boolean } | null = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, moved: false };
  if (!planMode && walker.look.isLocked && tape.active && e.button === 0) {
    const p = tape.pick(camera);
    if (p) tape.add(p);
    status();
  }
});
addEventListener('pointermove', (e) => {
  if (!down || !planMode) return;
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) down.moved = true;
  if (down.moved) { plan.pan(e.movementX, e.movementY, innerHeight); plan.resize(innerWidth, innerHeight); }
});
addEventListener('pointerup', (e) => {
  if (planMode && down && !down.moved && tape.active && e.button === 0) {
    const p = tape.pick(plan.camera, ndcOf(e));
    if (p) tape.add(p);
    status();
  }
  down = null;
});
renderer.domElement.addEventListener('dblclick', (e) => {
  if (!planMode) return;
  const p = new THREE.Vector3(ndcOf(e).x, ndcOf(e).y, 0).unproject(plan.camera);
  walker.teleport(p.x * 1000, p.z * 1000);
  setPlan(false);
  status();
});
renderer.domElement.addEventListener('wheel', (e) => {
  if (!planMode) return;
  e.preventDefault();
  plan.zoomAt(ndcOf(e), e.deltaY < 0 ? 1.15 : 1 / 1.15, innerWidth, innerHeight);
}, { passive: false });

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  plan.resize(w, h);
}
addEventListener('resize', resize);
resize();

// ---- start position / URL hooks (?vp=living&mode=evening&plan=1&pitch=-10) ----
const vpIdx = Math.max(0, viewpoints.findIndex((v) => v.id === q.get('vp')));
goto(vpIdx);
if (q.get('at')) { const [x, y, yaw] = q.get('at')!.split(',').map(Number); walker.teleport(x, y, yaw); }
if (q.get('pitch')) camera.rotation.x = THREE.MathUtils.degToRad(Number(q.get('pitch')));
if (q.get('mode') === 'evening') setMode('evening');
if (q.get('plan')) setPlan(true);
if (q.has('verify')) Promise.all([import('./verify'), models]).then(([v]) => {
  // model-only items (plants) were empty when the envelopes were captured
  for (const o of furn.group.children) if (envelopes.get(o.name)?.isEmpty()) envelopes.set(o.name, bodyBox(o));
  v.runVerify(envelopes, merged, M);
});
if (isTouch) {
  $('enter').textContent = 'Tap to walk';
  const hint = document.createElement('table');
  hint.className = 'touch-help';
  hint.innerHTML = '<tr><td>Left stick</td><td>walk (push to the edge to run)</td></tr><tr><td>Drag</td><td>look around</td></tr>' +
    '<tr><td>Door</td><td>open / close the nearest door</td></tr><tr><td>Tape</td><td>measure: tap to mark the dot at the centre of the screen</td></tr>' +
    '<tr><td>Plan</td><td>top-down view (drag to pan, + / − to zoom, double-tap to stand there)</td></tr>';
  $('enter').after(hint);
  initTouch({
    walker, canvas: renderer.domElement, planMode: () => planMode,
    key: (code) => dispatchEvent(new KeyboardEvent('keydown', { code })),
    onTap: () => { if (tape.active) { const p = tape.pick(camera); if (p) tape.add(p); status(); } },
    zoomPlan: (f) => plan.zoomAt(new THREE.Vector2(0, 0), f, innerWidth, innerHeight),
  });
}
if (q.get('ui') === '0') { overlay.hidden = true; $('hud').hidden = true; $('crosshair').hidden = true; }
status();

// ---- performance: GPU name, FPS, adaptive resolution ----
const gl = renderer.getContext();
const dbg = gl.getExtension('WEBGL_debug_renderer_info');
const gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
const integrated = /Intel|UHD|Iris|Radeon\(TM\) Graphics|Vega \d|Microsoft Basic|SwiftShader|llvmpipe/i.test(gpu);
// privacy-focused browsers (Brave Shields, Firefox resistFingerprinting) replace the GPU name with a generic string
const hidden = !/NVIDIA|GeForce|RTX|GTX|Quadro|AMD|Radeon|Intel|Apple|Mali|Adreno|SwiftShader|llvmpipe|Microsoft/i.test(gpu);
const perfEl = $('perf');
perfEl.classList.toggle('warn', integrated);
const gpuNote = integrated ? '\n⚠ integrated/software GPU: set your browser to "High performance" in Windows Graphics settings'
  : hidden ? '\nGPU name hidden by the browser (Brave: lower Shields for this site, or open brave://gpu)' : '';
let fpsFrames = 0, fpsT0 = performance.now(), slowStreak = 0, fastStreak = 0;
function perfTick() {
  fpsFrames++;
  const now = performance.now();
  if (now - fpsT0 < 1000) return;
  const fps = (fpsFrames * 1000) / (now - fpsT0);
  fpsFrames = 0; fpsT0 = now;
  // drop resolution after 2 slow seconds, raise it again after 4 fast ones
  slowStreak = fps < 48 ? slowStreak + 1 : 0;
  fastStreak = fps > 57 ? fastStreak + 1 : 0;
  let next = pixelRatio;
  if (slowStreak >= 2 && pixelRatio > 0.6) { next = Math.max(0.6, pixelRatio - 0.15); slowStreak = 0; }
  if (fastStreak >= 4 && pixelRatio < MAX_RATIO) { next = Math.min(MAX_RATIO, pixelRatio + 0.1); fastStreak = 0; }
  if (next !== pixelRatio) { pixelRatio = next; renderer.setPixelRatio(next); composer.setPixelRatio(next); resize(); }
  perfEl.textContent = `${Math.round(fps)} fps · ${Math.round(pixelRatio * 100)}% res · ${gpu.replace(/^ANGLE \((.*)\)$/, '$1')}${gpuNote}`;
}

// ---- loop ----
const timer = new THREE.Timer();
timer.connect(document);
let frames = 0;
renderer.setAnimationLoop(() => {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  walker.update(dt);
  for (const d of arch.doors) {
    if (d.angle === d.target) continue;
    const step = 160 * dt, diff = d.target - d.angle;
    setDoorAngle(d, Math.abs(diff) <= step ? d.target : d.angle + Math.sign(diff) * step);
    renderer.shadowMap.needsUpdate = true;
  }
  const [px, py] = walker.planPos;
  const here = roomAt(px, py);
  $('room').textContent = here?.name ?? (py > 9800 ? 'Common corridor' : '');
  if (cullModels(planMode ? undefined : here?.id)) renderer.shadowMap.needsUpdate = true;
  if (planMode) plan.update(camera, innerWidth, innerHeight);
  if (tape.active && !planMode && tape.points.length < 2) {
    const p = tape.pick(camera);
    $('readout').textContent = p ? `x ${Math.round(p.x * 1000)}  y ${Math.round(p.z * 1000)}  h ${Math.round(p.y * 1000)}` : '';
  } else $('readout').textContent = tape.text();
  composer.render();
  tape.updateLabel(planMode ? plan.camera : camera, innerWidth, innerHeight);
  perfTick();
  if (++frames === 3) (window as unknown as { __ready: boolean }).__ready = true;
});

Object.assign(window, { __app: { envelopes, walker, camera, setMode, setPlan, goto, scene, renderer, EYE, render: () => { cullModels(planMode ? undefined : roomAt(...walker.planPos)?.id); composer.render(); tape.updateLabel(planMode ? plan.camera : camera, innerWidth, innerHeight); } } });

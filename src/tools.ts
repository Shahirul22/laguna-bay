// Verification tools: tape measure (two clicks → mm) and top-down plan view.
import * as THREE from 'three';
import { CEIL, PLAN, type Rect, m, rooms, walls, uncertain, windows } from './plan';

const PLAN_LAYER = 2;

// ---------------------------------------------------------------------------
// Tape measure

export class Tape {
  active = false;
  points: THREE.Vector3[] = [];
  private group = new THREE.Group();
  private label: HTMLDivElement;
  private ray = new THREE.Raycaster();

  constructor(scene: THREE.Scene, private targets: THREE.Object3D[], labels: HTMLElement) {
    scene.add(this.group);
    this.group.layers.enableAll();
    this.label = document.createElement('div');
    this.label.className = 'label';
    this.label.hidden = true;
    labels.appendChild(this.label);
  }

  /** Surface point under the given NDC for this camera, ignoring glass. */
  pick(camera: THREE.Camera, ndc = new THREE.Vector2()) {
    this.ray.setFromCamera(ndc, camera);
    this.ray.layers.mask = camera.layers.mask;
    const hit = this.ray.intersectObjects(this.targets, true).find((h) => {
      const mat = (h.object as THREE.Mesh).material as THREE.Material;
      return h.object.visible && !mat.transparent;
    });
    return hit?.point;
  }

  add(p: THREE.Vector3) {
    if (this.points.length >= 2) this.clear();
    this.points.push(p.clone());
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffb700', depthTest: false }));
    dot.position.copy(p);
    dot.renderOrder = 999;
    dot.layers.enableAll();
    this.group.add(dot);
    if (this.points.length === 2) {
      const g = new THREE.BufferGeometry().setFromPoints(this.points);
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#ffb700', depthTest: false }));
      line.renderOrder = 999;
      line.layers.enableAll();
      this.group.add(line);
    }
  }

  clear() {
    this.points = [];
    for (const c of [...this.group.children]) {
      c.removeFromParent();
      (c as THREE.Mesh).geometry.dispose();
    }
    this.label.hidden = true;
  }

  /** Readout text: total plus per-axis deltas in plan terms. */
  text() {
    if (this.points.length < 2) return '';
    const [a, b] = this.points;
    const mm = (v: number) => Math.round(v * 1000);
    const d = mm(a.distanceTo(b));
    const dx = mm(Math.abs(b.x - a.x)), dy = mm(Math.abs(b.z - a.z)), dh = mm(Math.abs(b.y - a.y));
    return `${d} mm   (Δx ${dx} · Δy ${dy} · Δh ${dh})`;
  }

  updateLabel(camera: THREE.Camera, w: number, h: number) {
    if (this.points.length < 2) { this.label.hidden = true; return; }
    const mid = this.points[0].clone().add(this.points[1]).multiplyScalar(0.5).project(camera);
    if (mid.z > 1) { this.label.hidden = true; return; }
    this.label.hidden = false;
    this.label.textContent = `${Math.round(this.points[0].distanceTo(this.points[1]) * 1000)} mm`;
    this.label.style.left = `${(mid.x * 0.5 + 0.5) * w}px`;
    this.label.style.top = `${(-mid.y * 0.5 + 0.5) * h}px`;
  }
}

// ---------------------------------------------------------------------------
// Plan view: orthographic camera from above. Ceiling-level items (layer 1)
// are hidden; wall tops are capped with poché on a plan-only layer.

export class PlanView {
  camera: THREE.OrthographicCamera;
  private labels: { el: HTMLDivElement; pos: THREE.Vector3 }[] = [];
  marker: THREE.Mesh;
  private center = new THREE.Vector3(m(PLAN.width) / 2, 0, m(PLAN.depth) / 2 + 0.6);
  private span = 12.5; // metres visible vertically at zoom 1

  constructor(scene: THREE.Scene, labelRoot: HTMLElement) {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
    this.camera.up.set(0, 0, -1);
    this.camera.layers.set(0);
    this.camera.layers.enable(PLAN_LAYER);

    const caps = new THREE.Group();
    const cap = (r: Rect, mat: THREE.Material) => {
      const g = new THREE.PlaneGeometry(m(r[2] - r[0]), m(r[3] - r[1]));
      const mesh = new THREE.Mesh(g, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(m(r[0] + r[2]) / 2, CEIL + 0.01, m(r[1] + r[3]) / 2);
      mesh.layers.set(PLAN_LAYER);
      caps.add(mesh);
    };
    const poche = new THREE.MeshBasicMaterial({ color: '#262626' });
    const glaze = new THREE.MeshBasicMaterial({ color: '#7fc4e6' });
    const vent = new THREE.MeshBasicMaterial({ color: '#9a9a9a' });
    const unsure = new THREE.MeshBasicMaterial({ color: '#c77700' });
    for (const w of walls) cap(w.r, poche);
    for (const u of uncertain) cap(u.r, u.id === 'yard-open-side' ? unsure : poche);
    for (const w of windows) cap(w.r, w.type === 'ventilator' ? vent : glaze);
    scene.add(caps);

    this.marker = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e0563b' }));
    this.marker.layers.set(PLAN_LAYER);
    scene.add(this.marker);

    for (const r of rooms) {
      if (['junction', 'entry'].includes(r.id)) continue;
      const el = document.createElement('div');
      el.className = 'label room';
      el.innerHTML = `${r.name}<small>${r.r[2] - r.r[0]} × ${r.r[3] - r.r[1]}</small>`;
      el.hidden = true;
      labelRoot.appendChild(el);
      this.labels.push({ el, pos: new THREE.Vector3(m(r.r[0] + r.r[2]) / 2, 0, m(r.r[1] + r.r[3]) / 2) });
    }
  }

  resize(w: number, h: number) {
    const a = w / h, s = this.span / 2;
    Object.assign(this.camera, { left: -s * a, right: s * a, top: s, bottom: -s });
    this.camera.position.set(this.center.x, 20, this.center.z);
    this.camera.lookAt(this.center.x, 0, this.center.z);
    this.camera.updateProjectionMatrix();
  }

  zoomAt(ndc: THREE.Vector2, factor: number, w: number, h: number) {
    const before = new THREE.Vector3(ndc.x, ndc.y, 0).unproject(this.camera);
    this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom * factor, 0.6, 12);
    this.camera.updateProjectionMatrix();
    const after = new THREE.Vector3(ndc.x, ndc.y, 0).unproject(this.camera);
    this.center.x += before.x - after.x;
    this.center.z += before.z - after.z;
    this.resize(w, h);
  }

  pan(dxPx: number, dyPx: number, h: number) {
    const k = this.span / this.camera.zoom / h;
    this.center.x -= dxPx * k;
    this.center.z -= dyPx * k;
  }

  show(on: boolean) { for (const l of this.labels) l.el.hidden = !on; this.marker.visible = on; }

  update(player: THREE.Camera, w: number, h: number) {
    const dir = new THREE.Vector3();
    player.getWorldDirection(dir);
    this.marker.position.set(player.position.x, CEIL + 0.05, player.position.z);
    this.marker.rotation.set(0, Math.atan2(-dir.x, -dir.z), 0);
    for (const l of this.labels) {
      const p = l.pos.clone().project(this.camera);
      l.el.style.left = `${(p.x * 0.5 + 0.5) * w}px`;
      l.el.style.top = `${(-p.y * 0.5 + 0.5) * h}px`;
    }
  }
}

// First-person walking: pointer-lock look, WASD, collision against plan
// rectangles (mm). The body is a 200 mm-radius circle; movement is resolved
// per axis so you slide along walls instead of sticking to them.
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { Rect } from './plan';

export const EYE = 1.6;      // m
const RADIUS = 0.2;          // m
const WALK = 1.4, RUN = 2.8; // m/s

export class Walker {
  look: PointerLockControls;
  private keys = new Set<string>();
  private vel = new THREE.Vector2();
  /** Touch devices have no pointer lock: they walk with an on-screen stick (x = right, y = forward, -1..1). */
  touchMode = false;
  stick = new THREE.Vector2();

  constructor(private camera: THREE.PerspectiveCamera, dom: HTMLElement, private colliders: () => Rect[]) {
    this.look = new PointerLockControls(camera, dom);
    this.look.pointerSpeed = 0.8;
    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  /** Plan position in mm. */
  get planPos(): [number, number] { return [this.camera.position.x * 1000, this.camera.position.z * 1000]; }

  hits(x: number, z: number) {
    const X = x * 1000, Z = z * 1000, R = RADIUS * 1000;
    for (const [x0, y0, x1, y1] of this.colliders()) {
      const cx = Math.max(x0, Math.min(X, x1)), cy = Math.max(y0, Math.min(Z, y1));
      if ((X - cx) ** 2 + (Z - cy) ** 2 < R * R) return true;
    }
    return false;
  }

  /** Look by a drag in pixels (touch). */
  lookBy(dx: number, dy: number) {
    const r = this.camera.rotation;
    r.order = 'YXZ';
    r.y -= dx * 0.005;
    r.x = Math.max(-1.45, Math.min(1.45, r.x - dy * 0.005));
  }

  /** Teleport to plan mm, yaw in plan degrees. Nudges out of collisions. */
  teleport(px: number, py: number, yawDeg?: number, pitchDeg = 0) {
    let x = px / 1000, z = py / 1000;
    if (this.hits(x, z)) {
      outer: for (let r = 0.05; r < 1.5; r += 0.05) for (let a = 0; a < 16; a++) {
        const tx = x + Math.cos((a / 16) * Math.PI * 2) * r, tz = z + Math.sin((a / 16) * Math.PI * 2) * r;
        if (!this.hits(tx, tz)) { x = tx; z = tz; break outer; }
      }
    }
    this.camera.position.set(x, EYE, z);
    if (yawDeg !== undefined) {
      // plan yaw θ: direction (cos θ, sin θ) in (X, Z); three.js camera looks down -Z at yaw 0
      const a = THREE.MathUtils.degToRad(yawDeg);
      this.camera.rotation.set(THREE.MathUtils.degToRad(pitchDeg), Math.atan2(-Math.cos(a), -Math.sin(a)), 0, 'YXZ');
    }
    this.vel.set(0, 0);
  }

  update(dt: number) {
    if (!this.look.isLocked && !this.touchMode) return;
    const k = this.keys;
    const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) + this.stick.y;
    const s = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) + this.stick.x;
    const speed = k.has('ShiftLeft') || k.has('ShiftRight') || this.stick.length() > 0.95 ? RUN : WALK;
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    const want = new THREE.Vector2(dir.x * f + right.x * s, dir.z * f + right.z * s);
    if (want.lengthSq() > 0) want.multiplyScalar(speed * Math.min(1, want.length()) / want.length()); // stick pushed part-way walks slower
    // smooth acceleration
    this.vel.lerp(want, 1 - Math.exp(-dt * 12));
    const p = this.camera.position;
    const dx = this.vel.x * dt, dz = this.vel.y * dt;
    if (!this.hits(p.x + dx, p.z)) p.x += dx; else this.vel.x = 0;
    if (!this.hits(p.x, p.z + dz)) p.z += dz; else this.vel.y = 0;
    p.y = EYE;
  }
}

// On-screen controls for touch devices (no keyboard, no pointer lock):
// a walk stick on the left, drag anywhere else to look, and buttons that
// send the same keys as the keyboard. Enabled on `(pointer: coarse)` or ?touch=1.
import type { Walker } from './controls';

export const isTouch = matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).get('touch') === '1';

interface Opts {
  walker: Walker;
  canvas: HTMLElement;
  /** Same entry point as the keyboard handler. */
  key: (code: string) => void;
  planMode: () => boolean;
  /** A tap on the scene (not a drag): marks the crosshair point while the tape is active. */
  onTap: () => void;
  zoomPlan: (factor: number) => void;
}

const BUTTONS: [string, string][] = [['Door', 'KeyE'], ['Light', 'KeyL'], ['Plan', 'KeyP'], ['Tape', 'KeyT']];

export function initTouch(o: Opts) {
  document.body.classList.add('touch');
  o.walker.touchMode = true;
  const el = (cls: string, parent: HTMLElement, text = '') => {
    const d = document.createElement('div');
    d.className = cls; d.textContent = text;
    parent.appendChild(d);
    return d;
  };
  const root = el('touch-ui', document.body);

  // ---- walk stick ----
  const base = el('stick', root), knob = el('knob', base);
  let stickId = -1;
  const R = 55; // px of knob travel
  const move = (e: PointerEvent) => {
    const r = base.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > R) { dx *= R / len; dy *= R / len; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    o.walker.stick.set(dx / R, -dy / R);
  };
  const release = (e: PointerEvent) => {
    if (e.pointerId !== stickId) return;
    stickId = -1;
    knob.style.transform = '';
    o.walker.stick.set(0, 0);
  };
  base.addEventListener('pointerdown', (e) => { stickId = e.pointerId; base.setPointerCapture(e.pointerId); move(e); });
  base.addEventListener('pointermove', (e) => { if (e.pointerId === stickId) move(e); });
  base.addEventListener('pointerup', release);
  base.addEventListener('pointercancel', release);

  // ---- buttons ----
  const bar = el('buttons', root);
  for (const [label, code] of BUTTONS) {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', () => o.key(code));
    bar.appendChild(b);
  }
  const zoom = el('zoom', root);
  for (const [t, f] of [['+', 1.3], ['−', 1 / 1.3]] as const) {
    const b = document.createElement('button');
    b.textContent = t;
    b.addEventListener('click', () => o.zoomPlan(f));
    zoom.appendChild(b);
  }
  const menu = document.createElement('button');
  menu.className = 'menu'; menu.textContent = 'Rooms';
  menu.addEventListener('click', () => o.key('Escape'));
  root.appendChild(menu);

  // ---- look: drag on the scene ----
  let lookId = -1, lx = 0, ly = 0, travelled = 0;
  o.canvas.addEventListener('pointerdown', (e) => {
    if (lookId >= 0 || o.planMode()) return;
    lookId = e.pointerId; lx = e.clientX; ly = e.clientY; travelled = 0;
  });
  o.canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookId) return;
    o.walker.lookBy(e.clientX - lx, e.clientY - ly);
    travelled += Math.hypot(e.clientX - lx, e.clientY - ly);
    lx = e.clientX; ly = e.clientY;
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== lookId) return;
    lookId = -1;
    if (travelled < 8) o.onTap();
  };
  o.canvas.addEventListener('pointerup', end);
  o.canvas.addEventListener('pointercancel', () => { lookId = -1; });
  addEventListener('contextmenu', (e) => e.preventDefault());
}

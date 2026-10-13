// Typed view of the single geometry source (analysis/tools/layout.mjs) plus
// small helpers. Plan units are mm; the 3D world is in metres:
// plan X → world X, plan Y → world Z, height → world Y.
import * as L from '../analysis/tools/layout.mjs';

export type Rect = [number, number, number, number];
export type Front = 'N' | 'S' | 'E' | 'W';

export interface Item {
  id: string; room?: string; label?: string; kind: string; front?: Front;
  r?: Rect; c?: [number, number]; d?: number; z?: number; h?: number;
}
export interface Wall { id: string; r: Rect; note?: string }
export interface Win { id: string; r: Rect; sill: number; head: number; type?: string }
export interface Door { id: string; opening: Rect; hinge: [number, number]; leaf: number; closed: number; open: number; h: number }
export interface Room { id: string; name: string; r: Rect }
export interface Ac { id: string; room: string; hp: number; r: Rect; z: number; h: number; dir: number }
export interface Fixture extends Item { cove?: Front; rgb?: boolean; art?: string; p?: [number, number]; dir?: number; arm?: number; seenFrom?: string[] }
export interface LightDef {
  id: string; room: string; type: string; p: [number, number]; z?: number; k?: number; lm?: number; len?: number; dir?: number;
  w?: number; ht?: number; tilt?: number; color?: string; nits?: number; // 'wash' rect lights
}
export interface Viewpoint { id: string; name: string; p: [number, number]; yaw: number; pitch?: number }
export interface FinishRule { room: string; side?: Front; span?: [number, number]; finish: string; z0?: number; z1?: number }

export const PLAN = L.PLAN;
export const walls = L.walls as Wall[];
export const uncertain = L.uncertain as Wall[];
export const windows = L.windows as Win[];
export const doors = L.doors as Door[];
export const rooms = L.rooms as Room[];
export const furniture = L.furniture as Item[];
export const acUnits = L.acUnits as Ac[];
export const fixtures = L.fixtures as Fixture[];
export const lights = L.lights as LightDef[];
export const viewpoints = L.viewpoints as Viewpoint[];
export const wallFinishes = L.wallFinishes as FinishRule[];
export const context = L.context as { corridor: { r: Rect } };

export const CEIL = PLAN.ceiling / 1000;
export const m = (mm: number) => mm / 1000;

/** Rooms are tested in list order; the first containing rect wins. */
export function roomAt(x: number, y: number): Room | undefined {
  return rooms.find(({ r }) => x > r[0] && x < r[2] && y > r[1] && y < r[3]);
}

/** Inside the unit's L-shaped gross footprint (outer faces). */
export function inFootprint(x: number, y: number) {
  return x >= 0 && y >= 0 && ((x <= PLAN.width && y <= 6990) || (x <= 6420 && y <= PLAN.depth));
}

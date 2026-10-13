// Generates the two review drawings from layout.mjs:
//   ../plan-trace.svg       traced walls/openings overlaid on the original JPG (accuracy check)
//   ../proposed-layout.svg  proposed furniture, AC, clearances
// Run: node analysis/tools/draw-plans.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PLAN, walls, uncertain, windows, doors, rooms, furniture, acUnits, dims } from './layout.mjs';

const out = join(dirname(fileURLToPath(import.meta.url)), '..');
const rad = (d) => (d * Math.PI) / 180;
const rect = ([x0, y0, x1, y1], attrs) =>
  `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" ${attrs}/>`;
const txt = (x, y, s, size, attrs = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="middle" ${attrs}>${s}</text>`;

function doorSvg(d, stroke) {
  const [hx, hy] = d.hinge;
  const p = (a) => [hx + d.leaf * Math.cos(rad(a)), hy + d.leaf * Math.sin(rad(a))];
  const [cx, cy] = p(d.closed);
  const [ox, oy] = p(d.open);
  const sweep = ((d.open - d.closed + 360) % 360) < 180 ? 1 : 0;
  return `<path d="M${hx},${hy} L${ox},${oy}" stroke="${stroke}" stroke-width="30"/>` +
    `<path d="M${cx},${cy} A${d.leaf},${d.leaf} 0 0 ${sweep} ${ox},${oy}" fill="none" stroke="${stroke}" stroke-width="12" stroke-dasharray="40 30"/>`;
}
function swingZone(d) {
  const [hx, hy] = d.hinge;
  const p = (a) => [hx + d.leaf * Math.cos(rad(a)), hy + d.leaf * Math.sin(rad(a))];
  const [cx, cy] = p(d.closed);
  const [ox, oy] = p(d.open);
  const sweep = ((d.open - d.closed + 360) % 360) < 180 ? 1 : 0;
  return `<path d="M${hx},${hy} L${cx},${cy} A${d.leaf},${d.leaf} 0 0 ${sweep} ${ox},${oy} Z" fill="#e0563b" fill-opacity="0.10"/>`;
}

const architecture = (wallFill) => [
  ...walls.map((w) => rect(w.r, `fill="${wallFill}"`)),
  ...windows.map((w) => rect(w.r, w.type === 'ventilator'
    ? `fill="#d6d6d6" stroke="#666" stroke-width="10" stroke-dasharray="30 20"`
    : `fill="#9fd3ec" stroke="#2a7fa8" stroke-width="10"`)),
  ...uncertain.map((u) => rect(u.r, `fill="url(#hatch)" stroke="#c77700" stroke-width="15"`)),
].join('\n');

const defs = `<defs>
  <pattern id="hatch" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="80" height="80" fill="#fff3d6"/><line x1="0" y1="0" x2="0" y2="80" stroke="#c77700" stroke-width="20"/>
  </pattern>
  <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#1d6fb8"/></marker>
  <marker id="tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
    <path d="M5,0 L5,10" stroke="#333" stroke-width="2"/></marker>
</defs>`;

// ---------- 1. trace overlay ----------
{
  const { px, scale } = PLAN;
  const sx = 1 / scale.x, sy = 1 / scale.y;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1536 1871" width="1536" height="1871">
${defs}
<image href="../${PLAN.image}" xlink:href="../${PLAN.image}" x="0" y="0" width="1536" height="1871"/>
<g transform="translate(${px.x0} ${px.y0}) scale(${sx} ${sy})" opacity="0.6">
${architecture('#ff0040')}
${doors.map((d) => doorSvg(d, '#0050ff')).join('\n')}
${rect([0, 0, PLAN.width, PLAN.depth], 'fill="none" stroke="#00b050" stroke-width="20" stroke-dasharray="80 60"')}
</g>
<text x="20" y="40" font-family="sans-serif" font-size="26" fill="#ff0040">Red = traced walls · blue = traced windows/doors · hatched = uncertain · green dash = 9450 × 9800 outer boundary</text>
</svg>`;
  writeFileSync(join(out, 'plan-trace.svg'), svg);
}

// ---------- 2. proposed layout ----------
{
  const colours = {
    built: ['#e9dcc7', '#8a6a45'], loose: ['#f4efe6', '#6b6257'], soft: ['#efe9f5', '#9b8fb0'],
    tech: ['#d9dde3', '#2b2f36'], appliance: ['#e3eef0', '#3f6f78'], upper: ['none', '#8a6a45'],
    wet: ['#ffffff', '#4b6b70'], glass: ['#bfe3f0', '#2a7fa8'], light: ['#fff4c2', '#b08a00'], plant: ['#e3f0dc', '#4f7a3a'],
  };
  const fShape = (f) => {
    const [fill, stroke] = colours[f.kind];
    const dash = f.kind === 'upper' || f.kind === 'soft' ? 'stroke-dasharray="50 35"' : '';
    if (f.c) return `<circle cx="${f.c[0]}" cy="${f.c[1]}" r="${f.d / 2}" fill="${fill}" stroke="${stroke}" stroke-width="14" ${dash}/>`;
    return rect(f.r, `fill="${fill}" stroke="${stroke}" stroke-width="${f.kind === 'upper' ? 12 : 14}" ${dash}`);
  };
  const fLabel = (f) => {
    if (!f.label || f.c) return f.label && f.c ? txt(f.c[0], f.c[1], f.label, 70, 'fill="#555"') : '';
    const [x0, y0, x1, y1] = f.r;
    const vertical = y1 - y0 > (x1 - x0) * 1.6 && x1 - x0 < 700;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return txt(cx, cy, f.label, 75, `fill="#333" ${vertical ? `transform="rotate(-90 ${cx} ${cy})"` : ''}`);
  };
  const acSvg = (a) => {
    const [x0, y0, x1, y1] = a.r;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const L = 900;
    const tx = cx + L * Math.cos(rad(a.dir)), ty = cy + L * Math.sin(rad(a.dir));
    return rect(a.r, 'fill="#cfe5f7" stroke="#1d6fb8" stroke-width="16"') +
      `<line x1="${cx}" y1="${cy}" x2="${tx}" y2="${ty}" stroke="#1d6fb8" stroke-width="22" marker-end="url(#arr)" opacity="0.8"/>` +
      txt(cx + 260 * Math.cos(rad(a.dir)) + 330 * Math.sin(rad(a.dir)), cy + 260 * Math.sin(rad(a.dir)) - 330 * Math.abs(Math.cos(rad(a.dir))) + 0, `AC ${a.hp}hp`, 70, 'fill="#1d6fb8" font-weight="bold"');
  };
  const dimSvg = ([x0, y0, x1, y1, s]) => {
    const h = Math.abs(y1 - y0) < 1;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#c0392b" stroke-width="10" marker-start="url(#tick)" marker-end="url(#tick)"/>` +
      txt(h ? mx : mx + 110, h ? my - 70 : my, s, 70, 'fill="#c0392b" font-weight="bold"');
  };
  const roomLabel = (r) => {
    const [x0, y0, x1, y1] = r.r;
    const cx = (x0 + x1) / 2;
    const pos = { living: [cx, 3330], bed2: [cx + 200, 2420], master: [8700, 2950], bed3: [4300, 6650], dining: [cx, 4560],
      junction: [cx + 400, 3890], corridor: [5200, 3890], kitchen: [3300, 8100], entry: [3300, 7350], foyer: [600, 9500],
      lobby: [8650, 3800], bath2: [6950, 6450], bath1: [8800, 6450], yard: [5500, 7600] }[r.id];
    const w = x1 - x0, d = y1 - y0;
    return txt(pos[0], pos[1], r.name.toUpperCase(), 95, 'fill="#1a1a1a" font-weight="bold" letter-spacing="8"') +
      txt(pos[0], pos[1] + 110, `${w} × ${d}`, 70, 'fill="#666"');
  };
  const W = PLAN.width, D = PLAN.depth;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-700 -700 ${W + 1400} ${D + 1700}" width="${(W + 1400) / 9}" height="${(D + 1700) / 9}" font-family="Helvetica, Arial, sans-serif">
${defs}
<rect x="-700" y="-700" width="${W + 1400}" height="${D + 1700}" fill="#ffffff"/>
${rect([0, 0, 9450, 6990], 'fill="#f7f2ea"')}${rect([0, 6990, 6420, 9800], 'fill="#f7f2ea"')}
${rooms.map((r) => rect(r.r, `fill="${['bath1', 'bath2', 'yard'].includes(r.id) ? '#e4e6e3' : r.id === 'bed3' ? '#e2ddd7' : '#f7f2ea'}"`)).join('\n')}
${doors.map(swingZone).join('\n')}
${furniture.filter((f) => f.kind === 'soft').map(fShape).join('\n')}
${furniture.filter((f) => !['soft', 'upper'].includes(f.kind)).map(fShape).join('\n')}
${furniture.filter((f) => f.kind === 'upper').map(fShape).join('\n')}
${architecture('#2b2b2b')}
${doors.map((d) => doorSvg(d, '#2b2b2b')).join('\n')}
${acUnits.map(acSvg).join('\n')}
${furniture.map(fLabel).join('\n')}
${rooms.map(roomLabel).join('\n')}
${dims.map(dimSvg).join('\n')}
<!-- overall dimensions -->
<line x1="0" y1="-350" x2="${W}" y2="-350" stroke="#333" stroke-width="12" marker-start="url(#tick)" marker-end="url(#tick)"/>
${txt(W / 2, -450, `${W}`, 110, 'fill="#333"')}
<line x1="-350" y1="0" x2="-350" y2="${D}" stroke="#333" stroke-width="12" marker-start="url(#tick)" marker-end="url(#tick)"/>
${txt(-470, D / 2, `${D}`, 110, `fill="#333" transform="rotate(-90 -470 ${D / 2})"`)}
<g transform="translate(0 ${D + 300})" font-size="80" fill="#333">
  <rect x="0" y="0" width="1000" height="60" fill="#333"/><rect x="1000" y="0" width="1000" height="60" fill="#fff" stroke="#333" stroke-width="10"/>
  <text x="0" y="170">0</text><text x="950" y="170">1 m</text><text x="1950" y="170">2 m</text>
  <text x="2600" y="60">Proposed layout v2 · all dims mm · dashed = upper/ceiling-mounted · red fan = door swing · hatched = uncertain on plan</text>
  <text x="2600" y="180">Coordinates: origin = outer top-left corner; furniture positions are proposals, architecture is traced (±20 mm).</text>
</g>
</svg>`;
  writeFileSync(join(out, 'proposed-layout.svg'), svg);
}
console.log('wrote plan-trace.svg, proposed-layout.svg');

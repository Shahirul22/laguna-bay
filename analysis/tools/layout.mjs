// Type A (900 sq ft) — single source of geometry for the analysis drawings
// (and later the 3D model).
//
// Units: millimetres. Origin: outer top-left corner of the plan.
// +X = right on the drawing, +Y = down on the drawing. "North" in the docs
// means the top of the drawing (window facade), not compass north.
//
// Derived from 0804_Floor_Plan_A_Update_v1.jpg by pixel tracing, anchored on
// the two printed dimensions (9450 overall width, 9800 overall depth).
// See ../ROOM_ANALYSIS.md §0 for method and tolerance.

export const PLAN = {
  image: '0804_Floor_Plan_A_Update_v1.jpg',
  // outer faces in image pixels and resulting per-axis scale (mm/px)
  px: { x0: 243, x1: 1431, y0: 351, y1: 1604 },
  scale: { x: 9450 / 1188, y: 9800 / 1253 },
  width: 9450,
  depth: 9800,
  ceiling: 2800, // ASSUMED — not on the plan
};

// [x0, y0, x1, y1]
export const walls = [
  // exterior
  { id: 'ext-top-1', r: [0, 0, 400, 150] },
  { id: 'ext-top-2', r: [2790, 0, 4385, 150] },
  { id: 'ext-top-3', r: [5585, 0, 7015, 150] },
  { id: 'ext-top-4', r: [8215, 0, 9450, 150] },
  { id: 'ext-left', r: [0, 0, 110, 9800] },
  { id: 'ext-right', r: [9340, 0, 9450, 6990] },
  { id: 'ext-bath-bottom-1', r: [6420, 6840, 6880, 6990] },
  { id: 'ext-bath-bottom-2', r: [7475, 6840, 8225, 6990] },
  { id: 'ext-bath-bottom-3', r: [8830, 6840, 9450, 6990] },
  { id: 'ext-bottom', r: [1625, 9645, 6420, 9800] },
  { id: 'yard-corner', r: [6260, 9205, 6420, 9800] },
  // interior
  { id: 'living-bed2', r: [3080, 150, 3220, 3400] },
  { id: 'bed2-bottom', r: [3080, 3245, 5330, 3400] },
  { id: 'bed2-master', r: [6230, 150, 6370, 3400] },
  { id: 'bed2-master-column', r: [6190, 150, 6420, 2020] },
  { id: 'master-bottom', r: [6230, 3245, 7430, 3400] },
  { id: 'master-door-jamb', r: [7270, 4285, 7430, 4530] },
  { id: 'bed3-top-1', r: [3080, 4380, 3380, 4530] },
  { id: 'bed3-top-2', r: [4270, 4380, 6475, 4530] },
  { id: 'bath-top-mid', r: [7270, 4380, 8490, 4530] },
  { id: 'bath-top-right', r: [9285, 4380, 9450, 4530] },
  { id: 'bed3-left', r: [3080, 4380, 3220, 6990] },
  { id: 'bed3-bath2', r: [6190, 4380, 6420, 6990] },
  { id: 'bed3-bottom-1', r: [3080, 6840, 4990, 6990] },
  { id: 'bed3-bottom-2', r: [6180, 6840, 6420, 6990] },
  { id: 'bath-partition', r: [7770, 4530, 7930, 6840] },
  { id: 'foyer-top-1', r: [110, 8610, 265, 8760] },
  { id: 'foyer-top-2', r: [1265, 8610, 1775, 8760] },
  { id: 'foyer-kitchen', r: [1625, 8610, 1775, 9800] },
  { id: 'kitchen-yard-1', r: [4820, 7875, 4980, 8025] },
  { id: 'kitchen-yard-2', r: [4820, 9205, 4980, 9800] },
];

// Elements drawn ambiguously on the plan — modelled, but flagged.
export const uncertain = [
  { id: 'mne-shaft', r: [7930, 5950, 8185, 6840], note: 'M&E / plumbing shaft (white void on plan)' },
  { id: 'grey-nib', r: [7455, 3260, 7855, 3395], note: 'Grey block at end of master wardrobe — column / nib? (Q-M3)' },
  { id: 'yard-open-side', r: [6260, 6990, 6420, 9205], note: 'Drawn as light outline, not solid wall — parapet / grille / open? (Q-Y1)' },
];

// Windows sit in wall gaps. All sliding. Living window is tall/door-like
// (~70% of wall height, per owner); bath openings are louvred ventilators
// with the exhaust fan. Other sills/heads are standard (900/2100).
export const windows = [
  { id: 'w-living', r: [400, 0, 2790, 150], sill: 140, head: 2100, type: 'sliding' },
  { id: 'w-bed2', r: [4385, 0, 5585, 150], sill: 900, head: 2100 },
  { id: 'w-master', r: [7015, 0, 8215, 150], sill: 900, head: 2100 },
  { id: 'w-bath2', r: [6880, 6840, 7475, 6990], sill: 1500, head: 2100, type: 'ventilator' },
  { id: 'w-bath1', r: [8225, 6840, 8830, 6990], sill: 1500, head: 2100, type: 'ventilator' },
  { id: 'w-bed3-yard', r: [4990, 6840, 6180, 6990], sill: 900, head: 2100 },
  { id: 'w-kitchen-yard', r: [4820, 8025, 4980, 9205], sill: 1050, head: 2100 },
];

// hinge = pivot point on the wall face the door swings towards.
// leaf = door leaf width; from/to = leaf angle (deg, SVG convention: 0 = +X, 90 = +Y)
export const doors = [
  { id: 'd-main', opening: [265, 8610, 1265, 8760], hinge: [265, 8610], leaf: 900, closed: 0, open: -90, h: 2100 },
  { id: 'd-bed2', opening: [5330, 3245, 6230, 3400], hinge: [6230, 3245], leaf: 850, closed: 180, open: 270, h: 2100 },
  { id: 'd-master', opening: [7270, 3400, 7430, 4285], hinge: [7430, 4285], leaf: 835, closed: -90, open: 0, h: 2100 },
  { id: 'd-bed3', opening: [3380, 4380, 4270, 4530], hinge: [3380, 4530], leaf: 840, closed: 0, open: 90, h: 2100 },
  { id: 'd-bath2', opening: [6475, 4380, 7270, 4530], hinge: [6475, 4530], leaf: 750, closed: 0, open: 90, h: 2100 },
  { id: 'd-bath1', opening: [8490, 4380, 9285, 4530], hinge: [9285, 4530], leaf: 750, closed: 180, open: 90, h: 2100 },
  { id: 'd-yard', opening: [4820, 6990, 4980, 7875], hinge: [4980, 6990], leaf: 835, closed: 90, open: 0, h: 2100 },
];

export const rooms = [
  { id: 'living', name: 'Living', r: [110, 150, 3080, 3400] },
  { id: 'junction', name: 'Junction', r: [110, 3400, 3080, 4380] },
  { id: 'corridor', name: 'Corridor', r: [3080, 3400, 7270, 4380] },
  { id: 'dining', name: 'Dining', r: [110, 4380, 3080, 6990] },
  { id: 'entry', name: 'Entry / kitchen front', r: [110, 6990, 4820, 7905] },
  { id: 'kitchen', name: 'Kitchen', r: [1775, 7905, 4820, 9645] },
  { id: 'foyer', name: 'Foyer', r: [110, 8760, 1625, 9800] },
  { id: 'bed2', name: 'Bedroom 2', r: [3220, 150, 6230, 3245] },
  { id: 'master', name: 'Master Bedroom', r: [6370, 150, 9340, 3245] },
  { id: 'lobby', name: 'Master lobby', r: [7430, 3245, 9340, 4380] },
  { id: 'bed3', name: 'Bedroom 3 / Gaming', r: [3220, 4530, 6190, 6840] },
  { id: 'bath2', name: 'Bath 2 (common)', r: [6420, 4530, 7770, 6840] },
  { id: 'bath1', name: 'Bath 1 (ensuite)', r: [7930, 4530, 9340, 6840] },
  { id: 'yard', name: 'Yard', r: [4980, 6990, 6260, 9645] },
];

// Proposed furniture / built-ins. h = height (top), z = bottom (for floating items).
// kind drives colour in drawings. front = compass side the item's face/front points to
// (N = -Y / window side, S = +Y, W = -X, E = +X); for beds it is the foot end.
export const furniture = [
  // Foyer
  { id: 'shoe-cabinet', front: 'W', room: 'foyer', label: 'Shoe cab 1000×350', kind: 'built', r: [1275, 8770, 1625, 9770], z: 150, h: 1050 },
  { id: 'grass-mat', front: 'S', room: 'foyer', label: 'Removable grass mat', kind: 'soft', r: [180, 8830, 1215, 9730], h: 20 },

  // Living
  { id: 'tv-wall', front: 'E', room: 'living', label: '', kind: 'built', r: [110, 1080, 140, 3480], h: 2800 }, // grey marble cladding
  { id: 'tv-cabinet', front: 'E', room: 'living', label: 'TV cab 1800×400', kind: 'built', r: [140, 1380, 540, 3180], z: 250, h: 600 },
  { id: 'tv', front: 'E', room: 'living', label: '65" TV', kind: 'tech', r: [145, 1555, 180, 3005], z: 640, h: 1475 },
  { id: 'sofa-3', front: 'W', room: 'living', label: '3-seater 2100×900', kind: 'loose', r: [2150, 1230, 3050, 3330], h: 800 },
  { id: 'sofa-2', front: 'S', room: 'living', label: '2-seater 1500×900', kind: 'loose', r: [650, 330, 2150, 1230], h: 800 },
  { id: 'coffee-table', front: 'S', room: 'living', label: 'Coffee 1100×550', kind: 'loose', r: [1160, 1730, 1710, 2830], h: 400 },
  { id: 'rug', front: 'S', room: 'living', label: '', kind: 'soft', r: [650, 1280, 2350, 3280], h: 10 },
  { id: 'floor-lamp', room: 'living', label: 'Lamp', kind: 'light', c: [330, 620], d: 350, h: 1600 },
  { id: 'plant-living', room: 'living', label: 'Plant', kind: 'plant', c: [2760, 790], d: 620, h: 1350 },

  // Dining
  { id: 'dining-table', front: 'S', room: 'dining', label: 'Table 1800×900', kind: 'loose', r: [860, 4785, 1760, 6585], h: 750 },
  ...[5085, 5685, 6285].flatMap((cy, i) => [
    { id: `chair-w${i}`, front: 'E', room: 'dining', label: '', kind: 'loose', r: [400, cy - 225, 920, cy + 225], h: 820 },
    { id: `chair-e${i}`, front: 'W', room: 'dining', label: '', kind: 'loose', r: [1700, cy - 225, 2220, cy + 225], h: 820 },
  ]),
  { id: 'utility-tall', front: 'E', room: 'dining', label: 'Utility', kind: 'built', r: [110, 6700, 560, 7300], h: 2400 },

  // Kitchen
  { id: 'fridge-housing', front: 'E', room: 'kitchen', label: 'Fridge 700×700', kind: 'appliance', r: [1775, 7905, 2475, 8645], h: 2400 },
  { id: 'counter-left', front: 'E', room: 'kitchen', label: '', kind: 'built', r: [1775, 8645, 2375, 9045], h: 900 },
  { id: 'counter-bottom', front: 'N', room: 'kitchen', label: '', kind: 'built', r: [1775, 9045, 4820, 9645], h: 900 },
  { id: 'counter-sink', front: 'W', room: 'kitchen', label: '', kind: 'built', r: [4220, 7915, 4820, 9045], h: 900 },
  // glass screen closing the kitchen mouth: 2 sliding panels (one drawn open) + fixed panel at sink end
  { id: 'kitchen-glass-fixed', front: 'S', room: 'kitchen', label: '', kind: 'glass', r: [4220, 7880, 4820, 7910], h: 2800 },
  { id: 'kitchen-glass-slide-1', front: 'S', room: 'kitchen', label: '', kind: 'glass', r: [2475, 7880, 3375, 7895], h: 2800 },
  { id: 'kitchen-glass-slide-2', front: 'S', room: 'kitchen', label: '', kind: 'glass', r: [2620, 7895, 3520, 7910], h: 2800 }, // shown part-open: 700 gap at X 3520–4220
  { id: 'hob', front: 'N', room: 'kitchen', label: 'Hob', kind: 'appliance', r: [2920, 9095, 3700, 9605], z: 900, h: 920 },
  { id: 'sink', front: 'W', room: 'kitchen', label: 'Sink', kind: 'appliance', r: [4295, 8015, 4755, 9025], z: 900, h: 905 },
  { id: 'upper-left', front: 'E', room: 'kitchen', label: '', kind: 'upper', r: [1775, 8645, 2125, 9295], z: 1500, h: 2300 },
  { id: 'upper-bottom-1', front: 'N', room: 'kitchen', label: '', kind: 'upper', r: [1775, 9295, 2870, 9645], z: 1500, h: 2300 },
  { id: 'hood', front: 'N', room: 'kitchen', label: '', kind: 'upper', r: [2860, 9145, 3760, 9645], z: 1550, h: 2300 },
  { id: 'upper-bottom-2', front: 'N', room: 'kitchen', label: '', kind: 'upper', r: [3760, 9295, 4820, 9645], z: 1500, h: 2300 },

  // Yard
  { id: 'washer', front: 'N', room: 'yard', label: 'Washer', kind: 'appliance', r: [5000, 9030, 5600, 9630], h: 850 },
  { id: 'yard-cabinet', front: 'N', room: 'yard', label: '', kind: 'upper', r: [4990, 9295, 5900, 9645], z: 1500, h: 2200 },
  { id: 'drying-rack', front: 'S', room: 'yard', label: 'Ceiling drying rack', kind: 'soft', r: [5550, 7950, 6150, 9050], z: 2300, h: 2350 },
  { id: 'floor-trap', room: 'yard', label: 'FT', kind: 'tech', c: [6100, 9495], d: 120, h: 5 },

  // Bedroom 2
  { id: 'bed2-bed', front: 'E', room: 'bed2', label: 'Queen 1600×2050', kind: 'loose', r: [3220, 445, 5270, 2045], h: 1100 },
  { id: 'bed2-side', front: 'S', room: 'bed2', label: '', kind: 'loose', r: [3320, 160, 3720, 440], z: 350, h: 550 },
  { id: 'bed2-wardrobe', front: 'N', room: 'bed2', label: 'Sliding wardrobe 2010×600', kind: 'built', r: [3220, 2645, 5230, 3245], h: 2800 },
  { id: 'plant-bed2', room: 'bed2', label: 'Plant', kind: 'plant', c: [5930, 700], d: 560, h: 680 },

  // Master (v3, owner review 2026-10-04): towers, corner wardrobe and dressing shelf removed.
  // Bed head + floating bedside drawers on the window wall; sliding wardrobe on the plan's
  // own wardrobe position (bottom wall to the grey nib).
  { id: 'master-bed', front: 'S', room: 'master', label: 'King 1900×2000', kind: 'loose', r: [6930, 185, 8830, 2185], h: 1000 },
  { id: 'master-side-w', front: 'S', room: 'master', label: '', kind: 'built', r: [6450, 150, 6900, 550], z: 250, h: 550 },
  { id: 'master-side-e', front: 'S', room: 'master', label: '', kind: 'built', r: [8860, 150, 9310, 550], z: 250, h: 550 },
  { id: 'master-wardrobe', front: 'N', room: 'master', label: 'Sliding wardrobe 1485×560', kind: 'built', r: [6370, 2685, 7855, 3245], h: 2800 },
  { id: 'master-rug', front: 'S', room: 'master', label: '', kind: 'soft', r: [6680, 1100, 9080, 2450], h: 10 },

  // Bedroom 3 / Gaming
  { id: 'desk-a', front: 'W', room: 'bed3', label: 'Desk A 1140×650', kind: 'tech', r: [5540, 4545, 6190, 5685], h: 740 },
  { id: 'desk-b', front: 'W', room: 'bed3', label: 'Desk B 1140×650', kind: 'tech', r: [5540, 5690, 6190, 6830], h: 740 },
  { id: 'chair-a', room: 'bed3', label: '', kind: 'loose', c: [5150, 5115], d: 680, h: 1250 },
  { id: 'chair-b', room: 'bed3', label: '', kind: 'loose', c: [5150, 6260], d: 680, h: 1250 },
  { id: 'pc-a', front: 'W', room: 'bed3', label: 'PC', kind: 'tech', r: [5650, 4580, 6130, 4810], h: 470 },
  { id: 'pc-b', front: 'W', room: 'bed3', label: 'PC', kind: 'tech', r: [5650, 6570, 6130, 6800], h: 470 },
  { id: 'gaming-storage', front: 'E', room: 'bed3', label: 'Storage 2×690', kind: 'built', r: [3220, 5450, 3620, 6840], h: 2400 },
  { id: 'rug-bed3', front: 'E', room: 'bed3', label: '', kind: 'soft', r: [4560, 4640, 5530, 6740], h: 10 },

  // Bath 2 (common)
  { id: 'bath2-vanity', front: 'W', room: 'bath2', label: 'Vanity', kind: 'wet', r: [7320, 4650, 7770, 5250], z: 350, h: 850 },
  { id: 'bath2-wc', front: 'W', room: 'bath2', label: 'WC', kind: 'wet', r: [7070, 5340, 7770, 5740], h: 800 },
  { id: 'bath2-screen', front: 'S', room: 'bath2', label: '', kind: 'glass', r: [6970, 5950, 7770, 5960], h: 2000 },

  // Bath 1 (ensuite)
  { id: 'bath1-vanity', front: 'E', room: 'bath1', label: 'Vanity', kind: 'wet', r: [7930, 4650, 8380, 5250], z: 350, h: 850 },
  { id: 'bath1-wc', front: 'E', room: 'bath1', label: 'WC', kind: 'wet', r: [7930, 5340, 8630, 5740], h: 800 },
  { id: 'bath1-screen', front: 'S', room: 'bath1', label: '', kind: 'glass', r: [8185, 5950, 8790, 5960], h: 2000 },
];

// Air-conditioner indoor units. dir = throw direction (deg, same convention as doors)
export const acUnits = [
  { id: 'ac-living', room: 'living', hp: 2.0, r: [2840, 1780, 3080, 2780], z: 2200, h: 2520, dir: 180 },
  { id: 'ac-bed2', room: 'bed2', hp: 1.0, r: [3220, 795, 3460, 1695], z: 2200, h: 2490, dir: 0 },
  { id: 'ac-master', room: 'master', hp: 1.0, r: [6420, 1247, 6660, 2147], z: 2200, h: 2490, dir: 0 },
  { id: 'ac-bed3', room: 'bed3', hp: 1.0, r: [3375, 4530, 4275, 4770], z: 2200, h: 2490, dir: 90 },
];

// Key clearances to annotate: [x0,y0,x1,y1,label]
export const dims = [
  [540, 2280, 1160, 2280, '620'],     // TV cabinet ↔ coffee table
  [1710, 2280, 2150, 2280, '440'],    // coffee table ↔ sofa
  [2220, 5685, 3080, 5685, '860'],    // dining chairs ↔ bed3 wall (passage)
  [2475, 8450, 4220, 8450, '1745'],   // fridge ↔ sink leg
  [2375, 8900, 4220, 8900, '1845'],   // kitchen aisle
  [4270, 2045, 4270, 2645, '600'],    // bed2 bed ↔ wardrobe
  [6420, 1600, 6930, 1600, '510'],    // master: bed ↔ left wall
  [8830, 1600, 9340, 1600, '510'],    // master: bed ↔ right wall
  [7400, 2185, 7400, 2685, '500'],    // master: bed foot ↔ wardrobe
  [3620, 6260, 4810, 6260, '1190'],   // gaming storage ↔ chair
  [5300, 7875, 5300, 9030, '1155'],   // yard: washer front ↔ door swing
];

// ---------------------------------------------------------------------------
// 3D-only design data (ROOM_ANALYSIS.md lighting/materials sections). The SVG
// drawings ignore these except `lights`.

// Wall-face finishes. A wall face takes the finish of the room it faces
// (default: warm-white paint). side = which wall of the room (N/S/E/W);
// span = [from, to] along the face; z0/z1 = height band. Later rules win.
export const wallFinishes = [
  { room: 'bath1', finish: 'bathTile' },
  { room: 'bath2', finish: 'bathTile' },
  { room: 'yard', finish: 'yardTile', z1: 1500 },
  { room: 'bed3', side: 'E', finish: 'charcoal' },               // monitor wall
  { room: 'bath1', side: 'E', span: [5960, 6840], finish: 'featureTile' }, // ensuite shower back wall
];

// Built-in architectural fixtures. Same rectangle/height conventions as furniture.
export const fixtures = [
  // plaster L-boxes: hide curtain track + 3000 K cove on the room-facing edge
  { id: 'lbox-living', kind: 'lbox', r: [110, 150, 3080, 400], z: 2600, h: 2800, cove: 'S' },
  { id: 'lbox-bed2', kind: 'lbox', r: [3220, 150, 6230, 400], z: 2600, h: 2800, cove: 'S' },
  { id: 'lbox-master', kind: 'lbox', r: [7010, 150, 8420, 400], z: 2600, h: 2800, cove: 'S' },
  { id: 'lbox-bed3-w', kind: 'lbox', r: [3220, 4530, 3470, 6840], z: 2600, h: 2800, cove: 'E', rgb: true },
  { id: 'lbox-bed3-s', kind: 'lbox', r: [3470, 6590, 6190, 6840], z: 2600, h: 2800, cove: 'N', rgb: true },
  // curtain stacks (drawn open): sheer + blackout, ripple-fold, hung from the L-box
  { id: 'curtain-living-w', kind: 'curtain', r: [110, 190, 560, 330], z: 15, h: 2600 },
  { id: 'curtain-living-e', kind: 'curtain', r: [2630, 190, 3080, 330], z: 15, h: 2600 },
  { id: 'curtain-bed2-w', kind: 'curtain', r: [3990, 190, 4440, 330], z: 15, h: 2600 },
  { id: 'curtain-bed2-e', kind: 'curtain', r: [5530, 190, 5980, 330], z: 15, h: 2600 },
  // roller blinds, shown part-down: gaming room (curtains would fall on Desk B) and master
  // (the headboard stands in front of the window)
  { id: 'blind-bed3', kind: 'blind', r: [4990, 6795, 6180, 6835], z: 1650, h: 2600 },
  { id: 'blind-master', kind: 'blind', r: [7020, 155, 8210, 205], z: 1700, h: 2600 },
  // gaming wall: felt hexagon tiles, some backlit (RGB)
  { id: 'hex-a', kind: 'hex', r: [6170, 4650, 6190, 5580], z: 1450, h: 2300, front: 'W' },
  { id: 'hex-b', kind: 'hex', r: [6170, 5790, 6190, 6720], z: 1450, h: 2300, front: 'W' },
  // framed art (procedural canvases); art = picture style
  { id: 'art-living', kind: 'art', art: 'arches', r: [3055, 1830, 3080, 2730], z: 1150, h: 1750, front: 'W' },
  { id: 'art-dining', kind: 'art', art: 'horizon', r: [110, 5185, 135, 6185], z: 1300, h: 2000, front: 'E' },
  { id: 'art-bed2', kind: 'art', art: 'sun', r: [3220, 895, 3245, 1595], z: 1350, h: 1900, front: 'E' },
  { id: 'art-master', kind: 'art', art: 'stone', r: [9315, 900, 9340, 1700], z: 1150, h: 1750, front: 'W' },
  { id: 'art-bed3', kind: 'art', art: 'synthwave', r: [3220, 4720, 3245, 5320], z: 1150, h: 2000, front: 'E' },
  // kitchen backsplash (75×300 cream), counter top to underside of uppers / window sill
  { id: 'splash-back', kind: 'splash', r: [1775, 9635, 4820, 9645], z: 900, h: 1500 },
  { id: 'splash-left', kind: 'splash', r: [1775, 8645, 1785, 9635], z: 900, h: 1500 },
  { id: 'splash-right-1', kind: 'splash', r: [4810, 7915, 4820, 8025], z: 900, h: 1500 },
  { id: 'splash-right-2', kind: 'splash', r: [4810, 8025, 4820, 9205], z: 900, h: 1050 },
  { id: 'splash-right-3', kind: 'splash', r: [4810, 9205, 4820, 9635], z: 900, h: 1500 },
  // mirrors (backlit, 3000 K). seenFrom = rooms a viewer can see the mirror from
  // (its reflection is only re-rendered when the viewer is in one of them)
  { id: 'mirror-bath2', kind: 'mirror', r: [7650, 4700, 7770, 5200], z: 1100, h: 1800, front: 'W', seenFrom: ['bath2', 'corridor'] },
  { id: 'mirror-bath1', kind: 'mirror', r: [7930, 4700, 8050, 5200], z: 1100, h: 1800, front: 'E', seenFrom: ['bath1', 'lobby'] },
  // showers: wall point p, arm direction dir (deg), rain head at z
  { id: 'shower-bath2', kind: 'shower', p: [7770, 6400], dir: 180, arm: 350, z: 2150 },
  { id: 'shower-bath1', kind: 'shower', p: [9340, 6400], dir: 180, arm: 350, z: 2150 },
  { id: 'trap-bath2', kind: 'trap', c: [7100, 6400], d: 150 },
  { id: 'trap-bath1', kind: 'trap', c: [8760, 6400], d: 150 },
  { id: 'niche-bath1', kind: 'niche', r: [9300, 6150, 9340, 6650], z: 1250, h: 1550, front: 'W' },
  { id: 'fan-bath2', kind: 'exhaust', c: [7180, 6600], d: 250 },
  { id: 'fan-bath1', kind: 'exhaust', c: [8530, 6600], d: 250 },
];

// Light fixtures. p = plan position; z = light-emitting height (default: ceiling).
// k = colour temperature (K); lm = output; type drives the 3D fixture model.
export const lights = [
  { id: 'l-foyer', room: 'foyer', type: 'down', p: [870, 9280], k: 2700, lm: 500 },
  { id: 'l-entry', room: 'entry', type: 'down', p: [765, 8150], k: 3000, lm: 500 },
  { id: 'l-living-1', room: 'living', type: 'down', p: [900, 1350], k: 4000, lm: 450 },
  { id: 'l-living-2', room: 'living', type: 'down', p: [2250, 1350], k: 4000, lm: 450 },
  { id: 'l-living-3', room: 'living', type: 'down', p: [900, 2700], k: 4000, lm: 450 },
  { id: 'l-living-4', room: 'living', type: 'down', p: [2250, 2700], k: 4000, lm: 450 },
  { id: 'l-lamp', room: 'living', type: 'lamp', p: [330, 620], z: 1450, k: 2700, lm: 400 },
  { id: 'l-dining', room: 'dining', type: 'pendant', p: [1310, 5685], z: 1500, len: 1200, k: 3000, lm: 1200 },
  { id: 'l-corr-1', room: 'junction', type: 'down', p: [1600, 3890], k: 3000, lm: 450 },
  { id: 'l-corr-2', room: 'corridor', type: 'down', p: [3900, 3890], k: 3000, lm: 450 },
  { id: 'l-corr-3', room: 'corridor', type: 'down', p: [6200, 3890], k: 3000, lm: 450 },
  { id: 'l-kitchen-1', room: 'kitchen', type: 'down', p: [2750, 8450], k: 4000, lm: 600 },
  { id: 'l-kitchen-2', room: 'kitchen', type: 'down', p: [3500, 8450], k: 4000, lm: 600 },
  { id: 'l-kitchen-3', room: 'kitchen', type: 'down', p: [4520, 8500], k: 4000, lm: 600 },
  { id: 'l-yard', room: 'yard', type: 'oyster', p: [5600, 7450], k: 4000, lm: 1200 },
  { id: 'l-bed2-1', room: 'bed2', type: 'down', p: [4250, 2345], k: 3000, lm: 450 },
  { id: 'l-bed2-2', room: 'bed2', type: 'down', p: [5750, 1300], k: 3000, lm: 450 },
  { id: 'l-bed2-sconce', room: 'bed2', type: 'sconce', p: [3220, 2250], z: 1250, dir: 0, k: 2700, lm: 250 },
  { id: 'l-master-1', room: 'master', type: 'down', p: [7150, 2450], k: 3000, lm: 450 },
  { id: 'l-master-2', room: 'master', type: 'down', p: [8600, 2450], k: 3000, lm: 450 },
  { id: 'l-master-sconce-w', room: 'master', type: 'sconce', p: [6675, 150], z: 1250, dir: 90, k: 2700, lm: 250 },
  { id: 'l-master-sconce-e', room: 'master', type: 'sconce', p: [9085, 150], z: 1250, dir: 90, k: 2700, lm: 250 },
  { id: 'l-lobby', room: 'lobby', type: 'down', p: [8400, 3800], k: 3000, lm: 400 }, // not in analysis; added so the lobby isn't dark
  { id: 'l-bath2-1', room: 'bath2', type: 'down', p: [7050, 5000], k: 4000, lm: 500 },
  { id: 'l-bath2-2', room: 'bath2', type: 'down', p: [7100, 6400], k: 4000, lm: 500 },
  { id: 'l-bath1-1', room: 'bath1', type: 'down', p: [8650, 5000], k: 4000, lm: 500 },
  { id: 'l-bath1-2', room: 'bath1', type: 'down', p: [8760, 6400], k: 4000, lm: 500 },
  { id: 'l-bed3-1', room: 'bed3', type: 'down', p: [4380, 5100], k: 3000, lm: 220 },
  { id: 'l-bed3-2', room: 'bed3', type: 'down', p: [4380, 6250], k: 3000, lm: 220 },
  // gaming scene: RGB cove wash from the L-boxes and the glow of the screens (rect lights:
  // w = length, ht = height, dir = facing, tilt = degrees down, nits = luminance)
  { id: 'l-bed3-cove-w', room: 'bed3', type: 'wash', p: [3445, 5685], z: 2585, w: 2270, ht: 40, dir: 0, tilt: 55, color: '#7c4dff', nits: 60 },
  { id: 'l-bed3-cove-s', room: 'bed3', type: 'wash', p: [4830, 6615], z: 2585, w: 2680, ht: 40, dir: -90, tilt: 55, color: '#3d7bff', nits: 60 },
  { id: 'l-bed3-screen-a', room: 'bed3', type: 'wash', p: [5700, 5115], z: 1150, w: 900, ht: 350, dir: 180, tilt: 0, color: '#9fc3ff', nits: 6 },
  { id: 'l-bed3-screen-b', room: 'bed3', type: 'wash', p: [5700, 6260], z: 1150, w: 900, ht: 350, dir: 180, tilt: 0, color: '#9fc3ff', nits: 6 },
];

// Start positions for the walkthrough (number keys). yaw = look direction (deg, door convention);
// pitch = look up (+) / down (-) in degrees.
export const viewpoints = [
  { id: 'foyer', name: 'Foyer', p: [870, 9450], yaw: -90, pitch: -4 },
  { id: 'living', name: 'Living', p: [2700, 4000], yaw: -120, pitch: -8 },
  { id: 'dining', name: 'Dining', p: [2650, 4700], yaw: 120, pitch: -8 },
  { id: 'kitchen', name: 'Kitchen', p: [3900, 7400], yaw: 115, pitch: -18 },
  { id: 'master', name: 'Master Bedroom', p: [9085, 2900], yaw: -118, pitch: -8 },
  { id: 'bath1', name: 'Master Bath', p: [8700, 4700], yaw: 105, pitch: -22 },
  { id: 'bed2', name: 'Bedroom 2', p: [5950, 1450], yaw: 178, pitch: -12 },
  { id: 'bed3', name: 'Bedroom 3 / Gaming', p: [3700, 4900], yaw: 35, pitch: -10 },
  { id: 'yard', name: 'Yard', p: [5450, 7300], yaw: 95, pitch: -15 },
  { id: 'bath2', name: 'Common Bath', p: [6750, 4750], yaw: 75, pitch: -22 },
]

// Placeholder surroundings (not on the plan): the common corridor the foyer opens onto.
export const context = {
  corridor: { r: [-1200, 9800, 7000, 11600] },
};

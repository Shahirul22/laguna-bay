# Type A (900 sq ft): Room Analysis v3

> **v3 changes (after your review of the 3D walkthrough, 2026-10-04):**
> - **Master reworked (§5):** towers, corner wardrobe and dressing shelf removed. The bed head and two floating bedside drawers now stand on the window wall; a 1485 sliding wardrobe takes the plan's own wardrobe position on the bottom wall.
> - **Less wood:** grey marble (sintered-stone look) replaces the oak/walnut on the TV wall, coffee and dining tables, kitchen base units and worktop, backsplash, vanities and bedside tops. Oak stays on the dining chairs only; walnut on the main door.
> - **Gaming room (§8)** styled as a gaming room: black desks, racing chairs, RGB cove, hexagon light panels, RGB PCs, dark rug. Vinyl lightened.
> - **Decor:** plants, vases and framed art (no effect on clearances).
> - **Real-product detail (v3.1):** sofas, beds with bedding, gaming chairs, fridge and a **top-load washer** (980 tall) rebuilt from real product proportions; floors, tiles, cabinets and steel re-textured from scans.

> **v2 changes (after your review on 2026-10-04):**
> - **Master wardrobe enlarged** from 1510 to **2110 hanging width**, now more than Bedroom 2's 2010 (see §5).
> - **Windows settled (Q-G2):** the living window is tall and door-like; the other windows are standard sliding; the bathroom openings are louvred ventilators with the exhaust fan.
> - **AC compressors are outside and not modelled (Q-G3).**
> - **Floors (Q-G4):** 2-ft (600×600) tiles laid over the existing floor everywhere except Bedroom 3's vinyl.
> - **Kitchen glass screen added (Q-L4)**, shown partly open.

**Companion drawings in this folder**

| File | What it shows |
|---|---|
| [plan-trace.svg](plan-trace.svg) | My traced walls, doors and windows laid over your original JPG. Use it to check that the measurements match the plan. |
| [proposed-layout.svg](proposed-layout.svg) | The proposed furniture, AC units, door swings and key clearances, all drawn to scale. |
| [tools/layout.mjs](tools/layout.mjs) | The single source of every coordinate below. The 3D model will be built from the same file. |

Regenerate the drawings with `node analysis/tools/draw-plans.mjs`.

All dimensions are in **millimetres**. Coordinates run from the **outer top-left corner** of the plan: X increases to the right and Y increases downward. In this document "north" means the top of the drawing (the window side), not compass north.

---

## 0. Survey: how the measurements were derived

**Method.** I traced every wall, door and window pixel by pixel from `0804_Floor_Plan_A_Update_v1.jpg`. The scale is anchored on the plan's own two dimensions.

| Anchor | Pixels (outer face to outer face) | Scale |
|---|---|---|
| 9450 overall width | 1188 px | 7.955 mm/px |
| 9800 overall depth | 1253 px | 7.821 mm/px |

The drawing is about 1.7% narrower in X than in Y. A single uniform scale would get one of the printed dimensions wrong by about 160 mm. I therefore scaled each axis separately, which honours both printed dimensions exactly.

**Validation.** Standard-size items drawn on the plan come out at their real sizes:

| Item | Measured | Industry standard |
|---|---|---|
| Kitchen counter depth (X axis and Y axis) | 595 / 595 | 600 |
| Washing machine | 595 × 625 | 600 × 600 |
| Bedroom doors (X axis / Y axis) | 890–900 / 885 | 900 |
| Bathroom doors | 795 | 800 |
| Bedroom windows | 1195–1200 | 1200 |
| Bedroom 3 bed symbol | 1510 × 1915 | Queen 1524 × 1905 |
| Gross area (outer faces, minus the notch at bottom right) | 84.10 m² = **905 sq ft** | 900 sq ft stated |

Both axes produce standard sizes, which confirms that per-axis scaling is the right call.

**Tolerance.**

| What | Tolerance | Why |
|---|---|---|
| Wall face positions | ±20 mm | About 2 px |
| Wall thickness | ±40 mm | Brochure line weights are stylised: exterior walls draw at 110 mm on the sides and 150 mm top and bottom |

Furniture dimensions in this document are real product sizes, not traced values.

**Not on the plan, so assumed** (flagged in [§11](#11-decisions-i-need-from-you)):

| Item | Assumed value |
|---|---|
| Ceiling height | **2800** |
| Door height | 2100 |
| Living window | **Sliding, tall and door-like (owner):** about 70% of wall height. Modelled 1960 tall, sill 140, head 2100. |
| Other windows | **Sliding, standard (owner):** modelled sill 900, head 2100 |
| Bathroom openings | **Louvred ventilators with the exhaust fan (owner):** modelled 1500–2100, no glass |
| Kitchen-to-yard window sill | 1050 |
| Beams and drops | None |

### Facts the plan reveals that change the design

1. **The foyer is outside the main door.** The main door (1000 opening, swinging into the house) sits on the line between the foyer and the living area. The foyer's bottom edge has no wall; it opens to the common corridor. The shoe cabinet therefore stands in a semi-public recess.
2. **Bedroom 3's only window opens into the yard**, not to outside air.
3. **The yard's right-hand side is drawn as a light outline, not a solid wall** (X 6260–6420, 2215 long). It is probably a parapet, grille or open side for drying.
4. **There is a ~1180 window between the kitchen and the yard**, directly above the sink.
5. **The master bedroom is L-shaped.** A 1910 × 980 lobby holds the room's entry door and the door to Bath 1. That makes Bath 1 the ensuite and Bath 2 the common bathroom.
6. **Bath 1 contains a plumbing shaft** (white void, about 255 × 890) in its bottom-left corner.
7. **There is a grey block at the end of the master wardrobe** (about 400 × 135). It is drawn neither as wall nor as furniture.
8. **The living room is only 2970 wide.** The whole western strip (living, junction, dining and entry) is a 2970-wide band 8460 long.
9. **The kitchen is open on the plan.** It is a U shape with no wall separating it from dining or entry.

### Room schedule (clear interior, wall face to wall face)

| Room | X range | Y range | Size | Area |
|---|---|---|---|---|
| Living (to end of Bedroom 2 wall) | 110–3080 | 150–3400 | 2970 × 3250 | 9.65 m² |
| Junction (living / corridor / dining) | 110–3080 | 3400–4380 | 2970 × 980 | 2.91 m² |
| Corridor | 3220–7270 | 3400–4380 | 4050 × 980 | 3.96 m² |
| Dining zone | 110–3080 | 4380–6990 | 2970 × 2610 | 7.75 m² |
| Entry / kitchen front | 110–4820 | 6990–7905 | 4710 × 915 | (circulation) |
| Kitchen (U) | 1775–4820 | 7905–9645 | 3045 × 1740 | 5.30 m² |
| Foyer (outside main door) | 110–1625 | 8760–9800 | 1515 × 1040 | 1.57 m² |
| Bedroom 2 | 3220–6230 | 150–3245 | 3010 × 3095 | 9.31 m² |
| Master (main) | 6370–9340 | 150–3245 | 2970 × 3095 | 9.19 m² |
| Master lobby | 7430–9340 | 3245–4380 | 1910 × 1135 | 2.17 m² |
| Bedroom 3 / Gaming | 3220–6190 | 4530–6840 | 2970 × 2310 | 6.86 m² |
| Bath 2 (common) | 6420–7770 | 4530–6840 | 1350 × 2310 | 3.12 m² |
| Bath 1 (ensuite) | 7930–9340 | 4530–6840 | 1410 × 2310 | 3.26 m² (3.03 m² excluding shaft) |
| Yard | 4980–6260 | 6990–9645 | 1280 × 2655 | 3.40 m² |

### Openings

| Opening | Position | Clear width | Swing |
|---|---|---|---|
| Main door | X 265–1265 @ Y 8610 | 1000 | Into the living area, hinge on the left; opens flat against the left wall |
| Bedroom 2 door | X 5330–6230 @ Y 3245 | 900 | Into the room, hinge on the right |
| Bedroom 3 door | X 3380–4270 @ Y 4380 | 890 | Into the room, hinge on the left |
| Master door | Y 3400–4285 @ X 7270 | 885 | Into the lobby, hinge at the bottom |
| Bath 2 door | X 6475–7270 @ Y 4380 | 795 | Into the bath, hinge on the left |
| Bath 1 door | X 8490–9285 @ Y 4380 | 795 | Into the bath, hinge on the right |
| Yard door | Y 6990–7875 @ X 4820 | 885 | Into the yard, hinge at the top |
| Living window | X 400–2790 (top wall) | 2395 | Sliding, tall (1960) |
| Bedroom 2 window | X 4385–5585 (top wall) | 1200 | |
| Master window | X 7015–8215 (top wall) | 1200 | |
| Bedroom 3 window (into yard) | X 4990–6180 | 1190 | |
| Bath 2 ventilator | X 6880–7475 | 595 | Louvres + exhaust fan |
| Bath 1 ventilator | X 8225–8830 | 605 | Louvres + exhaust fan |
| Kitchen-to-yard window | Y 8025–9205 | 1180 | |

**Every door swings into its room, so the corridor is never blocked.**

---

## 1. House-wide decisions

### Clearance rules I checked against

| Situation | Target | Absolute minimum |
|---|---|---|
| Main walkway | 900 | 750 |
| Secondary path | 600 | |
| Bed side access | 600 | 550 |
| In front of sliding wardrobe | 600 | |
| In front of hinged wardrobe | Door width + standing room | |
| Dining chair to wall (seated) | 750 | |
| Passing behind a seated diner | 900 comfortable | 700 squeeze |
| Kitchen aisle | 1200 | 1000 |
| In front of WC | 600 | |
| Shower entry | 500 | |
| In front of washer (loading) | 900 | |
| Coffee table to sofa | 400–450 | |

### Material palette

The same palette runs through the whole house. The hex values are what the 3D model will use.

| Token | Material | Hex | Where |
|---|---|---|---|
| Floor (main) | **600×600 (2 ft)** matte porcelain, warm greige, 2 mm light grout, laid over the existing tiles | `#E3DCD1` | Living, dining, kitchen, corridor, foyer, Bedroom 2, master |
| Walls | Matte emulsion, warm white | `#F2EEE7` | Default |
| Ceiling | Flat white | `#F7F6F2` | |
| Grey marble (light) | Polished marble / sintered stone, grey veins | `#D3D1CD` | Kitchen worktop and backsplash, vanity tops, coffee and dining tables, bedside tops, Bedroom 2 headboard ledge |
| Grey marble (mid) | Same stone, darker | `#9E9C98` | TV wall cladding, kitchen base units, vanity fronts, shoe cabinet |
| Light wood | Natural oak | `#C9A57B` | Dining chairs only |
| Dark wood | Walnut | `#5B4433` | Main door |
| Cream | Matte cabinet finish | `#ECE5D8` | Kitchen upper units, wardrobes |
| Greige accent | Paint or fabric | `#CFC6B8` | Feature walls, shower feature tile |
| Upholstery | Oatmeal performance fabric | `#D9CFC0` | Sofas, headboards |
| Charcoal | | `#2E2E2E` | TV frame, gaming accent wall |
| Black metal | Matte | `#1B1B1B` | Handles, lamp frames, desk and table legs, shower profiles |
| Greige | Matte cabinet finish | `#CFC6B8` | TV console, bedside drawers |
| Bathroom floor | 600×600 R10 matte porcelain, charcoal grey, overlay | `#5C5D5B` | Both bathrooms |
| Bathroom walls | 600×1200 matte stone-look off-white | `#ECE8E1` | Both bathrooms |
| Yard floor | 600×600 R11 anti-slip porcelain, dark grey, overlay | `#474846` | Yard |
| Gaming floor | 5 mm SPC vinyl, light ash oak | `#A08F7C` | Bedroom 3 only |
| Curtains | Sheer ivory + blackout oatmeal | `#F3EFE7` / `#CBBFAE` | Living and bedrooms; ripple-fold, ceiling track |

### Lighting colour temperature

| Space | Colour temperature |
|---|---|
| Bedrooms, foyer, corridor | 2700–3000 K |
| Living | 4000 K functional downlights + 3000 K accents (cove, slats, lamp) |
| Kitchen and bathrooms | 4000 K task light + 3000 K mirror backlight |
| Gaming | 4000 K task light + RGBW cove (defaults to warm white) |

### Air conditioning

- **Units:** wall-mounted inverter splits. 2.0 hp for living/dining (an open 25 m² strip plus the open kitchen); 1.0 hp for each bedroom.
- **Mounting height:** bottom at 2200, at least 150 below the ceiling for return air, and never above an opening door leaf.
- **Outdoor units:** outside the house and **not modelled** (Q-G3, settled). Piping runs in trunking or L-boxes to the nearest exterior wall and is shown only as those enclosures.

### Budget stance (RM 50k)

- **Built-ins limited to:** the kitchen and its glass screen, Bedroom 2's wardrobe, the master's sliding wardrobe, the TV wall, the shoe cabinet, gaming-room storage, and plaster L-boxes (no full false ceilings).
- **Loose furniture:** mid-range throughout.

---

## 2. Foyer

**Dimensions:** 1515 × 1040, X 110–1625, Y 8760–9800. The main door (1000 opening) is on the top edge. The bottom edge is open to the common corridor. The right side is the kitchen wall (X 1625).

**Constraints**
- Semi-public: it sits outside the main door. Anything placed here needs to be robust, lockable, and allowed by building management.
- The main door swings inward, so the foyer floor is fully usable.
- The left wall continues the exterior wall. The right wall is solid for its full 1040 depth.

**Furniture candidates**

| Item | Size (W × D × H) | Notes |
|---|---|---|
| Floating shoe cabinet | 1000 × 350 × 1050, raised 150 off the floor | About 18–24 pairs. The gap underneath takes daily slippers. Lockable. |
| Removable artificial-grass mat | about 1035 × 900 | Recessed edge trim, not glued |
| Coir or rubber mat (alternative) | same | Lower maintenance |

**Proposed layout**
- **Shoe cabinet** on the right wall at X 1275–1625, Y 8770–9770, facing left. It sits just outside the door opening, on your right as you come in.
- **Grass mat** over the remaining floor.
- **Full-length mirror inside the house**, on the utility tall unit (see [§3](#3-living--dining-incl-junction-and-corridor)). A mirror in a public recess is less useful and gets dirty.

**Clearance**

| Check | Result |
|---|---|
| Clear foyer width beside the cabinet | 1165 ✓ |
| Door opening (X 265–1265) | Untouched ✓ |

**AC:** none.

**Lighting**
- 1 × warm 2700 K surface downlight (IP44, since the foyer is semi-outdoor).
- Warm LED strip under the floating shoe cabinet, which lights the slipper zone.
- Optional: a motion sensor.

**Materials**
- **Floor:** 600×600 main porcelain overlay, with the grass mat on top.
- **Shoe cabinet:** grey marble body with cream doors and black handles.
- **Walls:** washable paint. Wall tile up to 1200 if management allows.

**Unresolved**
- **Q-F1:** Is the foyer really open to the common corridor, or is a grille gate planned? Does management allow a cabinet in it? If not, the fallback is a 600-wide shoe cabinet inside, beside the utility unit, at the cost of some dining-side space.
- **Q-F2:** Artificial grass: yes, or a plain coir mat? I recommend the **removable** grass mat. It gives the look, and you can lift it out to wash.

---

## 3. Living / Dining (incl. junction and corridor)

**Dimensions**

| Zone | Size | Range |
|---|---|---|
| Living | 2970 × 3250 | X 110–3080, Y 150–3400 |
| Junction | 2970 × 980 | Y 3400–4380 |
| Dining | 2970 × 2610 | Y 4380–6990 |
| Entry landing | X 110–1775 | Y 6990–8610 |
| Corridor (to the bedrooms) | 4050 × 980 | Runs right from the junction |

**Constraints**
- **2970 is the governing width.** A sofa, a coffee table and a TV unit across it leave little spare: the 3-seater is 900 deep and the TV cabinet 400, leaving 1670 for the coffee table and walkways.
- **Living window:** 2395 wide in the top wall. Tall, door-like sliding window: about 1960 high, sill 140.
- **Usable walls:** the left exterior wall (full length, no openings) and the right wall shared with Bedroom 2 (3250).
- **The main route** runs from the main door up the strip, past the dining table, then turns right into the corridor at the junction. The junction must stay clear.
- **Dining** has blank walls on both sides: the exterior wall on the left and the Bedroom 3 wall on the right.

**Furniture candidates**

| Item | Size (mm) | Notes |
|---|---|---|
| 65" TV | 1450 × 835 × 30 | Wall-mounted, centre at 1050 above the floor |
| TV cabinet | 1800 × 400 × 350 | Floating, bottom at 250. Closed drawers for electronics storage. |
| TV wall | 2400-wide grey marble cladding (2 slabs), full height | 3000 K LED in the edge channels |
| 3-seater | 2100 × 900 × 800 | Slim arms, raised legs |
| 2-seater | 1500 × 900 × 800 | Same family as the 3-seater |
| L-sofa (alternative to 3+2) | 2700 × 1600 | 3 seats + chaise (Q-L1) |
| Coffee table | 1100 × 550 × 400 | Rounded corners, marble top, black frame |
| Rug | 1700 × 2000 | Low-pile, washable |
| Dining table | 1800 × 900 × 750 | 3 + 3 seats, marble top, slim black legs |
| Dining chairs | 450 × 520 × 820 | 6 |
| Linear pendant | 1200 long | 3000 K, dimmable |
| Utility tall unit | 600 × 450 × 2400 | Vacuum, mop, ironing board, household and baby items. Full-length mirror on the door. |
| Floor lamp | ø350 × 1600 | |

**Proposed layout** (see the drawing)

*TV and seating*
- **TV** on the **left exterior wall**. This keeps the TV noise off the Bedroom 2 partition, and the wall has no openings.
- **Slat panel:** Y 1080–3480.
- **TV cabinet:** Y 1380–3180.
- **TV centreline:** Y 2280, which is also the centre of the 3-seater.

*Sofas and coffee table*
- **3-seater** against the Bedroom 2 wall, X 2150–3050, Y 1230–3330. It ends 70 before the junction opens up.
- **2-seater** under the window, back to the glass with a 180 gap for the curtains: X 650–2150, Y 330–1230. Together with the 3-seater it forms an L.
  - **The window is tall and door-like (sill 140).** The 800-high sofa back covers the lower part of the glass. You reach the sliding sashes from the clear right-hand end of the window (X 2150–2790, 640 wide, with nothing in front of it) and the narrow left end (X 400–650). Floor-length curtains.
- **Coffee table:** X 1160–1710, Y 1730–2830.
- **Floor lamp** in the top-left corner.

*Viewing distance*
- From the 3-seater to the screen is about 2.43 m. That is a 33° viewing angle for a 65" TV, between the 30° and 40° recommendations ✓.
- **The 2-seater faces down the room, so its seats watch the TV at a side angle.** That is the cost of fitting 3+2 into 2970 (Q-L1).

*Dining and storage*
- **Dining table** against the left wall side: table X 860–1760, Y 4785–6585.
- **Chairs:** 3 per side, no end chairs. End chairs would stick into the junction and the entry route.
- **Utility tall unit** on the left wall at Y 6700–7300, between the dining zone and the main-door swing.
- **Junction and corridor:** nothing placed.

**Clearance**

| Check | Measured | Status |
|---|---|---|
| TV cabinet ↔ coffee table (walkway) | 620 | ✓ |
| Coffee table ↔ 3-seater (legs) | 440 | ✓ |
| 2-seater back ↔ window wall (curtains) | 180 | ✓ |
| Dining table ↔ left wall (seated zone) | 750 | ✓ minimum |
| Dining chairs (tucked) ↔ Bedroom 3 wall (**main route**) | 860 | ✓ |
| Same, with diners seated | about 720 | ⚠ squeeze. Could be raised to about 820 with an 800-wide table (Q-L3). |
| Dining table end ↔ junction | 405 + junction 980 | ✓ |
| Utility unit ↔ main-door swing arc | 410 | ✓ |
| Junction kept clear | 2970 × 980 | ✓ |

**AC (living/dining, 2.0 hp)**
- **Position:** **high on the Bedroom 2 wall above the 3-seater**, at X 3080, Y 1780–2780, height 2200–2520. It blows toward the TV wall.
- **Why there:**
  - The people on the 3-seater sit behind and below the unit, so they are never in the direct airflow.
  - The air crosses the coffee-table zone and returns off the TV wall.
  - The 2-seater gets indirect air.
- **Trade-off:**
  - The dining zone, 3–5 m away, gets spill-over air only. In this 8.4 m strip there is no single wall position that covers both zones directly.
  - The pipe runs about 2 m in trunking along the top of the wall to the window wall.
- **Fallback:** above the TV on the exterior wall. That gives the shortest pipe run, but it blows straight at the 3-seater (Q-G3).

**Lighting**

| Zone | Fixtures |
|---|---|
| Living | 4 × 4000 K dimmable downlights. 3000 K LED behind the slat panel. Plaster L-box along the window wall hiding the curtain track and a 3000 K cove. Floor lamp. |
| Dining | Linear pendant, 3000 K. |
| Junction and corridor | 3 × 3000 K downlights on the corridor centreline. |
| Entry | 1 × 3000 K downlight inside the main door. |

**Materials**
- Main porcelain floor throughout.
- Walls: warm white, with the marble TV wall as the only feature wall; framed prints above the sofa and the dining table.
- Sofas in oatmeal fabric.
- Dining: marble top on black legs; chairs in oak and fabric (the one wood accent).
- Curtains: double layer at the living window.

**Unresolved**
- **Q-L1:** Keep **3+2** as briefed, or switch to an **L-sofa** (3 seats + chaise)? The L-sofa gives every seat a proper TV view and a more open walkway at the window. I lean slightly toward the L-sofa, but I've drawn 3+2 because that's what the brief asks for.
- **Q-L2:** Confirm the TV goes on the left exterior wall.
- **Q-L3:** Dining table: 1800 × 900 with 3 + 3 (drawn), or 1800 × 800 for a wider main route?
- ~~Q-L4~~ **Settled: yes.** A glass screen closes the kitchen. In the 3D it is shown partly open (details in §4).

---

## 4. Kitchen

**Dimensions**
- **U shape:** X 1775–4820, Y 7905–9645.
- **Counters (as on the plan), all 595 deep:**
  - Left leg: X 1775–2370, Y 7905–9645.
  - Bottom run: Y 9050–9645 (3045 long).
  - Sink leg: X 4225–4820, Y 7915–9645.
- **Aisle:** 1855 between the legs.
- **Kitchen-to-yard window** above the sink (Y 8025–9205). The yard door is just above the sink leg.

**Constraints**
- **Walls behind the counters:** the left leg has the foyer wall behind it only from Y 8610 down. Above that point, its back faces the entry landing.
- **The bottom wall is an exterior wall facing the common corridor.** A cooker hood probably cannot be vented there (Q-K1).
- **The sink leg has a window above it**, so it gets no upper cabinets.
- **The area in front of the yard door** (X 4225–4820, Y 6990–7915) must stay clear.
- **Two blind corners** at the bottom of the U.

**Furniture and appliance candidates**

| Item | Size (W × D × H) | Notes |
|---|---|---|
| Refrigerator, 2-door | 700 × 700 × 1850 | About 450 L. A side-by-side (900+) does not fit. |
| Fridge housing | 740 × 700 × 2400 | Tall cream unit around the fridge |
| Base cabinets | 600 deep, 900 to worktop | |
| Upper cabinets | 350 × 800 high, from 1500 to 2300 | |
| Hob | 780 wide, 2-burner gas or induction | At the plan's position, X 2920–3700 |
| Slim hood | 900 wide | |
| Sink | Single bowl + drainer, 1000 × 460 | Under the yard window, at the plan's position |
| Microwave | | Built into an upper cabinet, or on the counter (Q-K3) |

**Proposed layout**
- **Refrigerator at the top of the left leg** (X 1775–2475, Y 7905–8645), in a full-height cream housing, door facing into the aisle. **Why here:**
  1. It is the one stretch of the left leg with no wall behind it. A tall unit there closes the kitchen off from the entry landing, giving a semi-closed kitchen without building a wall.
  2. The other end positions don't work: one blocks the yard door, the other is a blind corner.
  3. It completes the work triangle: fridge → sink 2.4 m, sink → hob 1.5 m, hob → fridge 1.6 m, a total of 5.5 m (the guideline is 4.0–7.9 m) ✓.
- **Counter run:** left leg (below the fridge), bottom run, then sink leg.
- **Hob** in the middle of the bottom run, with 545 mm of landing space on the left and 520 mm on the right.
- **Upper cabinets** on the foyer wall above the left leg and along the bottom wall, with the hood between them. There are no upper cabinets over the sink because of the window.
- **Corners:** a LeMans pull-out in the bottom-left corner; plain shelving in the bottom-right corner, which sits under the sink side.
- **Glass screen (Q-L4, settled):** closes the kitchen along Y ≈ 7880–7910, from the fridge housing (X 2475) to the kitchen–yard wall stub (X 4820).
  - **Panels:** two black-framed clear-glass sliding panels, about 900 each, top-hung from a ceiling track, covering X 2475–4220. A fixed full-height glass panel covers X 4220–4820, at the end of the sink leg.
  - **Shown in the 3D:** **partly open**, with one panel slid behind the other, leaving a 700 gap at X 3520–4220.
  - **Effect:** the fridge is inside the kitchen; the yard door stays outside it, reached from the entry landing. The screen doesn't change any counter or aisle clearance.

**Clearance**

| Check | Measured | Status |
|---|---|---|
| Fridge front ↔ sink leg | 1745 | ✓ |
| Aisle | 1845 | ✓ generous |
| Fridge door swing | Opens into the aisle | ✓ |
| Hob landing space | 545 / 520 | ✓ |
| Main-door swing ↔ fridge | No interaction (main door is 610 to the left) | ✓ |
| Yard-door approach | Clear | ✓ |

**AC:** none (not required by the brief). It will be partly served by the living/dining unit.

**Lighting**
- 3 × 4000 K downlights over the aisle.
- 4000 K LED strip under the upper cabinets.
- Light in the hood.

**Materials**

| Element | Finish |
|---|---|
| Base units | Mid-grey marble-look sintered stone (v3) |
| Upper units | Cream matte |
| Fridge housing | Cream, matching the upper units (v3) |
| Handles | Slim black profile |
| Worktop | Light grey marble (v3) |
| Backsplash | Light grey marble slab, matching the worktop (v3) |
| Floor | Main porcelain |

**Unresolved**
- **Q-K1:** Gas or induction? Where does the hood exhaust go? Options: recirculating, or ducted to the yard through the yard wall, about 1.5 m.
- **Q-K2:** Is a 700-wide fridge fine? That is the maximum for this spot.
- **Q-K3:** Microwave and oven: built into an upper cabinet (my recommendation) or on the counter?

---

## 5. Master Bedroom

**Dimensions**
- **Main room:** 2970 × 3095, X 6370–9340, Y 150–3245.
- **Column:** sticks out 50 mm on the left wall from Y 150 to Y 2020.
- **Lobby:** 1910 × 1135, X 7430–9340, Y 3245–4380. The room door opens into it, and the Bath 1 door is on its south side.
- **Window:** 1200, X 7015–8215, sitting about 240 left of the room's centre.

**Constraints: this room has the hardest conflict in the house**
- A king bed with its frame takes 1900 × 2000.
- Along X: bed length 2000 + 600 wardrobe + 600 walking space = 3200, but the room is 2970 ✗.
- Along Y: bed 1900 + 600 wardrobe + 600 in front of the wardrobe = 3100, but the room is 3095, which leaves **zero** gap on the other side of the bed ✗.
- The plan's own wardrobe position (the bottom wall, X 6370–7855) therefore only works with a queen bed and access from one side.
- The bottom wall is only solid from X 6370 to 7855. The rest is the opening to the lobby, which is the entry route and must stay clear.
- In the lobby, the room door's swing and the approach to the Bath 1 door leave no wall long enough for a wardrobe.

**Furniture candidates**

| Item | Size (W × D × H) | Notes |
|---|---|---|
| King bed | Mattress 1830 × 1905 (Malaysian king); frame 1900 × 2000 | Lift-up storage base, upholstered headboard 1000 high (v3: in front of the window) |
| Floating bedside drawers ×2 | 450 × 400, 250–550 high | 2 drawers, marble top |
| Sliding wardrobe | 1485 × 560 × full height | 2 sliding doors, black frames, cream panels |
| Wall sconces | 2 | On the window wall above the bedside drawers |

**Proposed layout: v3 (bed on the window wall + sliding wardrobe)** — replaces v2 (towers + corner wardrobe), which you found cramped.

- **King bed**, head against the window wall, centred in the room: X 6930–8830, Y 185–2185. The headboard (1000) stands in front of the window, so the window gets a **roller blind** (sheer + blackout) instead of curtains.
- **Floating bedside drawers ×2** (450 × 400, 250–550 high, marble top) either side of the head: X 6450–6900 and 8860–9310, Y 150–550. A wall sconce above each.
- **Sliding wardrobe** on the plan's own wardrobe position: X 6370–7855 (to the grey nib), Y 2685–3245, 560 deep, 2 doors. Hanging width **1485**.
- **Rug** under the lower half of the bed.
- **Lobby:** still clear; the opening to the room stays 1485 wide.

**Trade-offs (stated plainly)**
- **Storage drops** from 2110 (v2) to **1485** hanging, plus the lift-up bed base. If that's too little, the wardrobe can run ~300 further east past the nib (opening to the lobby then 1185, still wide).
- **The wardrobe aisle is 500**, under the 600 rule. It works only because the doors slide; it's a one-person aisle.
- **The window is behind the headboard.** It still opens (sliding), but you reach over the bed head to open it.
- **Dressing table removed.** The ensuite mirror is the nearest mirror.

**Rejected alternatives (v3 check)**

| Alternative | Why it fails |
|---|---|
| Head on the left wall, bed pushed toward the window, wardrobe on the bottom wall | Leaves 145 in front of the wardrobe (king 1900 + 450 bedside + 600 wardrobe in 3095) |
| Bed against the window wall (long side), wardrobe on the bottom wall | One side of the bed unusable, window blocked by the mattress |
| Wardrobe along the right wall at the foot of the bed | Leaves a 320 path |

**Clearance (v3)**

| Check | Measured | Status |
|---|---|---|
| Bed ↔ left wall (column) | 510 | ✓ (bedside drawer at the head) |
| Bed ↔ right wall | 510 | ✓ |
| Bed foot ↔ wardrobe | 500 | ⚠ tight; sliding doors only |
| Lobby ↔ room opening | 1485 wide, clear | ✓ |
| AC (left wall, Y 1247–2147) | Blows across the lower half of the bed, not at the pillows | ✓ |

**AC (1.0 hp)**
- **Position (unchanged from v2):** left wall, Y 1247–2147, height 2200–2490. In v3 it blows across the lower half of the bed, away from the pillows on the window wall.
- **Avoided:**
  - The right wall would blow straight at the bed.
  - Above the window there is no headroom.
- **Pipe run:** about 1.5 m along the top of the wall to the window wall, into the L-box, then out to the outdoor unit (not modelled).

**Lighting (warm, 2700–3000 K)**
- **L-box cove** along the window wall: hides the blind and gives indirect light.
- **Ceiling:** 2 downlights over the wardrobe aisle (X 7150 and 8600, Y 2450).
- **Bedside:** 2 wall sconces.
- **Accent:** LED inside the wardrobe, triggered by the door.

**Materials**
- **Floor:** main porcelain, greige rug under the lower half of the bed.
- **Headboard:** oatmeal upholstered, in front of the window.
- **Wardrobe:** cream panels in slim black aluminium sliding frames.
- **Window:** double roller blind (the headboard rules out floor-length curtains).
- **Art:** one framed print on the right wall.

**Unresolved**
- ~~Q-M1~~ **Settled:** king bed. Storage is 1485 hanging + bed base in v3.
- ~~Q-M2~~ **Settled (v3):** no dressing table.
- **Q-M3:** What is the grey block at the end of the plan's wardrobe? I've modelled it as a 400 × 135 nib or column.
- **Q-M4:** Is a lift-up storage bed OK? It is the main place for bulk and seasonal storage.

---

## 6. Master Bathroom (Bath 1, ensuite)

**Dimensions:** 1410 × 2310, X 7930–9340, Y 4530–6840.
- **Shaft:** 255 × 890 in the bottom-left corner, X 7930–8185, Y 5950–6840.
- **Door:** top wall, X 8490–9285 (795), opening in, hinge on the right.
- **Window:** 605 in the bottom wall, high level, X 8225–8830.
- **Floor trap:** about X 8330, Y 6680.

**Constraints**
- The plan's fixture positions follow the plumbing, so I keep them: basin top-left, WC below it, shower at the bottom.
- The shower zone is next to the shaft: 1155 wide (X 8185–9340) × 880 deep (Y 5960–6840).
- The opening in the shower zone is a **louvred ventilator with the exhaust fan**, not a window. Nothing about it needs to change.

**Furniture and fixture candidates**

| Item | Size (W × D × H) | Notes |
|---|---|---|
| Wall-hung vanity | 600 × 450, top at 850 | Oak, stone-look basin |
| LED mirror cabinet | 600 × 130 × 700 | |
| Wall-hung WC + concealed cistern | 400 × 520 projection | Needs about 150 of wall depth |
| Floor-standing WC (alternative) | 400 × 700 | |
| Fixed glass panel | 605 long × 2000 high | Black profile |
| Rain shower + hand shower | | |
| Instant water heater | | |
| Recessed niche | 600 × 300 | Shower wall |
| Exhaust fan | | Fitted in the louvred ventilator |

**Proposed layout**
- **Vanity** against the partition at Y 4650–5250.
- **WC** at Y 5340–5740.
- **Glass panel** at Y 5955, from the shaft to X 8790, leaving a **550** entry on the right.
- **Shower** on the right wall: valve and rail at about Y 6300, water heater above them.
- **Niche** in the right wall.

**Clearance**

| Check | Measured | Status |
|---|---|---|
| WC front ↔ right wall | 710 | ✓ |
| Door swing (795 radius from hinge at X 9285) ↔ vanity corner | 913 | ✓ |
| Shower entry | 550 | ✓ |
| Shower zone depth | 880 | ⚠ slightly shallow, typical for condos |

**AC:** none.

**Lighting**
- 2 × 4000 K IP44 downlights.
- 3000 K LED behind the mirror cabinet.
- Small LED strip in the niche (the "premium" touch).

**Materials**
- **Floor:** charcoal 600×600 R10. The shower floor uses the same tile, cut into four slopes toward the trap.
- **Walls:** off-white 600×1200.
- **Shower back wall:** greige 75×300 tiles laid vertically, ensuite only.
- **Fittings:** matte black or gunmetal.
- **Vanity:** grey marble fronts and top.

**Unresolved**
- **Q-MB1:** Does the shaft need an access panel? I assume a tiled access hatch on its face.
- **Q-MB2:** Instant heater or storage heater? Wall-hung or floor-standing WC? A wall-hung WC needs a 150 false wall. Its total projection is about 670 against about 700 for a floor WC, so the clearance stays about the same. The trade-off is cost, and the cistern is only reachable through a flush plate.

---

## 7. Bedroom 2

**Dimensions:** 3010 × 3095, X 3220–6230, Y 150–3245.
- **Window:** 1200, X 4385–5585, sitting about 260 right of the room's centre.
- **Door:** bottom wall, X 5330–6230, opening in, hinge on the right. Its swing covers X 5330–6230, Y 2345–3245.
- **Walls:** solid bottom wall X 3220–5330 (2110). The left wall is shared with the living room (3095); the right wall with the master (3095).

**Constraints**
- Your requirement is a **queen bed + wardrobe**. A queen bed + 600 wardrobe + 600 on both sides would need 3400 against the room's 3095 ✗. As in the master, one side of the bed can only be a narrow slot.
- Wardrobe on the right wall: bed (2050) + wardrobe (600) along X would leave 360 at the foot ✗.
- So the bottom wall is the only wall that can take a full wardrobe. This matches the plan's intent.

**Furniture candidates**

| Item | Size (W × D × H) | Notes |
|---|---|---|
| Queen bed | Mattress 1524 × 1905; frame 1600 × 2050 | Headboard 1100 |
| Slim bedside table | 400 × 280 × 550 | Floating |
| Sliding wardrobe, full height | 2010 × 600 × 2400 + bulkhead | 2 sliding panels of 1005 |
| Optional slim dresser or desk | 1000 × 350 | On the right wall, if you want it |

**Proposed layout**
- **Bed:** head against the living-room wall, X 3220–5270, Y 445–2045. The top side has a **295** slot for the slim bedside table. The bottom side faces the wardrobe across a **600** aisle. **Main access is from the bottom side and the foot.**
- **Wardrobe:** X 3220–5230, Y 2645–3245. It stops 100 short of the door frame.
- **Foot zone** (X 5270–6230, 960 wide) left open. The optional 350-deep dresser would still leave a 610 path.

**Clearance**

| Check | Measured | Status |
|---|---|---|
| Bed ↔ wardrobe | 600 | ✓ sliding doors |
| Top side of bed | 295 | ⚠ bedside table only; the bed is entered from the other side |
| Bed foot ↔ right wall | 960 | ✓ |
| Door swing ↔ wardrobe | 100 | ✓ |
| Window access | From the foot zone (X 5270–5585 is free) | ✓ |

**AC (1.0 hp)**
- **Position:** left wall above the headboard, Y 795–1695, height 2200–2490. It blows toward the foot of the bed.
- **Why there:** the same reasoning as the master: the air goes over the sleeper, not at the pillow.
- **Pipe run:** to the window wall, about 0.8 m.

**Lighting (warm)**
- 2 downlights.
- 1 wall sconce on the open side.
- LED strip in the headboard ledge.
- L-box cove with the curtain track along the window wall.

**Materials**
- **Floor:** main porcelain.
- **Wardrobe:** cream sliding doors with a black frame.
- **Headboard:** upholstered, oatmeal.
- **Curtains:** double layer.
- **Walls:** no feature wall.

**Unresolved**
- **Q-B2-1:** Is the one-sided bed access OK? The alternative is a wardrobe only 450 deep with folded storage, no hanging, which widens the aisle to 750.
- **Q-B2-2:** Add the optional dresser or desk at the foot, or keep the space open (my recommendation)?

---

## 8. Bedroom 3 / Gaming

**Dimensions:** 2970 × 2310, X 3220–6190, Y 4530–6840.
- **Door:** top wall, X 3380–4270 (890), opening in, hinge on the left. Its swing covers X 3380–4270, Y 4530–5420.
- **Window:** 1190, **opens into the yard**, X 4990–6180 in the bottom wall.
- **Walls:** the right wall (shared with Bath 2) is solid for its full 2310. The left wall (shared with dining) is solid.

**Constraints**
- **6.9 m² for 2 workstations.** Each needs about 1.6 m of depth: a 650 desk + 900 for the chair.
- **The 2970 bottom wall** could hold two 1400 desks, but:
  - The right-hand desk would cover the window, so the window couldn't be opened.
  - Chairs pushed back would hit the door's swing (2310 − 650 − 900 = 760 of room behind the chairs, against a 890 door swing ✗).
- **The 2310 right wall** holds two desks of 1140 each. The window stays clear and there is a lot of space behind the chairs. **The cost:** each desk is narrower.
- **Bounded by:** the door top-left, the window bottom-right, and a blank right wall that is ideal for monitors (no glare; the window is to the side).

**Furniture candidates**

| Item | Size (W × D × H) | Notes |
|---|---|---|
| Desk ×2 | 1140 × 650 × 740 | Oak top, black frame, cable tray. Optional sit/stand frame. |
| Ergonomic chair ×2 | ø680 base | |
| Monitors, per person | 27" landscape (615 wide) + 24" portrait (300 wide) on a dual arm | Total about 935 on a 1140 desk ✓. Two 27" landscape (1230) would not fit. |
| PC tower ×2 | 230 × 480 × 470 | On a floor stand under the outer end of each desk |
| Closed storage | 2 × 690 × 400 × 2400 | Lower doors solid, upper doors tinted glass with an LED, for consoles and collectibles |
| Acoustic felt panel | | Charcoal, above the monitors |
| Monitor light bars ×2 | | |

**Proposed layout: Option G-B (recommended)**
- **Desks side by side along the right wall:** Desk A at Y 4545–5685, Desk B at Y 5690–6830. Users face the right wall.
- **Chairs** at X ≈ 4810–5490.
- **Storage** on the left wall, south of the door swing: X 3220–3620, Y 5450–6840.
- **Window:** Desk B's end sits next to it, but the desk is below the assumed 900 sill.

**Option G-A**
- 2 × 1400 desks on the window wall with two 27" screens each.
- It blocks the window, and the door swing clashes with the chair zone. **Not recommended.**

**Clearance (G-B)**

| Check | Measured | Status |
|---|---|---|
| Chair (pushed back) ↔ door swing | 370 | ✓ |
| Chair ↔ storage | 1190 | ✓ |
| Storage door swing ↔ door swing | Storage starts 30 beyond the door arc | ✓ |
| Window | Reachable at X 4990–5540 (roll Chair B aside) | ✓ |
| Between the two desks | 5 mm joint; each user has their own 1140 zone | ✓ |
| Floor access for cleaning | Above 50% of the floor stays open | ✓ |

**AC (1.0 hp)**
- **Position:** top wall **above the door**, X 3375–4275, height 2200–2490. It blows down toward the window wall, over the zone behind the chairs.
- **Why there:** the users sit at X 4640–5540, to the side of the airflow, never in front of it. The left wall would blow on their backs; the right wall would blow in their faces.
- **Pipe run:** inside the perimeter L-box along the left and bottom walls (the same L-box carries the cove LED), out through the window head into the yard. About 3.5 m.

**Lighting (dedicated scheme)**
- 2 × downlights, dimmed warm (3000 K) for the gaming scene; full output for cleaning.
- RGB cove in the left and bottom L-box (shown purple/blue).
- Hexagon wall panels above each desk: charcoal felt tiles, some backlit RGB (v3, owner wanted a proper gaming look).
- Monitor light bars; RGB underglow on the back edge of each desk; RGB fans in the PCs.
- RGB LED inside the glass storage section.

**Materials**
- **Floor:** light ash-oak SPC vinyl (v3: lighter), dark rug under the chairs.
- **Monitor wall:** charcoal paint with the hexagon felt/light panels.
- **Other walls:** warm white, so the room stays part of the house. A framed synthwave print by the door.
- **Desks:** matte black. **Chairs:** racing-style, black with red / cyan accents.
- **Storage:** charcoal body, smoked-glass upper doors.
- **Window:** double roller blind (sheer + blackout) instead of curtains. Curtains would fall onto Desk B.

**Unresolved**
- **Q-GR1:** **G-B (right wall, 1140 desks, 27" + 24" portrait)** or **G-A (window wall, 1400 desks, 2 × 27", window blocked)**? What monitors do you actually own?
- **Q-GR2:** Will the PCs run hard for long sessions? If so, I'd step the AC up to 1.5 hp (2 PCs + 4 monitors ≈ 0.8–1.0 kW of heat in 6.9 m²).
- ~~Q-GR3~~ **Settled:** the window is a standard sliding window (sill about 900), so Desk B (740) fits below it.

---

## 9. Yard

**Dimensions:** 1280 × 2655, X 4980–6260, Y 6990–9645.
- **Door** from the kitchen: X 4820 wall, Y 6990–7875, opening in, hinge at the top. Its swing covers X 4980–5865, Y 6990–7875.
- **Windows into the yard:** Bedroom 3 (top wall) and the kitchen (left wall).
- **Right side:** drawn open, Y 6990–9205 (Q-Y1).
- **Floor trap:** about X 6100, Y 9495.
- **Plan's washer symbol:** bottom-left corner.

**Constraints**
- The door swing takes the top third of the yard. Nothing may stand there.
- Rain can probably get in through the open side, so the floor must fall toward the trap.
- Bedroom 3's window looks into the yard. Anything hung near the top of the yard is visible from the gaming room and cuts its light.

**Furniture and fixture candidates**

| Item | Size (W × D × H) | Notes |
|---|---|---|
| **Top-load** washer (v3: owner prefers top-open) | 600 × 600 × 980 | At the plan's position, near the drain. Real top-loaders are 970–1050 tall; the lid opens upward, so the cabinet above (underside at 1500) still clears it closed |
| Dryer | n/a | A dryer can't stack on a top-loader (lid access); there is room for one machine only |
| Wall cabinet | 910 × 350 × 700, at 1500–2200 | Above the washer, for detergent and cleaning supplies |
| Ceiling drying rack | 600 × 1100 rods | Pulley type |
| Bracket-mounted utility sink (optional) | 450 × 400 | |
| Bedroom 3 AC compressor (maybe) | about 750 × 280 × 550 | |

**Proposed layout**
- **Washer** in the bottom-left corner, X 5000–5600, Y 9030–9630, lid and controls facing up toward the yard door (rear console against the wall).
- **Wall cabinet** above it.
- **Drying rack** on the ceiling against the right/open side, Y 7950–9050, where air moves best and which is away from Bedroom 3's window.
- **Floor trap** kept clear.

**Clearance**

| Check | Measured | Status |
|---|---|---|
| Free space in front of the washer (up to the edge of the yard-door swing) | 1155 | ✓ |
| Door swing zone | Kept empty | ✓ |
| Drying rack head height | 2300 | ✓ |
| Walk path to the trap and open side | 660 wide beside the washer | ✓ |

**AC:** none. All outdoor units are outside the house and are not modelled (Q-G3, settled).

**Lighting:** 1 × 4000 K IP44 batten or oyster ceiling light.

**Materials**
- **Floor:** dark-grey anti-slip R11 porcelain, 600×600 overlay (as you asked).
- **Walls:** off-white tile to 1500, washable paint above.
- **Cabinet:** cream laminate, moisture-resistant board.

**Unresolved**
- **Q-Y1:** What is on the right side of the yard? Low parapet with a grille, louvres, or fully open? This affects rain, security and the drying rack.
- **Q-Y2:** Washer only, washer + stacked dryer, or a combined washer-dryer?
- **Q-Y4:** Do you want a small utility sink?

---

## 10. Common Bathroom (Bath 2)

**Dimensions:** 1350 × 2310, X 6420–7770, Y 4530–6840.
- **Door:** top wall, X 6475–7270 (795), opening in, hinge on the left. Its swing covers X 6475–7270, Y 4530–5325.
- **Window:** 595, high level, in the bottom wall, X 6880–7475.
- **Floor trap:** about X 7615, Y 6680.
- **Plan fixtures:** basin top-right, WC below it on the right wall (the partition shared with Bath 1, which carries the pipes), shower at the bottom.

**Constraints**
- Keep the plumbing positions as drawn.
- The bathroom is 1350 wide: the WC (700 projection) plus 650 in front of it.
- The left wall (shared with Bedroom 3) is 230 thick. It could take a recessed niche.

**Furniture and fixture candidates**
- The same family as the ensuite, but simpler:
  - Vanity: 600 × 450, grey marble fronts and top.
  - Plain mirror cabinet.
  - Floor-standing WC.
  - Fixed glass panel, 800.
  - Instant heater.
  - Recessed niche in the left wall.
  - Robe hooks.
  - Exhaust fan.

**Proposed layout**
- **Vanity** against the right wall at Y 4650–5250.
- **WC** at Y 5340–5740.
- **Glass panel** at Y 5955, X 6970–7770, with a 550 entry on the left.
- **Shower:** on the right wall. The niche goes in the left wall, inside the shower zone.

**Clearance**

| Check | Measured | Status |
|---|---|---|
| WC front ↔ left wall | 650 | ✓ |
| Door swing ↔ vanity corner | 853 against the 795 leaf | ✓ |
| Door swing ↔ WC corner | 973 | ✓ |
| Shower entry | 550 | ✓ |
| Shower zone | 1350 × 880 | ⚠ fine for a condo |

**AC:** none.

**Lighting**
- 2 × 4000 K IP44 downlights.
- Mirror light, 3000 K.

**Materials**
- **Same as the ensuite:** charcoal floor, off-white walls, black fittings.
- **Without the ensuite's premium touches:** no feature tile and no niche LED.

**Unresolved**
- **Q-CB1:** None blocking. Confirm that keeping the plan's fixture positions is fine. Moving them means moving the drainage.

---

## 11. Decisions I need from you

Struck-through items are settled. The open items below take the default shown, since you approved the rest of the analysis. Tell me if any default should change. **Bold** marks my recommendation.

**House-wide**

| # | Question | My default if you don't answer |
|---|---|---|
| Q-G1 | Ceiling height and any beams | 2800, flat |
| ~~Q-G2~~ | **Settled:** the living window is tall and door-like (1960 high); the others are standard sliding; the bathroom openings are ventilators with the exhaust fan | |
| ~~Q-G3~~ | **Settled:** compressors are outside and not modelled | |
| ~~Q-G4~~ | **Settled:** 600×600 tile overlay everywhere except Bedroom 3's vinyl | |

**Master bedroom and Bedroom 2**

| # | Question | My default if you don't answer |
|---|---|---|
| ~~Q-M1~~ | **Settled (v3):** king bed on the window wall + 1485 sliding wardrobe | |
| ~~Q-M2~~ | **Settled (v3):** dressing table removed | |
| Q-M3 | What is the grey block at the master wardrobe end? | A 400 × 135 nib |
| Q-M4 | Lift-up storage bed | Yes |
| Q-B2-1 | Bedroom 2 bed accessible from one side only (295 slot on the window side) | Yes |

**Gaming room**

| # | Question | My default if you don't answer |
|---|---|---|
| Q-GR1 | **Desks on the right wall (2 × 1140, 27" + 24" portrait)** vs desks on the window wall (2 × 1400, 2 × 27") | **Right wall (G-B)** |
| Q-GR2 | AC 1.0 hp or 1.5 hp | 1.0 hp |

**Living and dining**

| # | Question | My default if you don't answer |
|---|---|---|
| Q-L1 | 3+2 sofas (drawn) vs L-sofa | 3+2 |
| Q-L3 | Dining table 1800 × 900 vs 1800 × 800 | 1800 × 900 |
| ~~Q-L4~~ | **Settled:** glass screen, shown partly open | |

**Foyer and kitchen**

| # | Question | My default if you don't answer |
|---|---|---|
| Q-F1 | Foyer open to the corridor, and is a cabinet allowed there? | Yes, shoe cabinet in the foyer |
| Q-F2 | **Removable grass mat** vs coir mat | Grass mat |
| Q-K1 | Gas or induction; where the hood exhaust goes | Induction, recirculating hood |
| Q-K2 / Q-K3 | Fridge 700 wide max; microwave in an upper cabinet | Yes / yes |

**Yard and bathrooms**

| # | Question | My default if you don't answer |
|---|---|---|
| Q-Y1 | What is on the yard's open side? | Parapet at 1000 + open above |
| ~~Q-Y2~~ | **Settled (v3):** one top-load washer, no dryer | |
| Q-MB2 | Wall-hung or floor WC in the ensuite | Floor WC |

---

## 12. Stack (revisited)

I'm keeping **Three.js + Vite (TypeScript)**, built around accuracy:

- **One source of geometry.** `tools/layout.mjs` will be promoted to the 3D app's data file. The SVGs in this folder and the 3D scene are built from the same numbers, so they cannot drift apart.
- **Exact-size furniture.** Furniture is built from parameters (rounded boxes, legs, cushions), using the exact dimensions in this document. Any downloaded model would be scaled to an exact bounding box, so sizes stay absolute.
- **First-person walking:** mouse-look + WASD, eye height 1600, wall collision taken from the wall rectangles, walking speed about 1.4 m/s.
- **Checking tools:**
  - An in-app **tape measure**: click two points to read the distance in mm.
  - A **top-down plan toggle**, so you can audit any dimension yourself.
- **Looks:** PBR materials using the palette above, an indoor environment map, soft shadows, and real light fixtures placed where this document says (cove strips, downlights, pendants).

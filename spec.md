# PCB Designer

## Current State
The app is a full-stack PCB layout tool with:
- A visual canvas for placing and arranging components on a grid
- Save/load designs via ICP backend (per-user storage)
- A component library in `componentLibrary.ts` with categories: Passives (resistor, capacitor, inductor, crystal), Semiconductors (diode, LED, NPN, PNP, voltage regulator), ICs (DIP-8, DIP-14, DIP-16), Connectors (2/4/8-pin, pushbutton, switch)
- SVG schematic symbols rendered in `ComponentRenderer.tsx` for each type
- `ComponentCategory` type is a union of four string literals

## Requested Changes (Diff)

### Add
1. **New component library entries** (global starter library) in `componentLibrary.ts`:
   - `ne555` — NE555 Timer IC (ICs category, DIP-8 style, 4×5 grid, dark body)
   - `cap_ceramic_100nf` — Decoupling Cap 100nF (Passives category, ceramic capacitor symbol, label "100nF")
   - `cap_ceramic_10nf` — Decoupling Cap 10nF (Passives category, ceramic capacitor symbol, label "10nF")
   - `cap_elec_100uf` — Timing Capacitor 100µF (Passives category, polarized/electrolytic capacitor symbol with + marker, label "100µF")
   - `pot_p1` — Potentiometer P1 ON-time (Passives category, resistor-with-arrow symbol, label "P1")
   - `pot_p2` — Potentiometer P2 OFF-time (Passives category, resistor-with-arrow symbol, label "P2")
   - `npn_power` — NPN Power Transistor Q1 (Semiconductors category, standard NPN transistor symbol, 3 pins B/C/E, label "Q1 NPN")
   - `screw_term_2pin` — Screw Terminal 2-pin (Connectors category, 2-pin screw terminal symbol distinct from generic connector, label "TERM2")
   - `switch_spst` — SPST Switch S1 (Connectors category, standard SPST switch symbol, label "S1")
   - `switch_timer` — Timer Switch S2 (Connectors category, standard SPST switch symbol, label "S2")

2. **New SVG schematic symbols** in `ComponentRenderer.tsx` for each new type:
   - `ne555`: DIP-8 IC body (same style as existing DIP8) but labelled "NE555" inside
   - `cap_ceramic_100nf` / `cap_ceramic_10nf`: Standard ceramic capacitor symbol (two parallel lines, no polarity mark); value label shown
   - `cap_elec_100uf`: Polarised electrolytic capacitor symbol (one straight line + one curved line); "+" polarity marker
   - `pot_p1` / `pot_p2`: Resistor body (rectangle) with an arrow through it diagonally (standard variable resistor/potentiometer IEC symbol); label P1 or P2
   - `npn_power`: Same NPN circle symbol as existing `npn` but with a label "Q1"
   - `screw_term_2pin`: Rectangle body with two circles inside (screw heads), label "TERM"
   - `switch_spst` / `switch_timer`: Same SPST switch symbol as existing `switch`

3. **Update `ComponentCategory` type** in `pcb.ts` to add `'Templates'` as a valid category (used for template display only, not for new component types).

4. **"Tesla Coil (12V)" design template** accessible from the toolbar Load menu or a new "Templates" button:
   - Pre-placed components at sensible grid positions matching the board diagram layout (70mm × 90mm proportions):
     - Screw Terminal (power input) at approx grid (2, 5)
     - Screw Terminal (HV module output) at approx grid (22, 5)
     - NE555 Timer at approx grid (8, 7)
     - Decoupling Cap 100nF at approx grid (8, 3)
     - Decoupling Cap 10nF at approx grid (12, 3)
     - Potentiometer P1 at approx grid (7, 14)
     - Potentiometer P2 at approx grid (11, 14)
     - Timing Capacitor 100µF at approx grid (15, 14)
     - NPN Power Transistor at approx grid (18, 7)
     - Switch S1 at approx grid (2, 12)
     - Switch S2 at approx grid (2, 16)
   - Template does NOT get saved to backend — it loads locally as a starting point the user can then save under their own name.

5. **Templates button in toolbar** (or integrated into Load modal) — a "Templates" button that pops open a simple modal/dropdown listing available local templates (starting with "Tesla Coil (12V)"). Clicking a template loads it onto the canvas.

### Modify
- `componentLibrary.ts`: Append 10 new entries to `COMPONENT_LIBRARY` array; add a "Templates" category group to `COMPONENT_CATEGORIES` (optional, or just ensure new items show under their respective categories).
- `ComponentRenderer.tsx`: Add new `case` blocks in `ComponentSymbol` switch for each new component type ID.
- `PCBToolbar.tsx`: Add a "Templates" button (with a layout/template icon) that opens a templates modal.
- `PCBCanvasContext.tsx` / canvas context: The `loadDesign` function should accept a template load (local, no backend fetch) — this already exists as a local state update, so no change needed there.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `pcb.ts`: add new component type IDs to the type definitions (no structural change needed since IDs are plain strings; verify `ComponentCategory` includes any new categories if needed).
2. Update `componentLibrary.ts`: append the 10 new component entries under their respective categories; ensure `COMPONENT_CATEGORIES` groups them correctly.
3. Update `ComponentRenderer.tsx`: add SVG case blocks for all 10 new component type IDs with appropriate schematic symbols.
4. Add `teslaCoilTemplate.ts` (or similar) in `constants/`: define the pre-placed component list for the Tesla Coil (12V) template.
5. Create `TemplatesModal.tsx` component: lists available templates, on select calls `loadDesign` with pre-placed components.
6. Update `PCBToolbar.tsx`: add Templates button that opens `TemplatesModal`.
7. Run validate (typecheck + lint + build) and fix any issues.

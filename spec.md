# PCB Designer

## Current State

- Full-stack PCB layout tool with Motoko backend (save/load designs) and React frontend.
- Canvas is an SVG rendered inside a scroll+zoom wrapper (`PCBCanvas.tsx`). Zoom via scroll wheel and ±/reset buttons (top-right). Canvas size: 1440×960px (60×40 grid cells at 24px each).
- Middle-mouse or Alt+drag is stubbed (`isPanning` state exists) but does NOT actually scroll the view — the pan logic only sets state without moving the scroll container.
- Components placed via `ComponentLibrary` sidebar, draggable on canvas, with rotate/delete toolbar actions.
- Toolbar: Save, Load, Templates, New Board, Rotate, Delete.
- No board-size outline feature; no pin coordinate readout.

## Requested Changes (Diff)

### Add

1. **Pan / board navigation** — Middle-mouse drag (button 1) and Space+drag should scroll the `scrollContainerRef` viewport so the board can be freely navigated when zoomed in. The existing `isPanning` state wires the cursor style; the actual scroll offset must now be updated on each mousemove delta.

2. **UK board size selector** — A dropdown in the toolbar (after the Templates button) labelled "Board Size" that lists common UK/Euro hobby PCB sizes:
   - None (no outline)
   - Eurocard 100×160mm
   - Half Eurocard 100×80mm
   - Arduino Uno footprint 68.6×53.3mm
   - Raspberry Pi 65×56mm
   - 100×100mm (standard proto)
   - 50×50mm (mini proto)
   - 160×100mm (double Eurocard width)
   - Custom (prompts width×height mm input)
   
   The selected size should persist in local React state (not backend). GRID_SIZE = 24px is the canvas unit. Each grid cell = 2.54mm (0.1 inch standard perfboard pitch), so: pixels = mm / 2.54 * GRID_SIZE.

3. **Dashed board outline** — When a board size is selected (not "None"), draw a dashed white rectangle on the SVG canvas representing the board boundary. Style: `stroke="rgba(255,255,255,0.7)"`, `strokeDasharray="8,5"`, `strokeWidth={1.5}`, no fill. Centered on the canvas, or aligned to top-left with a configurable margin (default: start at grid cell 2,2 = pixel 48,48). Label the board size (e.g. "100×160mm") in small white text near the top-left corner of the outline.

4. **Pin coordinate readout** — When hovering over the canvas, display the current grid coordinate (column, row) in the info bar, formatted as e.g. `Pin (12, 7)`. This helps users follow datasheets and perfboard layouts. Update in real time on mouse move. Show as a small monospace label near the zoom controls. If a component is selected, also show its top-left pin coordinate.

### Modify

- **`handleSVGMouseDown`** in `PCBCanvas.tsx`: On middle-mouse (button 1) or Space+left-click, set `isPanning=true` and record `panStart` as `{ scrollLeft: scrollEl.scrollLeft, scrollTop: scrollEl.scrollTop, mouseX: e.clientX, mouseY: e.clientY }`.
- **`handleSVGMouseMove`** in `PCBCanvas.tsx`: When `isPanning`, compute delta from panStart mouse position and apply to `scrollContainerRef.current.scrollLeft` and `.scrollTop` (subtract delta to pan). Update pan cursor while active.
- Add `Space` key down/up listeners to enable pan-by-space-drag mode (cursor changes to grab when Space held).
- `PCBToolbar.tsx`: Add Board Size selector dropdown after Templates button. Pass selected board size down via a new context value or prop-drilling to `PCBCanvas`.
- `PCBCanvasContext.tsx`: Add `boardSize: { widthMm: number; heightMm: number } | null` state and `setBoardSize` action. Default: `null`.
- `PCBCanvas.tsx`: Read `boardSize` from context. Render dashed outline and size label inside the SVG when `boardSize !== null`. Show live pin coordinate in the info bar.

### Remove

- The existing stubbed pan logic that sets `_panStart` state but does nothing (replace with working implementation).

## Implementation Plan

1. **`PCBCanvasContext.tsx`**: Add `boardSize` state + `setBoardSize` action/dispatch case. Export from context value.
2. **`types/pcb.ts`** (optional): Add `BoardSize` type `{ label: string; widthMm: number; heightMm: number }`.
3. **`PCBToolbar.tsx`**: Import `Select` from shadcn. Add UK board sizes array constant. Add Board Size `<Select>` control that calls `setBoardSize`. Add "Custom" option that opens a small inline input for WxH mm.
4. **`PCBCanvas.tsx`**:
   a. Fix pan: store panStartRef with scrollLeft/Top + mouseX/Y; on mousemove when isPanning, update scrollLeft/Top.
   b. Add Space key listener for space-pan mode.
   c. Add `renderBoardOutline()` that returns dashed rect + label SVG elements when `boardSize` is set.
   d. Add `hoverGridPos` state; update from `getSVGCoords` on every mousemove; render as `Pin (col, row)` label in info bar.
   e. Show selected component pin coords in info bar.
5. Ensure all new interactive elements have `data-ocid` markers per naming contract.

# PCB Designer

## Current State
- Full PCB layout app with visual SVG canvas, component library (incl. Tesla Coil components), save/load designs, templates.
- Canvas is a fixed-size SVG (CANVAS_WIDTH x CANVAS_HEIGHT) inside a scrollable container — no zoom capability.
- Auth via Internet Identity (`useInternetIdentity` hook with `clear()` for logout). Idle handling is disabled in the AuthClient (`disableIdle: true`).
- No autosave mechanism and no inactivity/tab-close logout.
- `PCBCanvas.tsx` handles mouse events and SVG rendering.
- `PCBCanvasContext.tsx` holds canvas state.
- `PCBToolbar.tsx` has a Save button calling `useSaveDesign` mutation.
- `AuthenticatedApp.tsx` wraps the app with auth gating.

## Requested Changes (Diff)

### Add
1. **Zoom on the PCB canvas** — mouse-wheel zoom (Ctrl+scroll or plain scroll on the canvas), zoom in/out buttons in the canvas info bar (e.g. "+" / "−" / "100%" reset), zoom range 25%–400%, zoom centred on cursor position. All mouse coordinates used for component placement and dragging must account for the current zoom level.
2. **Autosave on tab close or navigating away** — use the `beforeunload` event to trigger a save of the current design if there are placed components and the design has a name (non-empty, non-"Untitled Board"). Show no toast for this silent save.
3. **Autosave + logout after 15 minutes of inactivity** — track user activity (mousemove, keydown, click, scroll) globally. Reset a 15-minute inactivity timer on any activity. On timeout: save the current design silently (same condition as above), then call `clear()` from `useInternetIdentity` to log out, and show a brief dismissible notice on the login screen ("You were logged out due to inactivity. Your design was saved.").

### Modify
- `PCBCanvas.tsx`: add zoom state (scale factor), apply CSS `transform: scale(scale)` or SVG `viewBox` manipulation to the SVG, update all coordinate helpers (`getSVGCoords`, `snapToGrid`) to divide by scale. Add zoom controls overlay inside the canvas container.
- `PCBToolbar.tsx` or a new hook: expose `handleSave` logic (or extract to a reusable `useSaveCurrentDesign` hook) so it can be called from the inactivity/tab-close handlers.
- `AuthenticatedApp.tsx`: add inactivity timer logic and `beforeunload` listener, calling the save+logout on timeout. Optionally accept an `inactivityMessage` prop/state to show on the login screen after auto-logout.

### Remove
- Nothing removed.

## Implementation Plan
1. Extract save logic into a reusable hook `useSaveCurrentDesign` (or inline callable fn) accessible outside toolbar.
2. In `PCBCanvas.tsx`, add `zoomLevel` state (default 1.0, range 0.25–4.0). Apply scale via CSS transform on the SVG wrapper. Adjust `getSVGCoords` to divide pixel offsets by `zoomLevel`. Add zoom controls (+ / − / reset %) in the canvas info bar with `data-ocid` markers.
3. In `AuthenticatedApp.tsx` (or a new `useInactivityLogout` hook), set up:
   - Activity listener on `window` for `mousemove`, `keydown`, `click`, `scroll` — debounced reset of a 15-min `setTimeout`.
   - On timeout: call silent save then `clear()`.
   - `beforeunload` listener: call silent save synchronously (best-effort).
   - After auto-logout, store a flag in `sessionStorage` and display a brief notice on the login screen.
4. Add `data-ocid` markers to zoom controls.
5. Validate (typecheck + lint + build).

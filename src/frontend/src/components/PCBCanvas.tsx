import type React from "react";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getComponentById } from "../constants/componentLibrary";
import { usePCBCanvas } from "../contexts/PCBCanvasContext";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRID_SIZE,
  type PCBRotation,
  type PlacedComponent,
} from "../types/pcb";
import ComponentRenderer from "./ComponentRenderer";

const GRID_COLOR = "rgba(255,255,255,0.07)";
const GRID_DOT_COLOR = "rgba(255,255,255,0.15)";
const MAJOR_GRID_COLOR = "rgba(255,255,255,0.12)";
const MAJOR_GRID_INTERVAL = 5;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.1;

// mm per grid cell (standard 0.1" = 2.54mm perfboard pitch)
const MM_PER_CELL = 2.54;
// px per mm at 1:1 zoom
const PX_PER_MM = GRID_SIZE / MM_PER_CELL;
// Board outline starts 2 cells in from the canvas edge
const BOARD_OFFSET_PX = GRID_SIZE * 2;

interface DragState {
  isDragging: boolean;
  componentId: number | null;
  startMouseX: number;
  startMouseY: number;
  startCompX: number;
  startCompY: number;
}

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

export default function PCBCanvas() {
  const {
    placedComponents,
    selectedId,
    activeComponentType,
    selectComponent,
    addComponent,
    updateComponent,
    rotateSelected,
    deleteSelected,
    setActiveComponentType,
    boardSize,
  } = usePCBCanvas();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState(1.0);
  const zoomRef = useRef(1.0);

  // Keep zoomRef in sync with state for event handlers
  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel]);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    componentId: null,
    startMouseX: 0,
    startMouseY: 0,
    startCompX: 0,
    startCompY: 0,
  });
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isPanning, setIsPanning] = useState(false);
  const [hoverGridPos, setHoverGridPos] = useState<{
    col: number;
    row: number;
  } | null>(null);

  // Pan tracking ref — avoids re-renders during pan
  const panStartRef = useRef({
    scrollLeft: 0,
    scrollTop: 0,
    mouseX: 0,
    mouseY: 0,
  });

  // Space key tracking ref
  const spaceHeldRef = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const snapToGrid = useCallback((px: number, py: number) => {
    return {
      x: Math.floor(px / GRID_SIZE),
      y: Math.floor(py / GRID_SIZE),
    };
  }, []);

  // Get SVG coordinates accounting for zoom
  const getSVGCoords = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / zoomRef.current,
        y: (e.clientY - rect.top) / zoomRef.current,
      };
    },
    [], // zoomRef is a ref so it's stable
  );

  // Space key handlers for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
        setSpaceHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeldRef.current = false;
        setSpaceHeld(false);
        setIsPanning(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Wheel zoom handler
  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const currentZoom = zoomRef.current;
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const newZoom = clampZoom(currentZoom + delta);

      if (newZoom === currentZoom) return;

      // Cursor position relative to the scroll container
      const containerRect = scrollEl.getBoundingClientRect();
      const cursorX = e.clientX - containerRect.left;
      const cursorY = e.clientY - containerRect.top;

      // Point in SVG space that should remain under the cursor
      const svgX = (scrollEl.scrollLeft + cursorX) / currentZoom;
      const svgY = (scrollEl.scrollTop + cursorY) / currentZoom;

      // Compute new scroll position so the same SVG point stays under cursor
      const newScrollLeft = svgX * newZoom - cursorX;
      const newScrollTop = svgY * newZoom - cursorY;

      zoomRef.current = newZoom;
      setZoomLevel(newZoom);

      // Use requestAnimationFrame to set scroll after the DOM has updated
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = newScrollLeft;
          scrollContainerRef.current.scrollTop = newScrollTop;
        }
      });
    };

    scrollEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => scrollEl.removeEventListener("wheel", handleWheel);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "r" || e.key === "R") {
        rotateSelected();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      }
      if (e.key === "Escape") {
        setActiveComponentType(null);
        selectComponent(null);
      }
      // Zoom shortcuts: Ctrl+= / Ctrl+- / Ctrl+0
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoomLevel((z) => {
            const nz = clampZoom(z + ZOOM_STEP);
            zoomRef.current = nz;
            return nz;
          });
        } else if (e.key === "-") {
          e.preventDefault();
          setZoomLevel((z) => {
            const nz = clampZoom(z - ZOOM_STEP);
            zoomRef.current = nz;
            return nz;
          });
        } else if (e.key === "0") {
          e.preventDefault();
          setZoomLevel(1.0);
          zoomRef.current = 1.0;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rotateSelected, deleteSelected, setActiveComponentType, selectComponent]);

  const handleSVGMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const coords = getSVGCoords(e);

      // Pan: compute delta from stored start and scroll
      if (isPanning) {
        const scrollEl = scrollContainerRef.current;
        if (scrollEl) {
          const dx = e.clientX - panStartRef.current.mouseX;
          const dy = e.clientY - panStartRef.current.mouseY;
          scrollEl.scrollLeft = panStartRef.current.scrollLeft - dx;
          scrollEl.scrollTop = panStartRef.current.scrollTop - dy;
        }
        return;
      }

      // Update hover grid position
      const col = Math.floor(coords.x / GRID_SIZE);
      const row = Math.floor(coords.y / GRID_SIZE);
      setHoverGridPos({ col, row });

      if (activeComponentType) {
        const snapped = snapToGrid(coords.x, coords.y);
        setGhostPos(snapped);
      }

      if (dragState.isDragging && dragState.componentId !== null) {
        const dx = coords.x - dragState.startMouseX;
        const dy = coords.y - dragState.startMouseY;
        const newX = Math.max(
          0,
          Math.round((dragState.startCompX * GRID_SIZE + dx) / GRID_SIZE),
        );
        const newY = Math.max(
          0,
          Math.round((dragState.startCompY * GRID_SIZE + dy) / GRID_SIZE),
        );
        updateComponent(dragState.componentId, { x: newX, y: newY });
      }
    },
    [
      activeComponentType,
      dragState,
      getSVGCoords,
      isPanning,
      snapToGrid,
      updateComponent,
    ],
  );

  const handleSVGMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false, componentId: null }));
    setIsPanning(false);
  }, []);

  const handleSVGClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.isDragging) return;
      const coords = getSVGCoords(e);

      if (activeComponentType) {
        const snapped = snapToGrid(coords.x, coords.y);
        const libItem = getComponentById(activeComponentType);
        if (!libItem) return;
        addComponent({
          componentType: activeComponentType,
          name: libItem.symbol,
          position: snapped,
          rotation: 0 as PCBRotation,
        });
      } else {
        selectComponent(null);
      }
    },
    [
      activeComponentType,
      addComponent,
      dragState.isDragging,
      getSVGCoords,
      selectComponent,
      snapToGrid,
    ],
  );

  const handleSVGMouseDown = useCallback((e: React.MouseEvent) => {
    const scrollEl = scrollContainerRef.current;
    // Middle mouse button OR Space+left-click → start panning
    if (e.button === 1 || (e.button === 0 && spaceHeldRef.current)) {
      if (scrollEl) {
        panStartRef.current = {
          scrollLeft: scrollEl.scrollLeft,
          scrollTop: scrollEl.scrollTop,
          mouseX: e.clientX,
          mouseY: e.clientY,
        };
      }
      setIsPanning(true);
      e.preventDefault();
    }
  }, []);

  const handleComponentMouseDown = useCallback(
    (e: React.MouseEvent, component: PlacedComponent) => {
      if (activeComponentType) return;
      // If panning, don't start a component drag
      if (spaceHeldRef.current || e.button === 1) return;
      e.stopPropagation();
      const coords = getSVGCoords(e);
      setDragState({
        isDragging: true,
        componentId: component.id,
        startMouseX: coords.x,
        startMouseY: coords.y,
        startCompX: component.position.x,
        startCompY: component.position.y,
      });
      selectComponent(component.id);
    },
    [activeComponentType, getSVGCoords, selectComponent],
  );

  const handleComponentClick = useCallback(
    (e: React.MouseEvent, component: PlacedComponent) => {
      if (activeComponentType) return;
      e.stopPropagation();
      selectComponent(component.id);
    },
    [activeComponentType, selectComponent],
  );

  // Zoom button handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel((z) => {
      const nz = clampZoom(z + ZOOM_STEP);
      zoomRef.current = nz;
      return nz;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((z) => {
      const nz = clampZoom(z - ZOOM_STEP);
      zoomRef.current = nz;
      return nz;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1.0);
    zoomRef.current = 1.0;
  }, []);

  // Explicitly typed as ReactElement[] to avoid never[] inference
  const renderGrid = (): ReactElement[] => {
    const lines: ReactElement[] = [];

    // Vertical lines
    for (let col = 0; col <= CANVAS_WIDTH / GRID_SIZE; col++) {
      const x = col * GRID_SIZE;
      const isMajor = col % MAJOR_GRID_INTERVAL === 0;
      lines.push(
        <line
          key={`v${col}`}
          x1={x}
          y1={0}
          x2={x}
          y2={CANVAS_HEIGHT}
          stroke={isMajor ? MAJOR_GRID_COLOR : GRID_COLOR}
          strokeWidth={isMajor ? 0.8 : 0.5}
        />,
      );
    }

    // Horizontal lines
    for (let row = 0; row <= CANVAS_HEIGHT / GRID_SIZE; row++) {
      const y = row * GRID_SIZE;
      const isMajor = row % MAJOR_GRID_INTERVAL === 0;
      lines.push(
        <line
          key={`h${row}`}
          x1={0}
          y1={y}
          x2={CANVAS_WIDTH}
          y2={y}
          stroke={isMajor ? MAJOR_GRID_COLOR : GRID_COLOR}
          strokeWidth={isMajor ? 0.8 : 0.5}
        />,
      );
    }

    // Grid dots at major intersections
    for (
      let col = 0;
      col <= CANVAS_WIDTH / GRID_SIZE;
      col += MAJOR_GRID_INTERVAL
    ) {
      for (
        let row = 0;
        row <= CANVAS_HEIGHT / GRID_SIZE;
        row += MAJOR_GRID_INTERVAL
      ) {
        lines.push(
          <circle
            key={`d${col}-${row}`}
            cx={col * GRID_SIZE}
            cy={row * GRID_SIZE}
            r={1.5}
            fill={GRID_DOT_COLOR}
          />,
        );
      }
    }

    return lines;
  };

  const renderGhost = (): ReactElement | null => {
    if (!activeComponentType || !ghostPos) return null;
    const libItem = getComponentById(activeComponentType);
    if (!libItem) return null;
    const w = libItem.width * GRID_SIZE;
    const h = libItem.height * GRID_SIZE;
    return (
      <g
        transform={`translate(${ghostPos.x * GRID_SIZE}, ${ghostPos.y * GRID_SIZE})`}
        opacity={0.5}
        style={{ pointerEvents: "none" }}
      >
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill="rgba(245, 166, 35, 0.15)"
          stroke="#f5a623"
          strokeWidth={1.5}
          strokeDasharray="4,2"
          rx={2}
        />
        <text
          x={w / 2}
          y={h / 2 + 4}
          textAnchor="middle"
          fill="#f5a623"
          fontSize="10"
          fontFamily="IBM Plex Mono"
        >
          {libItem.symbol}
        </text>
      </g>
    );
  };

  const renderBoardOutline = (): ReactElement | null => {
    if (!boardSize || boardSize.widthMm <= 0 || boardSize.heightMm <= 0)
      return null;

    const widthPx = Math.min(
      boardSize.widthMm * PX_PER_MM,
      CANVAS_WIDTH - BOARD_OFFSET_PX - 4,
    );
    const heightPx = Math.min(
      boardSize.heightMm * PX_PER_MM,
      CANVAS_HEIGHT - BOARD_OFFSET_PX - 4,
    );

    const x = BOARD_OFFSET_PX;
    const y = BOARD_OFFSET_PX;

    return (
      <g style={{ pointerEvents: "none" }}>
        {/* Dashed board outline */}
        <rect
          x={x}
          y={y}
          width={widthPx}
          height={heightPx}
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeDasharray="8,5"
          strokeWidth={1.5}
          rx={2}
        />
        {/* Size label inside top-left corner */}
        <text
          x={x + 6}
          y={y + 14}
          fill="rgba(255,255,255,0.65)"
          fontSize="10"
          fontFamily="monospace"
        >
          {boardSize.label}
        </text>
        {/* Small corner tick marks for alignment */}
        <line
          x1={x}
          y1={y + 8}
          x2={x}
          y2={y}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
        <line
          x1={x}
          y1={y}
          x2={x + 8}
          y2={y}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
        <line
          x1={x + widthPx - 8}
          y1={y}
          x2={x + widthPx}
          y2={y}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
        <line
          x1={x + widthPx}
          y1={y}
          x2={x + widthPx}
          y2={y + 8}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
        <line
          x1={x}
          y1={y + heightPx - 8}
          x2={x}
          y2={y + heightPx}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
        <line
          x1={x}
          y1={y + heightPx}
          x2={x + 8}
          y2={y + heightPx}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
        <line
          x1={x + widthPx - 8}
          y1={y + heightPx}
          x2={x + widthPx}
          y2={y + heightPx}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
        <line
          x1={x + widthPx}
          y1={y + heightPx - 8}
          x2={x + widthPx}
          y2={y + heightPx}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
      </g>
    );
  };

  // Cursor: crosshair when placing, grabbing when dragging/panning, grab when space held
  const cursorStyle = activeComponentType
    ? "crosshair"
    : dragState.isDragging
      ? "grabbing"
      : isPanning
        ? "grabbing"
        : spaceHeld
          ? "grab"
          : "default";

  const zoomPct = Math.round(zoomLevel * 100);

  // Selected component's grid position
  const selectedComp =
    selectedId !== null
      ? placedComponents.find((c) => c.id === selectedId)
      : null;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{ background: "oklch(0.12 0.01 160)" }}
    >
      {/* Canvas info bar */}
      <div className="absolute top-2 right-3 z-10 flex items-center gap-2 text-xs font-mono select-none flex-wrap justify-end">
        {/* Pin coordinate readout */}
        {hoverGridPos !== null && (
          <div
            data-ocid="canvas.pin_coords"
            className="flex items-center gap-2 rounded px-2 py-0.5"
            style={{
              background: "oklch(0.17 0.01 160)",
              border: "1px solid oklch(0.28 0.02 160)",
              color: "oklch(0.72 0.16 85)",
            }}
          >
            <span title="Current pin position under cursor">
              Pin ({hoverGridPos.col}, {hoverGridPos.row})
            </span>
            {selectedComp && (
              <>
                <span style={{ color: "oklch(0.38 0.02 160)" }}>·</span>
                <span
                  style={{ color: "oklch(0.78 0.04 160)" }}
                  title="Selected component position"
                >
                  Selected: ({selectedComp.position.x},{" "}
                  {selectedComp.position.y})
                </span>
              </>
            )}
          </div>
        )}

        {/* Zoom controls */}
        <div
          className="flex items-center gap-0.5 rounded"
          style={{
            background: "oklch(0.17 0.01 160)",
            border: "1px solid oklch(0.28 0.02 160)",
          }}
        >
          <button
            type="button"
            data-ocid="canvas.zoom_out_button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= MIN_ZOOM}
            className="flex items-center justify-center w-6 h-6 rounded-l transition-colors disabled:opacity-30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
            style={{ color: "oklch(0.88 0.04 160)" }}
            title="Zoom out (Ctrl+-)"
          >
            −
          </button>
          <button
            type="button"
            data-ocid="canvas.zoom_reset_button"
            onClick={handleZoomReset}
            className="flex items-center justify-center px-1.5 h-6 min-w-[3rem] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 tabular-nums"
            style={{ color: "oklch(0.72 0.16 85)" }}
            title="Reset zoom (Ctrl+0)"
          >
            {zoomPct}%
          </button>
          <button
            type="button"
            data-ocid="canvas.zoom_in_button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= MAX_ZOOM}
            className="flex items-center justify-center w-6 h-6 rounded-r transition-colors disabled:opacity-30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
            style={{ color: "oklch(0.88 0.04 160)" }}
            title="Zoom in (Ctrl++)"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-3 opacity-60 pointer-events-none">
          {activeComponentType && (
            <span className="text-amber-DEFAULT bg-charcoal-DEFAULT px-2 py-0.5 rounded border border-amber-DEFAULT/30 animate-pulse-amber pointer-events-none">
              Placing: {getComponentById(activeComponentType)?.name} — Click to
              place · ESC to cancel
            </span>
          )}
          {selectedId !== null && !activeComponentType && (
            <span className="text-amber-DEFAULT bg-charcoal-DEFAULT px-2 py-0.5 rounded border border-amber-DEFAULT/30 pointer-events-none">
              R = Rotate · Del = Delete · Drag to move
            </span>
          )}
          <span className="text-muted-foreground pointer-events-none">
            {placedComponents.length} component
            {placedComponents.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Pan hint at bottom-left */}
      <div
        className="absolute bottom-2 left-3 z-10 text-xs font-mono select-none opacity-40 pointer-events-none"
        style={{ color: "oklch(0.65 0.02 160)" }}
      >
        Middle-mouse or Space+drag to pan
      </div>

      {/* SVG Canvas — scroll container */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-auto scrollbar-thin"
      >
        {/* Zoom wrapper — scales the SVG */}
        <div
          style={{
            transformOrigin: "top left",
            transform: `scale(${zoomLevel})`,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          }}
        >
          <svg
            ref={svgRef}
            aria-hidden="true"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              cursor: cursorStyle,
              display: "block",
              userSelect: "none",
            }}
            onClick={handleSVGClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                handleSVGClick(e as unknown as React.MouseEvent<SVGSVGElement>);
            }}
            onMouseMove={handleSVGMouseMove}
            onMouseUp={handleSVGMouseUp}
            onMouseDown={handleSVGMouseDown}
            onMouseLeave={() => {
              setGhostPos(null);
              setHoverGridPos(null);
              if (dragState.isDragging) {
                setDragState((prev) => ({ ...prev, isDragging: false }));
              }
            }}
          >
            {/* PCB board background */}
            <rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="oklch(0.22 0.08 155)"
            />

            {/* Grid */}
            <g>{renderGrid()}</g>

            {/* Board border */}
            <rect
              x={1}
              y={1}
              width={CANVAS_WIDTH - 2}
              height={CANVAS_HEIGHT - 2}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={2}
            />

            {/* Corner mounting hole markers */}
            {(
              [
                [8, 8],
                [CANVAS_WIDTH - 8, 8],
                [8, CANVAS_HEIGHT - 8],
                [CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8],
              ] as [number, number][]
            ).map(([cx, cy], i) => {
              const cornerKey = `corner-${String(i)}`;
              return (
                <g key={cornerKey}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={1.5}
                    fill="rgba(255,255,255,0.3)"
                  />
                </g>
              );
            })}

            {/* Board size outline — below components, above grid border */}
            {renderBoardOutline()}

            {/* Placed components */}
            {placedComponents.map((comp) => (
              <ComponentRenderer
                key={comp.id}
                component={comp}
                isSelected={comp.id === selectedId}
                onClick={(e) => handleComponentClick(e, comp)}
                onMouseDown={(e) => handleComponentMouseDown(e, comp)}
              />
            ))}

            {/* Ghost preview */}
            {renderGhost()}
          </svg>
        </div>
      </div>
    </div>
  );
}

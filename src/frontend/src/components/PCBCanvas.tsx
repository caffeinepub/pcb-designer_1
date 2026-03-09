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
  type PlacedWire,
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

// Wire edge snap threshold in pixels
const EDGE_SNAP_THRESHOLD = 20;
// Wire click detection tolerance in pixels
const WIRE_CLICK_TOLERANCE = 6;

interface DragState {
  isDragging: boolean;
  componentId: number | null;
  startMouseX: number;
  startMouseY: number;
  startCompX: number;
  startCompY: number;
}

interface WireDrawingState {
  active: boolean;
  startX: number;
  startY: number;
}

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

/** Point-to-line-segment distance for wire click detection */
function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Detect if a point is near a canvas edge and return edge snap info */
function detectEdgeSnap(
  x: number,
  y: number,
): {
  snappedX: number;
  snappedY: number;
  isEdge: boolean;
  side: PlacedWire["edgeSide"];
} {
  let snappedX = x;
  let snappedY = y;
  let isEdge = false;
  let side: PlacedWire["edgeSide"] = null;

  if (x < EDGE_SNAP_THRESHOLD) {
    snappedX = 0;
    isEdge = true;
    side = "left";
  } else if (x > CANVAS_WIDTH - EDGE_SNAP_THRESHOLD) {
    snappedX = CANVAS_WIDTH;
    isEdge = true;
    side = "right";
  }

  if (y < EDGE_SNAP_THRESHOLD) {
    snappedY = 0;
    isEdge = true;
    side = "top";
  } else if (y > CANVAS_HEIGHT - EDGE_SNAP_THRESHOLD) {
    snappedY = CANVAS_HEIGHT;
    isEdge = true;
    side = "bottom";
  }

  return { snappedX, snappedY, isEdge, side };
}

export default function PCBCanvas() {
  const {
    placedComponents,
    selectedId,
    activeComponentType,
    selectComponent,
    addComponent,
    updateComponent,
    rotateComponent,
    rotateSelected,
    deleteSelected,
    removeComponent,
    setActiveComponentType,
    boardSize,
    editMode,
    // Wire state
    placedWires,
    selectedWireId,
    wireMode,
    activeWireColor,
    addWire,
    removeWire,
    selectWire,
    setWireMode,
    // Eraser
    eraserMode,
    setEraserMode,
    // Undo
    undo,
    canUndo,
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

  // Wire drawing state
  const [wireDrawing, setWireDrawing] = useState<WireDrawingState | null>(null);
  const [wireCursorPos, setWireCursorPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // Pending edge label input
  const [pendingEdgeLabel, setPendingEdgeLabel] = useState<{
    wireId: number;
    x: number;
    y: number;
  } | null>(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState("");

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

  // Touch pinch-to-zoom handler
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let initialDistance = 0;
    let initialZoom = 1;
    let initialScrollLeft = 0;
    let initialScrollTop = 0;
    let initialCenterX = 0;
    let initialCenterY = 0;

    const getTouchDistance = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getTouchDistance(e.touches[0], e.touches[1]);
        initialZoom = zoomRef.current;
        initialScrollLeft = el.scrollLeft;
        initialScrollTop = el.scrollTop;
        const rect = el.getBoundingClientRect();
        initialCenterX =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        initialCenterY =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const newDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = newDistance / initialDistance;
        const newZoom = clampZoom(initialZoom * scale);

        // SVG point that should stay under the pinch centre
        const svgX = (initialScrollLeft + initialCenterX) / initialZoom;
        const svgY = (initialScrollTop + initialCenterY) / initialZoom;

        zoomRef.current = newZoom;
        setZoomLevel(newZoom);

        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft =
              svgX * newZoom - initialCenterX;
            scrollContainerRef.current.scrollTop =
              svgY * newZoom - initialCenterY;
          }
        });
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
    };
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
        if (selectedWireId !== null) {
          removeWire(selectedWireId);
        } else {
          deleteSelected();
        }
      }
      if (e.key === "Escape") {
        if (eraserMode) {
          setEraserMode(false);
        } else if (wireDrawing?.active) {
          setWireDrawing(null);
          setWireCursorPos(null);
        } else if (wireMode) {
          setWireMode(false);
          setWireDrawing(null);
          setWireCursorPos(null);
        } else {
          setActiveComponentType(null);
          selectComponent(null);
        }
      }
      // Zoom shortcuts: Ctrl+= / Ctrl+- / Ctrl+0
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          if (canUndo) undo();
        } else if (e.key === "=" || e.key === "+") {
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
  }, [
    rotateSelected,
    deleteSelected,
    setActiveComponentType,
    selectComponent,
    wireDrawing,
    wireMode,
    setWireMode,
    removeWire,
    selectedWireId,
    eraserMode,
    setEraserMode,
    undo,
    canUndo,
  ]);

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

      // Update wire cursor for rubber-band preview
      if (wireMode && wireDrawing?.active) {
        setWireCursorPos({ x: coords.x, y: coords.y });
      }

      if (activeComponentType) {
        const snapped = snapToGrid(coords.x, coords.y);
        setGhostPos(snapped);
      }

      if (dragState.isDragging && dragState.componentId !== null && editMode) {
        const dx = coords.x - dragState.startMouseX;
        const dy = coords.y - dragState.startMouseY;
        // Freeform positioning (edit mode only)
        const newX = Math.max(
          0,
          (dragState.startCompX * GRID_SIZE + dx) / GRID_SIZE,
        );
        const newY = Math.max(
          0,
          (dragState.startCompY * GRID_SIZE + dy) / GRID_SIZE,
        );
        updateComponent(dragState.componentId, { x: newX, y: newY });
      }
    },
    [
      activeComponentType,
      dragState,
      editMode,
      getSVGCoords,
      isPanning,
      snapToGrid,
      updateComponent,
      wireMode,
      wireDrawing,
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

      // Eraser mode: click to delete wire or component
      if (eraserMode) {
        // Check if clicked near a wire
        for (const wire of placedWires) {
          const dist = pointToSegmentDistance(
            coords.x,
            coords.y,
            wire.startX,
            wire.startY,
            wire.endX,
            wire.endY,
          );
          if (dist <= WIRE_CLICK_TOLERANCE) {
            removeWire(wire.id);
            return;
          }
        }
        // Check if a component was clicked
        for (const comp of placedComponents) {
          const libItem = getComponentById(comp.componentType);
          const compW = (libItem?.width ?? 2) * GRID_SIZE;
          const compH = (libItem?.height ?? 2) * GRID_SIZE;
          const compX = comp.position.x * GRID_SIZE;
          const compY = comp.position.y * GRID_SIZE;
          if (
            coords.x >= compX &&
            coords.x <= compX + compW &&
            coords.y >= compY &&
            coords.y <= compY + compH
          ) {
            removeComponent(comp.id);
            return;
          }
        }
        return;
      }

      // Wire mode: two-click drawing
      if (wireMode) {
        if (!wireDrawing?.active) {
          // First click: set start point
          setWireDrawing({ active: true, startX: coords.x, startY: coords.y });
          setWireCursorPos({ x: coords.x, y: coords.y });
        } else {
          // Second click: set end point, snap to edge if near
          const edgeInfo = detectEdgeSnap(coords.x, coords.y);

          const newWire: Omit<PlacedWire, "id"> = {
            startX: wireDrawing.startX,
            startY: wireDrawing.startY,
            endX: edgeInfo.snappedX,
            endY: edgeInfo.snappedY,
            color: activeWireColor,
            label: "",
            isEdgeTerminated: edgeInfo.isEdge,
            edgeSide: edgeInfo.side,
          };

          addWire(newWire);

          // If edge-terminated, prompt for label after next render
          // We use nextWireId - 1 after dispatch; use a callback instead
          if (edgeInfo.isEdge) {
            // The new wire will get the current nextWireId; we schedule the prompt
            // by storing the endpoint coords — the wire will be at the end of placedWires
            setPendingEdgeLabel({
              wireId: -1, // sentinel: will be resolved after add
              x: edgeInfo.snappedX,
              y: edgeInfo.snappedY,
            });
            setEdgeLabelInput("");
          }

          setWireDrawing(null);
          setWireCursorPos(null);
        }
        return;
      }

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
        // Check if we clicked near a wire
        let clickedWire = false;
        for (const wire of placedWires) {
          const dist = pointToSegmentDistance(
            coords.x,
            coords.y,
            wire.startX,
            wire.startY,
            wire.endX,
            wire.endY,
          );
          if (dist <= WIRE_CLICK_TOLERANCE) {
            selectWire(wire.id);
            selectComponent(null);
            clickedWire = true;
            break;
          }
        }
        if (!clickedWire) {
          selectComponent(null);
          selectWire(null);
        }
      }
    },
    [
      activeComponentType,
      addComponent,
      dragState.isDragging,
      getSVGCoords,
      selectComponent,
      snapToGrid,
      wireMode,
      wireDrawing,
      activeWireColor,
      addWire,
      placedWires,
      selectWire,
      eraserMode,
      removeWire,
      removeComponent,
      placedComponents,
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
      if (wireMode) return; // Don't drag components during wire mode
      if (eraserMode) return; // Eraser handles deletion on click, not drag
      // If panning, don't start a component drag
      if (spaceHeldRef.current || e.button === 1) return;
      // Only allow dragging when edit mode is explicitly enabled
      if (!editMode) {
        // Still allow selecting the component on click (mousedown → click)
        return;
      }
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
    [
      activeComponentType,
      editMode,
      getSVGCoords,
      selectComponent,
      wireMode,
      eraserMode,
    ],
  );

  const handleComponentClick = useCallback(
    (e: React.MouseEvent, component: PlacedComponent) => {
      if (activeComponentType) return;
      if (wireMode) return; // Wire mode takes priority
      e.stopPropagation();
      selectComponent(component.id);
    },
    [activeComponentType, selectComponent, wireMode],
  );

  // After a wire is added with edge termination, find the newly added wire and prompt for label
  // We do this by watching placedWires for the most recent edge-terminated wire with empty label
  useEffect(() => {
    if (pendingEdgeLabel && pendingEdgeLabel.wireId === -1) {
      const lastWire = placedWires[placedWires.length - 1];
      if (lastWire?.isEdgeTerminated) {
        setPendingEdgeLabel({
          wireId: lastWire.id,
          x: pendingEdgeLabel.x,
          y: pendingEdgeLabel.y,
        });
      }
    }
  }, [placedWires, pendingEdgeLabel]);

  const handleEdgeLabelSubmit = useCallback(() => {
    if (pendingEdgeLabel && pendingEdgeLabel.wireId !== -1) {
      // Update the wire's label by replacing it
      const wire = placedWires.find((w) => w.id === pendingEdgeLabel.wireId);
      if (wire) {
        // Remove old, add updated — simpler than adding an UPDATE_WIRE action
        removeWire(wire.id);
        addWire({ ...wire, label: edgeLabelInput.trim() });
      }
    }
    setPendingEdgeLabel(null);
    setEdgeLabelInput("");
  }, [pendingEdgeLabel, placedWires, removeWire, addWire, edgeLabelInput]);

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

  // Render per-component rotate button when edit mode is active and component is selected
  const renderEditRotateButton = (): ReactElement | null => {
    if (!editMode || selectedId === null) return null;
    const comp = placedComponents.find((c) => c.id === selectedId);
    if (!comp) return null;
    const libItem = getComponentById(comp.componentType);
    const compW = (libItem?.width ?? 2) * GRID_SIZE;
    const btnCx = comp.position.x * GRID_SIZE + compW + 12;
    const btnCy = comp.position.y * GRID_SIZE - 12;
    return (
      // biome-ignore lint/a11y/useSemanticElements: SVG <g> must be used for canvas rotate button; semantic <button> cannot be a child of <svg>
      <g
        role="button"
        tabIndex={0}
        aria-label="Rotate component 90°"
        style={{ cursor: "pointer" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          rotateComponent(comp.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            rotateComponent(comp.id);
          }
        }}
      >
        {/* Amber circle background */}
        <circle
          cx={btnCx}
          cy={btnCy}
          r={11}
          fill="oklch(0.72 0.16 85)"
          stroke="oklch(0.12 0.01 160)"
          strokeWidth={1.5}
          opacity={0.95}
        />
        {/* Rotate arrow icon — drawn as SVG path */}
        <g
          transform={`translate(${btnCx - 6}, ${btnCy - 6})`}
          fill="none"
          stroke="oklch(0.12 0.01 160)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Arc of the arrow */}
          <path d="M 10 2 A 5 5 0 1 0 12 8" />
          {/* Arrowhead */}
          <polyline points="10,5 12,8 9,9" />
        </g>
      </g>
    );
  };

  /** Render all placed wires */
  const renderWires = (): ReactElement => {
    return (
      <g data-ocid="canvas.wire_layer">
        {placedWires.map((wire) => {
          const isSelected = wire.id === selectedWireId;
          const labelOffset = 14;
          let labelX = wire.endX;
          let labelY = wire.endY;
          let labelAnchor: "start" | "middle" | "end" = "middle";

          // Position label inward from edge
          if (wire.edgeSide === "left") {
            labelX = wire.endX + labelOffset;
            labelAnchor = "start";
          } else if (wire.edgeSide === "right") {
            labelX = wire.endX - labelOffset;
            labelAnchor = "end";
          } else if (wire.edgeSide === "top") {
            labelY = wire.endY + labelOffset;
          } else if (wire.edgeSide === "bottom") {
            labelY = wire.endY - labelOffset;
          }

          return (
            <g key={wire.id}>
              {/* Invisible wider hit area for easier clicking */}
              <line
                x1={wire.startX}
                y1={wire.startY}
                x2={wire.endX}
                y2={wire.endY}
                stroke="transparent"
                strokeWidth={14}
                style={{ cursor: "pointer" }}
              />
              {/* Visible wire line */}
              <line
                x1={wire.startX}
                y1={wire.startY}
                x2={wire.endX}
                y2={wire.endY}
                stroke={isSelected ? "#ffffff" : wire.color}
                strokeWidth={2}
                strokeDasharray={isSelected ? "6,3" : undefined}
                strokeLinecap="round"
              />
              {/* Start endpoint dot */}
              <circle
                cx={wire.startX}
                cy={wire.startY}
                r={4}
                fill={isSelected ? "#ffffff" : wire.color}
              />
              {/* End endpoint dot */}
              <circle
                cx={wire.endX}
                cy={wire.endY}
                r={4}
                fill={isSelected ? "#ffffff" : wire.color}
              />
              {/* Edge label */}
              {wire.isEdgeTerminated && wire.label && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={labelAnchor}
                  dominantBaseline="middle"
                  fontSize="10"
                  fill="white"
                  fontFamily="monospace"
                  fontWeight="600"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {wire.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Rubber-band preview line while drawing */}
        {wireDrawing?.active && wireCursorPos && (
          <g style={{ pointerEvents: "none" }}>
            <line
              x1={wireDrawing.startX}
              y1={wireDrawing.startY}
              x2={wireCursorPos.x}
              y2={wireCursorPos.y}
              stroke={activeWireColor}
              strokeWidth={2}
              strokeDasharray="6,4"
              strokeLinecap="round"
              opacity={0.8}
            />
            <circle
              cx={wireDrawing.startX}
              cy={wireDrawing.startY}
              r={4}
              fill={activeWireColor}
              opacity={0.9}
            />
            <circle
              cx={wireCursorPos.x}
              cy={wireCursorPos.y}
              r={3}
              fill={activeWireColor}
              opacity={0.6}
            />
          </g>
        )}
      </g>
    );
  };

  // Cursor: crosshair when placing components or in wire/eraser mode
  const cursorStyle = eraserMode
    ? "cell"
    : wireMode
      ? "crosshair"
      : activeComponentType
        ? "crosshair"
        : dragState.isDragging
          ? "grabbing"
          : isPanning
            ? "grabbing"
            : spaceHeld
              ? "grab"
              : editMode
                ? "move"
                : "default";

  const zoomPct = Math.round(zoomLevel * 100);

  // Selected component's grid position
  const selectedComp =
    selectedId !== null
      ? placedComponents.find((c) => c.id === selectedId)
      : null;

  // Compute edge label input position in screen space for the overlay
  const edgeLabelScreenPos = (() => {
    if (!pendingEdgeLabel || pendingEdgeLabel.wireId === -1 || !svgRef.current)
      return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scrollEl = scrollContainerRef.current;
    const scrollLeft = scrollEl?.scrollLeft ?? 0;
    const scrollTop = scrollEl?.scrollTop ?? 0;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;
    const screenX =
      rect.left -
      containerRect.left +
      pendingEdgeLabel.x * zoomLevel -
      scrollLeft;
    const screenY =
      rect.top - containerRect.top + pendingEdgeLabel.y * zoomLevel - scrollTop;
    return { x: screenX, y: screenY };
  })();

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{
        background: "oklch(0.12 0.01 160)",
        outline: eraserMode
          ? "2px solid oklch(0.60 0.22 25)"
          : editMode
            ? "2px solid oklch(0.72 0.16 85)"
            : wireMode
              ? "2px solid oklch(0.65 0.18 140)"
              : "2px solid transparent",
        outlineOffset: "-2px",
        transition: "outline-color 0.2s ease",
      }}
    >
      {/* Edit mode badge */}
      {editMode && (
        <div
          className="absolute top-2 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono select-none pointer-events-none"
          style={{
            background: "oklch(0.72 0.16 85)",
            color: "oklch(0.12 0.01 160)",
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          ✎ EDIT MODE
        </div>
      )}

      {/* Wire mode badge */}
      {wireMode && (
        <div
          className="absolute top-2 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono select-none pointer-events-none"
          style={{
            background: "oklch(0.65 0.18 140)",
            color: "oklch(0.98 0.01 160)",
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          ⚡ WIRE MODE
          {wireDrawing?.active ? " — click end point" : " — click start point"}
        </div>
      )}

      {/* Eraser mode badge */}
      {eraserMode && (
        <div
          className="absolute top-2 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono select-none pointer-events-none"
          style={{
            background: "oklch(0.60 0.22 25)",
            color: "oklch(0.98 0 0)",
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          ✕ ERASER MODE — click component or wire to delete
        </div>
      )}

      {/* Edge label input overlay */}
      {pendingEdgeLabel &&
        pendingEdgeLabel.wireId !== -1 &&
        edgeLabelScreenPos && (
          <div
            className="absolute z-30 flex flex-col gap-1"
            style={{
              left: Math.max(4, Math.min(edgeLabelScreenPos.x - 60, 800)),
              top: Math.max(4, edgeLabelScreenPos.y + 8),
              pointerEvents: "auto",
            }}
          >
            <div
              className="flex gap-1 items-center rounded px-2 py-1.5"
              style={{
                background: "oklch(0.17 0.01 160)",
                border: "1px solid oklch(0.65 0.18 140)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              <span
                className="text-xs font-mono whitespace-nowrap"
                style={{ color: "oklch(0.65 0.18 140)" }}
              >
                Label:
              </span>
              <input
                // biome-ignore lint/a11y/noAutofocus: wire label input needs immediate focus for UX
                autoFocus
                value={edgeLabelInput}
                onChange={(e) => setEdgeLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEdgeLabelSubmit();
                  if (e.key === "Escape") {
                    setPendingEdgeLabel(null);
                    setEdgeLabelInput("");
                  }
                }}
                placeholder="e.g. VCC, GND"
                className="text-xs font-mono w-28 px-1.5 py-0.5 rounded outline-none"
                style={{
                  background: "oklch(0.22 0.01 160)",
                  border: "1px solid oklch(0.35 0.02 160)",
                  color: "oklch(0.95 0.01 160)",
                }}
              />
              <button
                type="button"
                onClick={handleEdgeLabelSubmit}
                className="text-xs font-mono px-2 py-0.5 rounded transition-colors"
                style={{
                  background: "oklch(0.65 0.18 140)",
                  color: "oklch(0.98 0.01 160)",
                }}
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingEdgeLabel(null);
                  setEdgeLabelInput("");
                }}
                className="text-xs font-mono px-1.5 py-0.5 rounded transition-colors"
                style={{
                  background: "oklch(0.22 0.01 160)",
                  border: "1px solid oklch(0.35 0.02 160)",
                  color: "oklch(0.65 0.02 160)",
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

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
          {selectedId !== null &&
            !activeComponentType &&
            !editMode &&
            !wireMode && (
              <span className="text-amber-DEFAULT bg-charcoal-DEFAULT px-2 py-0.5 rounded border border-amber-DEFAULT/30 pointer-events-none">
                R = Rotate · Del = Delete · Drag to move
              </span>
            )}
          {selectedId !== null && !activeComponentType && editMode && (
            <span
              className="px-2 py-0.5 rounded border pointer-events-none font-mono text-xs"
              style={{
                background: "oklch(0.22 0.05 85)",
                borderColor: "oklch(0.72 0.16 85)",
                color: "oklch(0.72 0.16 85)",
              }}
            >
              Click ↻ to rotate · Del = Delete · Free drag active
            </span>
          )}
          {selectedWireId !== null && (
            <span
              className="px-2 py-0.5 rounded border pointer-events-none font-mono text-xs"
              style={{
                background: "oklch(0.18 0.05 140)",
                borderColor: "oklch(0.65 0.18 140)",
                color: "oklch(0.65 0.18 140)",
              }}
            >
              Del = Delete wire
            </span>
          )}
          <span className="text-muted-foreground pointer-events-none">
            {placedComponents.length} component
            {placedComponents.length !== 1 ? "s" : ""}
            {placedWires.length > 0 &&
              ` · ${placedWires.length} wire${placedWires.length !== 1 ? "s" : ""}`}
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
        style={{ touchAction: "pan-x pan-y" }}
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
              setWireCursorPos(null);
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

            {/* Wire layer — below components */}
            {renderWires()}

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

            {/* Edit mode per-component rotate button */}
            {renderEditRotateButton()}

            {/* Ghost preview */}
            {renderGhost()}
          </svg>
        </div>
      </div>
    </div>
  );
}

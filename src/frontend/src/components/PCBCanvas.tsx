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

interface DragState {
  isDragging: boolean;
  componentId: number | null;
  startMouseX: number;
  startMouseY: number;
  startCompX: number;
  startCompY: number;
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
  } = usePCBCanvas();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [_panStart, setPanStart] = useState({ x: 0, y: 0 });

  const snapToGrid = useCallback((px: number, py: number) => {
    return {
      x: Math.floor(px / GRID_SIZE),
      y: Math.floor(py / GRID_SIZE),
    };
  }, []);

  const getSVGCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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
        deleteSelected();
      }
      if (e.key === "Escape") {
        setActiveComponentType(null);
        selectComponent(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rotateSelected, deleteSelected, setActiveComponentType, selectComponent]);

  const handleSVGMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const coords = getSVGCoords(e);

      if (isPanning) {
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

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
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleComponentMouseDown = useCallback(
    (e: React.MouseEvent, component: PlacedComponent) => {
      if (activeComponentType) return;
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

  const cursorStyle = activeComponentType
    ? "crosshair"
    : dragState.isDragging
      ? "grabbing"
      : isPanning
        ? "grab"
        : "default";

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{ background: "oklch(0.12 0.01 160)" }}
    >
      {/* Canvas info bar */}
      <div className="absolute top-2 right-3 z-10 flex items-center gap-3 text-xs font-mono opacity-60 select-none pointer-events-none">
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

      {/* SVG Canvas */}
      <div className="w-full h-full overflow-auto scrollbar-thin">
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
                <circle cx={cx} cy={cy} r={1.5} fill="rgba(255,255,255,0.3)" />
              </g>
            );
          })}

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
  );
}

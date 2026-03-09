// PCB canvas types - mirrors backend Component and Position types

export interface PCBPosition {
  x: number;
  y: number;
}

export type PCBRotation = 0 | 90 | 180 | 270;

export interface PlacedComponent {
  id: number;
  name: string;
  componentType: string;
  position: PCBPosition;
  rotation: PCBRotation;
}

export interface CanvasState {
  components: PlacedComponent[];
  selectedId: number | null;
  activeComponentType: string | null;
  designName: string;
}

// Grid configuration
export const GRID_SIZE = 24; // pixels per grid cell
export const GRID_COLS = 60;
export const GRID_ROWS = 40;
export const CANVAS_WIDTH = GRID_SIZE * GRID_COLS;
export const CANVAS_HEIGHT = GRID_SIZE * GRID_ROWS;

// Component categories and types
export type ComponentCategory =
  | "Passives"
  | "Semiconductors"
  | "ICs"
  | "Connectors";

export interface ComponentLibraryItem {
  id: string;
  name: string;
  category: ComponentCategory;
  symbol: string; // SVG path or identifier for rendering
  width: number; // grid cells wide
  height: number; // grid cells tall
  color: string; // component body color for canvas rendering
}

// Wire types
export interface PlacedWire {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  label: string; // empty string = no label
  isEdgeTerminated: boolean; // true if end point is on canvas edge
  edgeSide: "top" | "bottom" | "left" | "right" | null;
}

export const WIRE_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Black", value: "#1a1a1a" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Blue", value: "#3b82f6" },
  { name: "White", value: "#f5f5f5" },
] as const;

import type React from "react";
import { createContext, useCallback, useContext, useReducer } from "react";
import type {
  PCBPosition,
  PCBRotation,
  PlacedComponent,
  PlacedWire,
} from "../types/pcb";

export interface BoardSize {
  label: string;
  widthMm: number;
  heightMm: number;
}

interface PCBCanvasState {
  placedComponents: PlacedComponent[];
  selectedId: number | null;
  activeComponentType: string | null;
  designName: string;
  nextId: number;
  boardSize: BoardSize | null;
  editMode: boolean;
  // Wire state
  placedWires: PlacedWire[];
  nextWireId: number;
  wireMode: boolean;
  activeWireColor: string;
  selectedWireId: number | null;
  // Eraser mode
  eraserMode: boolean;
}

type PCBCanvasAction =
  | { type: "ADD_COMPONENT"; payload: Omit<PlacedComponent, "id"> }
  | { type: "UPDATE_COMPONENT"; payload: { id: number; position: PCBPosition } }
  | { type: "ROTATE_COMPONENT"; payload: { id: number } }
  | { type: "REMOVE_COMPONENT"; payload: { id: number } }
  | { type: "SELECT_COMPONENT"; payload: { id: number | null } }
  | { type: "SET_ACTIVE_TYPE"; payload: { type: string | null } }
  | { type: "SET_DESIGN_NAME"; payload: { name: string } }
  | {
      type: "LOAD_DESIGN";
      payload: { components: PlacedComponent[]; name: string };
    }
  | { type: "CLEAR_CANVAS" }
  | { type: "SET_BOARD_SIZE"; payload: { boardSize: BoardSize | null } }
  | { type: "SET_EDIT_MODE"; payload: { value: boolean } }
  // Wire actions
  | { type: "ADD_WIRE"; payload: Omit<PlacedWire, "id"> }
  | { type: "REMOVE_WIRE"; payload: { id: number } }
  | { type: "SELECT_WIRE"; payload: { id: number | null } }
  | { type: "SET_WIRE_MODE"; payload: { value: boolean } }
  | { type: "SET_ACTIVE_WIRE_COLOR"; payload: { color: string } }
  | { type: "LOAD_WIRES"; payload: { wires: PlacedWire[] } }
  | { type: "CLEAR_WIRES" }
  // Eraser action
  | { type: "SET_ERASER_MODE"; payload: { value: boolean } }
  // Undo
  | { type: "UNDO" };

// Actions that push a snapshot to history (undoable)
const UNDOABLE_ACTIONS = new Set([
  "ADD_COMPONENT",
  "UPDATE_COMPONENT",
  "ROTATE_COMPONENT",
  "REMOVE_COMPONENT",
  "ADD_WIRE",
  "REMOVE_WIRE",
  "LOAD_DESIGN",
  "LOAD_WIRES",
  "CLEAR_CANVAS",
  "CLEAR_WIRES",
]);

const MAX_HISTORY = 50;

interface HistoryState {
  past: PCBCanvasState[];
  present: PCBCanvasState;
}

function presentReducer(
  state: PCBCanvasState,
  action: PCBCanvasAction,
): PCBCanvasState {
  switch (action.type) {
    case "ADD_COMPONENT": {
      const newComponent: PlacedComponent = {
        ...action.payload,
        id: state.nextId,
      };
      return {
        ...state,
        placedComponents: [...state.placedComponents, newComponent],
        nextId: state.nextId + 1,
        selectedId: newComponent.id,
      };
    }
    case "UPDATE_COMPONENT": {
      return {
        ...state,
        placedComponents: state.placedComponents.map((c) =>
          c.id === action.payload.id
            ? { ...c, position: action.payload.position }
            : c,
        ),
      };
    }
    case "ROTATE_COMPONENT": {
      return {
        ...state,
        placedComponents: state.placedComponents.map((c) => {
          if (c.id !== action.payload.id) return c;
          const nextRotation = ((c.rotation + 90) % 360) as PCBRotation;
          return { ...c, rotation: nextRotation };
        }),
      };
    }
    case "REMOVE_COMPONENT": {
      return {
        ...state,
        placedComponents: state.placedComponents.filter(
          (c) => c.id !== action.payload.id,
        ),
        selectedId:
          state.selectedId === action.payload.id ? null : state.selectedId,
      };
    }
    case "SELECT_COMPONENT": {
      return { ...state, selectedId: action.payload.id };
    }
    case "SET_ACTIVE_TYPE": {
      return {
        ...state,
        activeComponentType: action.payload.type,
        selectedId: null,
      };
    }
    case "SET_DESIGN_NAME": {
      return { ...state, designName: action.payload.name };
    }
    case "LOAD_DESIGN": {
      const maxId = action.payload.components.reduce(
        (max, c) => Math.max(max, c.id),
        0,
      );
      return {
        ...state,
        placedComponents: action.payload.components,
        designName: action.payload.name,
        selectedId: null,
        activeComponentType: null,
        nextId: maxId + 1,
      };
    }
    case "CLEAR_CANVAS": {
      return {
        ...state,
        placedComponents: [],
        selectedId: null,
        activeComponentType: null,
        designName: "Untitled Board",
        nextId: 1,
        placedWires: [],
        nextWireId: 1,
        selectedWireId: null,
        wireMode: false,
        eraserMode: false,
      };
    }
    case "SET_BOARD_SIZE": {
      return { ...state, boardSize: action.payload.boardSize };
    }
    case "SET_EDIT_MODE": {
      return { ...state, editMode: action.payload.value };
    }
    // Wire cases
    case "ADD_WIRE": {
      const newWire: PlacedWire = {
        ...action.payload,
        id: state.nextWireId,
      };
      return {
        ...state,
        placedWires: [...state.placedWires, newWire],
        nextWireId: state.nextWireId + 1,
        selectedWireId: newWire.id,
      };
    }
    case "REMOVE_WIRE": {
      return {
        ...state,
        placedWires: state.placedWires.filter(
          (w) => w.id !== action.payload.id,
        ),
        selectedWireId:
          state.selectedWireId === action.payload.id
            ? null
            : state.selectedWireId,
      };
    }
    case "SELECT_WIRE": {
      return { ...state, selectedWireId: action.payload.id };
    }
    case "SET_WIRE_MODE": {
      return {
        ...state,
        wireMode: action.payload.value,
        // Deactivate component placement when wire mode is on
        activeComponentType: action.payload.value
          ? null
          : state.activeComponentType,
        selectedId: null,
        selectedWireId: null,
        // Turn off eraser when wire mode activates
        eraserMode: action.payload.value ? false : state.eraserMode,
      };
    }
    case "SET_ACTIVE_WIRE_COLOR": {
      return { ...state, activeWireColor: action.payload.color };
    }
    case "LOAD_WIRES": {
      const maxWireId = action.payload.wires.reduce(
        (max, w) => Math.max(max, w.id),
        0,
      );
      return {
        ...state,
        placedWires: action.payload.wires,
        nextWireId: maxWireId + 1,
        selectedWireId: null,
      };
    }
    case "CLEAR_WIRES": {
      return {
        ...state,
        placedWires: [],
        nextWireId: 1,
        selectedWireId: null,
      };
    }
    case "SET_ERASER_MODE": {
      return {
        ...state,
        eraserMode: action.payload.value,
        // Turn off wire mode when eraser activates
        wireMode: action.payload.value ? false : state.wireMode,
      };
    }
    default:
      return state;
  }
}

function historyReducer(
  historyState: HistoryState,
  action: PCBCanvasAction,
): HistoryState {
  if (action.type === "UNDO") {
    if (historyState.past.length === 0) return historyState;
    const previous = historyState.past[historyState.past.length - 1];
    const newPast = historyState.past.slice(0, -1);
    return {
      past: newPast,
      present: previous,
    };
  }

  const newPresent = presentReducer(historyState.present, action);

  // Non-undoable actions: just update present without pushing history
  if (!UNDOABLE_ACTIONS.has(action.type)) {
    return { ...historyState, present: newPresent };
  }

  // Undoable action: push current present to past
  const newPast = [
    ...historyState.past.slice(-(MAX_HISTORY - 1)),
    historyState.present,
  ];

  return {
    past: newPast,
    present: newPresent,
  };
}

const initialState: PCBCanvasState = {
  placedComponents: [],
  selectedId: null,
  activeComponentType: null,
  designName: "Untitled Board",
  nextId: 1,
  boardSize: null,
  editMode: false,
  // Wire state defaults
  placedWires: [],
  nextWireId: 1,
  wireMode: false,
  activeWireColor: "#ef4444",
  selectedWireId: null,
  // Eraser mode default
  eraserMode: false,
};

const initialHistoryState: HistoryState = {
  past: [],
  present: initialState,
};

interface PCBCanvasContextValue extends PCBCanvasState {
  addComponent: (component: Omit<PlacedComponent, "id">) => void;
  updateComponent: (id: number, position: PCBPosition) => void;
  rotateComponent: (id: number) => void;
  removeComponent: (id: number) => void;
  selectComponent: (id: number | null) => void;
  setActiveComponentType: (type: string | null) => void;
  setDesignName: (name: string) => void;
  loadDesign: (components: PlacedComponent[], name: string) => void;
  clearCanvas: () => void;
  rotateSelected: () => void;
  deleteSelected: () => void;
  setBoardSize: (size: BoardSize | null) => void;
  setEditMode: (value: boolean) => void;
  // Wire actions
  addWire: (wire: Omit<PlacedWire, "id">) => void;
  removeWire: (id: number) => void;
  selectWire: (id: number | null) => void;
  setWireMode: (value: boolean) => void;
  setActiveWireColor: (color: string) => void;
  loadWires: (wires: PlacedWire[]) => void;
  clearWires: () => void;
  // Eraser
  setEraserMode: (value: boolean) => void;
  // Undo
  undo: () => void;
  canUndo: boolean;
}

const PCBCanvasContext = createContext<PCBCanvasContextValue | undefined>(
  undefined,
);

export function PCBCanvasProvider({ children }: { children: React.ReactNode }) {
  const [historyState, dispatch] = useReducer(
    historyReducer,
    initialHistoryState,
  );

  const state = historyState.present;
  const canUndo = historyState.past.length > 0;

  const addComponent = useCallback((component: Omit<PlacedComponent, "id">) => {
    dispatch({ type: "ADD_COMPONENT", payload: component });
  }, []);

  const updateComponent = useCallback((id: number, position: PCBPosition) => {
    dispatch({ type: "UPDATE_COMPONENT", payload: { id, position } });
  }, []);

  const rotateComponent = useCallback((id: number) => {
    dispatch({ type: "ROTATE_COMPONENT", payload: { id } });
  }, []);

  const removeComponent = useCallback((id: number) => {
    dispatch({ type: "REMOVE_COMPONENT", payload: { id } });
  }, []);

  const selectComponent = useCallback((id: number | null) => {
    dispatch({ type: "SELECT_COMPONENT", payload: { id } });
  }, []);

  const setActiveComponentType = useCallback((type: string | null) => {
    dispatch({ type: "SET_ACTIVE_TYPE", payload: { type } });
  }, []);

  const setDesignName = useCallback((name: string) => {
    dispatch({ type: "SET_DESIGN_NAME", payload: { name } });
  }, []);

  const loadDesign = useCallback(
    (components: PlacedComponent[], name: string) => {
      dispatch({ type: "LOAD_DESIGN", payload: { components, name } });
    },
    [],
  );

  const clearCanvas = useCallback(() => {
    dispatch({ type: "CLEAR_CANVAS" });
  }, []);

  const rotateSelected = useCallback(() => {
    if (state.selectedId !== null) {
      dispatch({ type: "ROTATE_COMPONENT", payload: { id: state.selectedId } });
    }
  }, [state.selectedId]);

  const deleteSelected = useCallback(() => {
    if (state.selectedId !== null) {
      dispatch({ type: "REMOVE_COMPONENT", payload: { id: state.selectedId } });
    }
  }, [state.selectedId]);

  const setBoardSize = useCallback((size: BoardSize | null) => {
    dispatch({ type: "SET_BOARD_SIZE", payload: { boardSize: size } });
  }, []);

  const setEditMode = useCallback((value: boolean) => {
    dispatch({ type: "SET_EDIT_MODE", payload: { value } });
  }, []);

  const addWire = useCallback((wire: Omit<PlacedWire, "id">) => {
    dispatch({ type: "ADD_WIRE", payload: wire });
  }, []);

  const removeWire = useCallback((id: number) => {
    dispatch({ type: "REMOVE_WIRE", payload: { id } });
  }, []);

  const selectWire = useCallback((id: number | null) => {
    dispatch({ type: "SELECT_WIRE", payload: { id } });
  }, []);

  const setWireMode = useCallback((value: boolean) => {
    dispatch({ type: "SET_WIRE_MODE", payload: { value } });
  }, []);

  const setActiveWireColor = useCallback((color: string) => {
    dispatch({ type: "SET_ACTIVE_WIRE_COLOR", payload: { color } });
  }, []);

  const loadWires = useCallback((wires: PlacedWire[]) => {
    dispatch({ type: "LOAD_WIRES", payload: { wires } });
  }, []);

  const clearWires = useCallback(() => {
    dispatch({ type: "CLEAR_WIRES" });
  }, []);

  const setEraserMode = useCallback((value: boolean) => {
    dispatch({ type: "SET_ERASER_MODE", payload: { value } });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  return (
    <PCBCanvasContext.Provider
      value={{
        ...state,
        addComponent,
        updateComponent,
        rotateComponent,
        removeComponent,
        selectComponent,
        setActiveComponentType,
        setDesignName,
        loadDesign,
        clearCanvas,
        rotateSelected,
        deleteSelected,
        setBoardSize,
        setEditMode,
        addWire,
        removeWire,
        selectWire,
        setWireMode,
        setActiveWireColor,
        loadWires,
        clearWires,
        setEraserMode,
        undo,
        canUndo,
      }}
    >
      {children}
    </PCBCanvasContext.Provider>
  );
}

export function usePCBCanvas() {
  const ctx = useContext(PCBCanvasContext);
  if (!ctx)
    throw new Error("usePCBCanvas must be used within PCBCanvasProvider");
  return ctx;
}

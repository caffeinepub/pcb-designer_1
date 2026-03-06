import type React from "react";
import { createContext, useCallback, useContext, useReducer } from "react";
import type { PCBPosition, PCBRotation, PlacedComponent } from "../types/pcb";

interface PCBCanvasState {
  placedComponents: PlacedComponent[];
  selectedId: number | null;
  activeComponentType: string | null;
  designName: string;
  nextId: number;
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
  | { type: "CLEAR_CANVAS" };

function reducer(
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
      };
    }
    default:
      return state;
  }
}

const initialState: PCBCanvasState = {
  placedComponents: [],
  selectedId: null,
  activeComponentType: null,
  designName: "Untitled Board",
  nextId: 1,
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
}

const PCBCanvasContext = createContext<PCBCanvasContextValue | undefined>(
  undefined,
);

export function PCBCanvasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

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

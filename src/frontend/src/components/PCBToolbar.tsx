import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cpu,
  Eraser,
  FilePlus,
  FolderOpen,
  LayoutTemplate,
  Minus,
  Pencil,
  PencilOff,
  RotateCw,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { Component, PCBDesign } from "../backend";
import { getComponentById } from "../constants/componentLibrary";
import type { BoardSize } from "../contexts/PCBCanvasContext";
import { usePCBCanvas } from "../contexts/PCBCanvasContext";
import { useSaveDesign } from "../hooks/useQueries";
import { type PlacedWire, WIRE_COLORS } from "../types/pcb";
import LoadDesignsModal from "./LoadDesignsModal";
import TemplatesModal from "./TemplatesModal";

const WIRE_ENCODE_PREFIX = "__wire__:";
// Separator used to store componentType alongside the display name in the backend
// Format: "<componentType>|<displayName>"
const COMP_TYPE_SEPARATOR = "|";

const UK_BOARD_SIZES: (BoardSize & { value: string })[] = [
  { value: "none", label: "No Board Size", widthMm: 0, heightMm: 0 },
  {
    value: "eurocard",
    label: "100×160mm (Eurocard)",
    widthMm: 100,
    heightMm: 160,
  },
  {
    value: "half-euro",
    label: "100×80mm (Half Euro)",
    widthMm: 100,
    heightMm: 80,
  },
  {
    value: "arduino-uno",
    label: "68.6×53.3mm (Arduino Uno)",
    widthMm: 68.6,
    heightMm: 53.3,
  },
  {
    value: "raspberry-pi",
    label: "65×56mm (Raspberry Pi)",
    widthMm: 65,
    heightMm: 56,
  },
  {
    value: "proto-100",
    label: "100×100mm (Proto)",
    widthMm: 100,
    heightMm: 100,
  },
  {
    value: "mini-proto",
    label: "50×50mm (Mini Proto)",
    widthMm: 50,
    heightMm: 50,
  },
  {
    value: "double-euro",
    label: "160×100mm (Double Euro)",
    widthMm: 160,
    heightMm: 100,
  },
  { value: "custom", label: "Custom...", widthMm: -1, heightMm: -1 },
];

export default function PCBToolbar() {
  const {
    placedComponents,
    designName,
    setDesignName,
    selectedId,
    rotateSelected,
    deleteSelected,
    loadDesign,
    clearCanvas,
    activeComponentType,
    setActiveComponentType,
    setBoardSize,
    editMode,
    setEditMode,
    // Wire
    placedWires,
    wireMode,
    activeWireColor,
    setWireMode,
    setActiveWireColor,
    loadWires,
    // Eraser
    eraserMode,
    setEraserMode,
    // Undo
    undo,
    canUndo,
  } = usePCBCanvas();

  const saveDesignMutation = useSaveDesign();
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [selectedBoardValue, setSelectedBoardValue] = useState("none");
  const [customWidth, setCustomWidth] = useState("100");
  const [customHeight, setCustomHeight] = useState("100");

  const handleSave = async () => {
    if (!designName.trim()) {
      toast.error("Please enter a design name");
      return;
    }

    const components: Component[] = placedComponents.map((c) => ({
      id: BigInt(c.id),
      // Encode componentType + display name together so it survives round-trip
      name: `${c.componentType}${COMP_TYPE_SEPARATOR}${c.name}`,
      position: { x: c.position.x, y: c.position.y },
      rotation: BigInt(c.rotation),
    }));

    // Encode wires as special Component entries
    const wireComponents: Component[] = placedWires.map((w) => ({
      id: BigInt(w.id),
      name: `${WIRE_ENCODE_PREFIX}${JSON.stringify({
        id: w.id,
        startX: w.startX,
        startY: w.startY,
        endX: w.endX,
        endY: w.endY,
        color: w.color,
        label: w.label,
        isEdgeTerminated: w.isEdgeTerminated,
        edgeSide: w.edgeSide,
      })}`,
      position: { x: 0, y: 0 },
      rotation: BigInt(0),
    }));

    const design: PCBDesign = {
      name: designName.trim(),
      components: [...components, ...wireComponents],
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    };

    try {
      await saveDesignMutation.mutateAsync(design);
      toast.success(`Saved "${designName}"`);
    } catch {
      toast.error("Failed to save design");
    }
  };

  const handleLoadComplete = (design: PCBDesign) => {
    // Split components and wires
    const regularComponents = design.components.filter(
      (c) => !c.name.startsWith(WIRE_ENCODE_PREFIX),
    );
    const wireEntries = design.components.filter((c) =>
      c.name.startsWith(WIRE_ENCODE_PREFIX),
    );

    const components = regularComponents.map((c) => {
      // New format: "<componentType>|<displayName>"
      // Legacy format (no separator): try matching by name directly
      const sepIdx = c.name.indexOf(COMP_TYPE_SEPARATOR);
      let componentType: string;
      let displayName: string;

      if (sepIdx !== -1) {
        // New encoded format — extract both fields reliably
        componentType = c.name.slice(0, sepIdx);
        displayName = c.name.slice(sepIdx + COMP_TYPE_SEPARATOR.length);
      } else {
        // Legacy: try to resolve via name lookup as before
        const legacyLib =
          getComponentById(c.name.toLowerCase()) || getComponentById(c.name);
        componentType = legacyLib?.id ?? c.name;
        displayName = c.name;
      }

      // Ensure we have a valid library item; fall back gracefully
      const libItem = getComponentById(componentType) || {
        id: componentType,
        name: displayName,
        category: "ICs" as const,
        symbol: displayName,
        width: 2,
        height: 2,
        color: "#888",
      };

      return {
        id: Number(c.id),
        componentType: libItem.id,
        name: displayName,
        position: { x: c.position.x, y: c.position.y },
        rotation: (Number(c.rotation) % 360) as 0 | 90 | 180 | 270,
      };
    });

    // Decode wires
    const decodedWires: PlacedWire[] = [];
    for (const entry of wireEntries) {
      try {
        const jsonStr = entry.name.slice(WIRE_ENCODE_PREFIX.length);
        const wireData = JSON.parse(jsonStr) as PlacedWire;
        decodedWires.push(wireData);
      } catch {
        // Skip malformed wire entries
      }
    }

    loadDesign(components, design.name);
    if (decodedWires.length > 0) {
      loadWires(decodedWires);
    }
  };

  const handleBoardSizeChange = (value: string) => {
    setSelectedBoardValue(value);
    if (value === "none") {
      setBoardSize(null);
      return;
    }
    if (value === "custom") {
      // Custom: apply current custom dimensions
      const w = Number.parseFloat(customWidth) || 100;
      const h = Number.parseFloat(customHeight) || 100;
      setBoardSize({ label: `${w}×${h}mm`, widthMm: w, heightMm: h });
      return;
    }
    const found = UK_BOARD_SIZES.find((s) => s.value === value);
    if (found) {
      setBoardSize({
        label: found.label,
        widthMm: found.widthMm,
        heightMm: found.heightMm,
      });
    }
  };

  const applyCustomSize = () => {
    const w = Number.parseFloat(customWidth) || 100;
    const h = Number.parseFloat(customHeight) || 100;
    if (w > 0 && h > 0) {
      setBoardSize({ label: `${w}×${h}mm`, widthMm: w, heightMm: h });
    }
  };

  return (
    <header
      className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-2 border-b border-border flex-shrink-0 overflow-x-auto"
      style={{ background: "oklch(0.14 0.01 160)", scrollbarWidth: "none" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-1 md:mr-3 flex-shrink-0">
        <Cpu
          className="w-5 h-5 flex-shrink-0"
          style={{ color: "oklch(0.72 0.16 85)" }}
        />
        <span
          className="text-sm font-semibold font-sans tracking-wide hidden lg:block"
          style={{ color: "oklch(0.72 0.16 85)" }}
        >
          PCB Studio
        </span>
      </div>

      <div className="w-px h-6 bg-border mx-0.5 flex-shrink-0" />

      {/* Design name */}
      <Input
        value={designName}
        onChange={(e) => setDesignName(e.target.value)}
        placeholder="Design name..."
        className="h-9 md:h-8 w-32 md:w-44 text-xs font-mono border-border bg-input focus:border-amber-DEFAULT/60 flex-shrink-0"
        style={{
          background: "oklch(0.20 0.01 160)",
          color: "oklch(0.95 0.02 160)",
        }}
      />

      {/* Save */}
      <Button
        data-ocid="toolbar.save_button"
        size="sm"
        onClick={handleSave}
        disabled={saveDesignMutation.isPending}
        className="h-9 md:h-8 px-3 text-xs font-mono gap-1.5 flex-shrink-0"
        style={{
          background: "oklch(0.72 0.16 85)",
          color: "oklch(0.12 0.01 160)",
        }}
      >
        <Save className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {saveDesignMutation.isPending ? "Saving..." : "Save"}
        </span>
      </Button>

      {/* Load */}
      <Button
        data-ocid="toolbar.load_button"
        size="sm"
        variant="outline"
        onClick={() => setLoadModalOpen(true)}
        className="h-9 md:h-8 px-3 text-xs font-mono gap-1.5 border-border hover:border-amber-DEFAULT/50 flex-shrink-0"
        style={{
          background: "oklch(0.20 0.01 160)",
          color: "oklch(0.88 0.04 160)",
        }}
      >
        <FolderOpen className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Load</span>
      </Button>

      {/* Templates */}
      <Button
        data-ocid="toolbar.templates_button"
        size="sm"
        variant="outline"
        onClick={() => setTemplatesModalOpen(true)}
        className="h-9 md:h-8 px-3 text-xs font-mono gap-1.5 border-border hover:border-amber-DEFAULT/50 flex-shrink-0"
        style={{
          background: "oklch(0.20 0.01 160)",
          color: "oklch(0.88 0.04 160)",
        }}
      >
        <LayoutTemplate className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Templates</span>
      </Button>

      {/* Board Size Selector */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Select
          value={selectedBoardValue}
          onValueChange={handleBoardSizeChange}
        >
          <SelectTrigger
            data-ocid="toolbar.board_size_select"
            className="h-9 md:h-8 w-36 md:w-48 text-xs font-mono border-border focus:ring-1 focus:ring-amber-DEFAULT/60"
            style={{
              background: "oklch(0.20 0.01 160)",
              color: "oklch(0.88 0.04 160)",
              borderColor: "oklch(0.28 0.02 160)",
            }}
          >
            <SelectValue placeholder="Board size..." />
          </SelectTrigger>
          <SelectContent
            style={{
              background: "oklch(0.17 0.01 160)",
              borderColor: "oklch(0.28 0.02 160)",
              color: "oklch(0.88 0.04 160)",
            }}
          >
            {UK_BOARD_SIZES.map((size) => (
              <SelectItem
                key={size.value}
                value={size.value}
                className="text-xs font-mono focus:bg-white/10"
                style={{ color: "oklch(0.88 0.04 160)" }}
              >
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Custom size inputs — only shown when custom is selected */}
        {selectedBoardValue === "custom" && (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              onBlur={applyCustomSize}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCustomSize();
              }}
              placeholder="W"
              className="h-9 md:h-8 w-14 text-xs font-mono border-border text-center"
              style={{
                background: "oklch(0.20 0.01 160)",
                color: "oklch(0.88 0.04 160)",
                borderColor: "oklch(0.28 0.02 160)",
              }}
              title="Width in mm"
              min="1"
              max="500"
            />
            <span
              className="text-xs font-mono flex-shrink-0"
              style={{ color: "oklch(0.55 0.02 160)" }}
            >
              ×
            </span>
            <Input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              onBlur={applyCustomSize}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCustomSize();
              }}
              placeholder="H"
              className="h-9 md:h-8 w-14 text-xs font-mono border-border text-center"
              style={{
                background: "oklch(0.20 0.01 160)",
                color: "oklch(0.88 0.04 160)",
                borderColor: "oklch(0.28 0.02 160)",
              }}
              title="Height in mm"
              min="1"
              max="500"
            />
            <span
              className="text-xs font-mono flex-shrink-0"
              style={{ color: "oklch(0.55 0.02 160)" }}
            >
              mm
            </span>
          </div>
        )}
      </div>

      {/* New Board */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            data-ocid="toolbar.new_button"
            size="sm"
            variant="outline"
            className="h-9 md:h-8 px-3 text-xs font-mono gap-1.5 border-border hover:border-amber-DEFAULT/50 flex-shrink-0"
            style={{
              background: "oklch(0.20 0.01 160)",
              color: "oklch(0.88 0.04 160)",
            }}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent
          className="w-[90vw] max-w-md"
          style={{
            background: "oklch(0.17 0.01 160)",
            borderColor: "oklch(0.28 0.02 160)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">New Board</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              This will clear the current canvas. Any unsaved changes will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border text-sm"
              style={{
                background: "oklch(0.20 0.01 160)",
                color: "oklch(0.88 0.04 160)",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={clearCanvas}
              className="text-sm"
              style={{
                background: "oklch(0.72 0.16 85)",
                color: "oklch(0.12 0.01 160)",
              }}
            >
              Clear Canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-px h-6 bg-border mx-0.5 flex-shrink-0" />

      {/* Edit mode toggle */}
      <Button
        data-ocid="toolbar.edit_button"
        size="sm"
        variant={editMode ? "default" : "outline"}
        onClick={() => setEditMode(!editMode)}
        className="h-9 md:h-8 px-3 text-xs font-mono gap-1.5 border-border transition-all flex-shrink-0"
        style={
          editMode
            ? {
                background: "oklch(0.72 0.16 85)",
                color: "oklch(0.12 0.01 160)",
                borderColor: "oklch(0.72 0.16 85)",
                fontWeight: 700,
              }
            : {
                background: "oklch(0.20 0.01 160)",
                color: "oklch(0.88 0.04 160)",
              }
        }
        title="Toggle edit mode — freeform drag + stepped rotation"
      >
        {editMode ? (
          <PencilOff className="w-3.5 h-3.5" />
        ) : (
          <Pencil className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">
          {editMode ? "Editing" : "Edit"}
        </span>
      </Button>

      {/* Wire tool toggle */}
      <Button
        data-ocid="toolbar.wire_button"
        size="sm"
        variant={wireMode ? "default" : "outline"}
        onClick={() => setWireMode(!wireMode)}
        className="h-9 md:h-8 px-3 text-xs font-mono gap-1.5 border-border transition-all flex-shrink-0"
        style={
          wireMode
            ? {
                background: "oklch(0.65 0.18 140)",
                color: "oklch(0.98 0.01 160)",
                borderColor: "oklch(0.65 0.18 140)",
                fontWeight: 700,
              }
            : {
                background: "oklch(0.20 0.01 160)",
                color: "oklch(0.88 0.04 160)",
              }
        }
        title="Wire drawing mode — click start then end point"
      >
        <Minus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{wireMode ? "Wiring" : "Wire"}</span>
      </Button>

      {/* Eraser tool toggle */}
      <Button
        data-ocid="toolbar.eraser_button"
        size="sm"
        variant={eraserMode ? "default" : "outline"}
        onClick={() => {
          const next = !eraserMode;
          setEraserMode(next);
          if (next) {
            setWireMode(false);
            setEditMode(false);
          }
        }}
        className="h-9 md:h-8 px-3 text-xs font-mono gap-1.5 border-border transition-all flex-shrink-0"
        style={
          eraserMode
            ? {
                background: "oklch(0.60 0.22 25)",
                color: "oklch(0.98 0 0)",
                borderColor: "oklch(0.60 0.22 25)",
                fontWeight: 700,
              }
            : {
                background: "oklch(0.20 0.01 160)",
                color: "oklch(0.88 0.04 160)",
              }
        }
        title="Eraser — click components or wires to delete"
      >
        <Eraser className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {eraserMode ? "Erasing" : "Eraser"}
        </span>
      </Button>

      {/* Wire colour swatches — only shown when wireMode is active */}
      {wireMode && (
        <div className="flex items-center gap-1 ml-1 flex-shrink-0">
          {WIRE_COLORS.map((color, idx) => (
            <button
              key={color.value}
              type="button"
              data-ocid={`toolbar.wire_color.${idx + 1}`}
              onClick={() => setActiveWireColor(color.value)}
              title={color.name}
              className="rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{
                width: 22,
                height: 22,
                minWidth: 22,
                background: color.value,
                border:
                  activeWireColor === color.value
                    ? "2px solid white"
                    : "2px solid rgba(255,255,255,0.2)",
                boxShadow:
                  activeWireColor === color.value
                    ? "0 0 0 2px rgba(255,255,255,0.4)"
                    : "none",
                flexShrink: 0,
              }}
              aria-label={`Wire colour: ${color.name}`}
              aria-pressed={activeWireColor === color.value}
            />
          ))}
        </div>
      )}

      {/* Component actions (only when something is selected) */}
      <Button
        data-ocid="toolbar.rotate_button"
        size="sm"
        variant="ghost"
        onClick={rotateSelected}
        disabled={selectedId === null}
        className="h-9 md:h-8 px-2.5 text-xs font-mono gap-1.5 disabled:opacity-30 flex-shrink-0"
        style={{ color: "oklch(0.78 0.03 160)" }}
        title="Rotate selected (R)"
      >
        <RotateCw className="w-3.5 h-3.5" />
        <span className="hidden md:inline">
          Rotate
          {editMode && selectedId !== null && (
            <span className="ml-1 opacity-60" style={{ fontSize: "10px" }}>
              or click ↻ on canvas
            </span>
          )}
        </span>
      </Button>

      <Button
        data-ocid="toolbar.delete_button"
        size="sm"
        variant="ghost"
        onClick={deleteSelected}
        disabled={selectedId === null}
        className="h-9 md:h-8 px-2.5 text-xs font-mono gap-1.5 disabled:opacity-30 hover:text-destructive flex-shrink-0"
        style={{ color: "oklch(0.78 0.03 160)" }}
        title="Delete selected (Del)"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Delete</span>
      </Button>

      <Button
        data-ocid="toolbar.undo_button"
        size="sm"
        variant="ghost"
        onClick={undo}
        disabled={!canUndo}
        className="h-9 md:h-8 px-2.5 text-xs font-mono gap-1.5 disabled:opacity-30 flex-shrink-0"
        style={{ color: "oklch(0.78 0.03 160)" }}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Undo</span>
      </Button>

      {/* Cancel placement */}
      {activeComponentType && (
        <>
          <div className="w-px h-6 bg-border mx-0.5 flex-shrink-0" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveComponentType(null)}
            className="h-9 md:h-8 px-3 text-xs font-mono animate-pulse-amber flex-shrink-0"
            style={{ color: "oklch(0.72 0.16 85)" }}
          >
            ESC — Cancel
          </Button>
        </>
      )}

      <LoadDesignsModal
        open={loadModalOpen}
        onOpenChange={setLoadModalOpen}
        onLoadComplete={handleLoadComplete}
      />

      <TemplatesModal
        open={templatesModalOpen}
        onOpenChange={setTemplatesModalOpen}
      />
    </header>
  );
}

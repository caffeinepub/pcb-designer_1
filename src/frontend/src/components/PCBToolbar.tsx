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
  FilePlus,
  FolderOpen,
  LayoutTemplate,
  RotateCw,
  Save,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { Component, PCBDesign } from "../backend";
import { getComponentById } from "../constants/componentLibrary";
import type { BoardSize } from "../contexts/PCBCanvasContext";
import { usePCBCanvas } from "../contexts/PCBCanvasContext";
import { useSaveDesign } from "../hooks/useQueries";
import LoadDesignsModal from "./LoadDesignsModal";
import TemplatesModal from "./TemplatesModal";

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
      name: c.name,
      position: { x: c.position.x, y: c.position.y },
      rotation: BigInt(c.rotation),
    }));

    const design: PCBDesign = {
      name: designName.trim(),
      components,
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
    const components = design.components.map((c) => {
      const libItem = getComponentById(c.name.toLowerCase()) ||
        getComponentById(c.name) || {
          id: c.name,
          name: c.name,
          category: "ICs" as const,
          symbol: c.name,
          width: 2,
          height: 2,
          color: "#888",
        };

      return {
        id: Number(c.id),
        componentType: libItem.id,
        name: c.name,
        position: { x: c.position.x, y: c.position.y },
        rotation: (Number(c.rotation) % 360) as 0 | 90 | 180 | 270,
      };
    });
    loadDesign(components, design.name);
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
      className="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0 flex-wrap"
      style={{ background: "oklch(0.14 0.01 160)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3">
        <Cpu className="w-5 h-5" style={{ color: "oklch(0.72 0.16 85)" }} />
        <span
          className="text-sm font-semibold font-sans tracking-wide hidden sm:block"
          style={{ color: "oklch(0.72 0.16 85)" }}
        >
          PCB Studio
        </span>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Design name */}
      <Input
        value={designName}
        onChange={(e) => setDesignName(e.target.value)}
        placeholder="Design name..."
        className="h-8 w-44 text-xs font-mono border-border bg-input focus:border-amber-DEFAULT/60"
        style={{ background: "oklch(0.20 0.01 160)" }}
      />

      {/* Save */}
      <Button
        data-ocid="toolbar.save_button"
        size="sm"
        onClick={handleSave}
        disabled={saveDesignMutation.isPending}
        className="h-8 px-3 text-xs font-mono gap-1.5"
        style={{
          background: "oklch(0.72 0.16 85)",
          color: "oklch(0.12 0.01 160)",
        }}
      >
        <Save className="w-3.5 h-3.5" />
        {saveDesignMutation.isPending ? "Saving..." : "Save"}
      </Button>

      {/* Load */}
      <Button
        data-ocid="toolbar.load_button"
        size="sm"
        variant="outline"
        onClick={() => setLoadModalOpen(true)}
        className="h-8 px-3 text-xs font-mono gap-1.5 border-border hover:border-amber-DEFAULT/50"
        style={{
          background: "oklch(0.20 0.01 160)",
          color: "oklch(0.88 0.04 160)",
        }}
      >
        <FolderOpen className="w-3.5 h-3.5" />
        Load
      </Button>

      {/* Templates */}
      <Button
        data-ocid="toolbar.templates_button"
        size="sm"
        variant="outline"
        onClick={() => setTemplatesModalOpen(true)}
        className="h-8 px-3 text-xs font-mono gap-1.5 border-border hover:border-amber-DEFAULT/50"
        style={{
          background: "oklch(0.20 0.01 160)",
          color: "oklch(0.88 0.04 160)",
        }}
      >
        <LayoutTemplate className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Templates</span>
      </Button>

      {/* Board Size Selector */}
      <div className="flex items-center gap-1.5">
        <Select
          value={selectedBoardValue}
          onValueChange={handleBoardSizeChange}
        >
          <SelectTrigger
            data-ocid="toolbar.board_size_select"
            className="h-8 w-48 text-xs font-mono border-border focus:ring-1 focus:ring-amber-DEFAULT/60"
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
              className="h-8 w-16 text-xs font-mono border-border text-center"
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
              className="text-xs font-mono"
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
              className="h-8 w-16 text-xs font-mono border-border text-center"
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
              className="text-xs font-mono"
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
            className="h-8 px-3 text-xs font-mono gap-1.5 border-border hover:border-amber-DEFAULT/50"
            style={{
              background: "oklch(0.20 0.01 160)",
              color: "oklch(0.88 0.04 160)",
            }}
          >
            <FilePlus className="w-3.5 h-3.5" />
            New
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent
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

      <div className="w-px h-6 bg-border mx-1" />

      {/* Component actions (only when something is selected) */}
      <Button
        data-ocid="toolbar.rotate_button"
        size="sm"
        variant="ghost"
        onClick={rotateSelected}
        disabled={selectedId === null}
        className="h-8 px-2.5 text-xs font-mono gap-1.5 disabled:opacity-30"
        style={{ color: "oklch(0.78 0.03 160)" }}
        title="Rotate selected (R)"
      >
        <RotateCw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Rotate</span>
      </Button>

      <Button
        data-ocid="toolbar.delete_button"
        size="sm"
        variant="ghost"
        onClick={deleteSelected}
        disabled={selectedId === null}
        className="h-8 px-2.5 text-xs font-mono gap-1.5 disabled:opacity-30 hover:text-destructive"
        style={{ color: "oklch(0.78 0.03 160)" }}
        title="Delete selected (Del)"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Delete</span>
      </Button>

      {/* Cancel placement */}
      {activeComponentType && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveComponentType(null)}
            className="h-8 px-3 text-xs font-mono animate-pulse-amber"
            style={{ color: "oklch(0.72 0.16 85)" }}
          >
            ESC — Cancel Placement
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

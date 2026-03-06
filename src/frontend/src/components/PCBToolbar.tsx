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
import { usePCBCanvas } from "../contexts/PCBCanvasContext";
import { useSaveDesign } from "../hooks/useQueries";
import LoadDesignsModal from "./LoadDesignsModal";
import TemplatesModal from "./TemplatesModal";

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
  } = usePCBCanvas();

  const saveDesignMutation = useSaveDesign();
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

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

  return (
    <header
      className="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0"
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

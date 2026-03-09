import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cpu, LayoutTemplate, Search, Zap } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { TESLA_COIL_TEMPLATE } from "../constants/teslaCoilTemplate";
import { usePCBCanvas } from "../contexts/PCBCanvasContext";
import type { PlacedComponent } from "../types/pcb";

interface Template {
  name: string;
  description: string;
  components: PlacedComponent[];
  icon: React.ReactNode;
  category: string;
}

const TEMPLATES: Template[] = [
  {
    name: TESLA_COIL_TEMPLATE.name,
    description:
      "NE555 astable oscillator driving an NPN power transistor to trigger a high-voltage Tesla coil module. Includes timing potentiometers, bypass capacitors, and screw terminal connectors.",
    components: TESLA_COIL_TEMPLATE.components,
    icon: <Zap className="w-6 h-6" />,
    category: "Oscillators",
  },
];

// Group templates by category
function groupByCategory(templates: Template[]): Map<string, Template[]> {
  const map = new Map<string, Template[]>();
  for (const t of templates) {
    const cat = t.category ?? "General";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(t);
  }
  return map;
}

interface TemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TemplatesModal({
  open,
  onOpenChange,
}: TemplatesModalProps) {
  const { placedComponents, loadDesign } = usePCBCanvas();
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleTemplateClick = (template: Template) => {
    if (placedComponents.length > 0) {
      setPendingTemplate(template);
      setConfirmOpen(true);
    } else {
      applyTemplate(template);
    }
  };

  const applyTemplate = (template: Template) => {
    loadDesign(template.components, template.name);
    onOpenChange(false);
    setConfirmOpen(false);
    setPendingTemplate(null);
  };

  const handleConfirmLoad = () => {
    if (pendingTemplate) {
      applyTemplate(pendingTemplate);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setPendingTemplate(null);
  };

  // Filter templates by search query
  const searchLower = search.toLowerCase().trim();
  const filteredTemplates = searchLower
    ? TEMPLATES.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.components.some((c) =>
            c.componentType.toLowerCase().includes(searchLower),
          ),
      )
    : TEMPLATES;

  const grouped = groupByCategory(filteredTemplates);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v);
          if (!v) setSearch("");
        }}
      >
        <DialogContent
          data-ocid="templates.modal"
          className="w-[92vw] max-w-2xl"
          style={{
            background: "oklch(0.17 0.01 160)",
            borderColor: "oklch(0.28 0.02 160)",
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2 font-mono text-base"
              style={{ color: "oklch(0.88 0.04 160)" }}
            >
              <LayoutTemplate
                className="w-4 h-4"
                style={{ color: "oklch(0.72 0.16 85)" }}
              />
              Design Templates
            </DialogTitle>
          </DialogHeader>

          {/* Search input */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: "oklch(0.50 0.03 160)" }}
            />
            <Input
              data-ocid="templates.search_input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="h-9 md:h-8 pl-8 text-xs font-mono border-border"
              style={{
                background: "oklch(0.20 0.01 160)",
                color: "oklch(0.88 0.04 160)",
                borderColor: "oklch(0.28 0.02 160)",
              }}
            />
          </div>

          {/* Template list grouped by category */}
          <ScrollArea className="max-h-[55vh] md:max-h-[60vh]">
            <div className="space-y-4 pr-1">
              {filteredTemplates.length === 0 && (
                <div
                  data-ocid="templates.empty_state"
                  className="flex flex-col items-center gap-3 py-12"
                  style={{ color: "oklch(0.45 0.03 160)" }}
                >
                  <Cpu className="w-8 h-8 opacity-40" />
                  <p className="text-sm font-mono">
                    No templates match your search.
                  </p>
                </div>
              )}

              {Array.from(grouped.entries()).map(([category, templates]) => (
                <div key={category} className="space-y-2">
                  {/* Category header */}
                  <div
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: "oklch(0.45 0.03 160)" }}
                  >
                    {category}
                  </div>

                  {/* Responsive grid: 1 col on mobile, 2 cols on sm+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map((template, index) => {
                      const uniqueTypes = Array.from(
                        new Set(
                          template.components.map((c) => c.componentType),
                        ),
                      );
                      return (
                        <TemplateCard
                          key={template.name}
                          template={template}
                          index={index}
                          uniqueTypes={uniqueTypes}
                          onLoad={() => handleTemplateClick(template)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              data-ocid="templates.cancel_button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 md:h-8 px-4 text-xs font-mono border-border"
              style={{
                background: "oklch(0.20 0.01 160)",
                color: "oklch(0.88 0.04 160)",
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm overwrite dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          className="w-[90vw] max-w-md"
          style={{
            background: "oklch(0.17 0.01 160)",
            borderColor: "oklch(0.28 0.02 160)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              className="font-mono text-sm"
              style={{ color: "oklch(0.88 0.04 160)" }}
            >
              Load Template?
            </AlertDialogTitle>
            <AlertDialogDescription
              className="font-mono text-xs"
              style={{ color: "oklch(0.55 0.04 160)" }}
            >
              Your current canvas has {placedComponents.length} component
              {placedComponents.length !== 1 ? "s" : ""}. Loading{" "}
              <span style={{ color: "oklch(0.72 0.16 85)" }}>
                &ldquo;{pendingTemplate?.name}&rdquo;
              </span>{" "}
              will replace them. Unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelConfirm}
              className="border-border text-xs font-mono"
              style={{
                background: "oklch(0.20 0.01 160)",
                color: "oklch(0.88 0.04 160)",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLoad}
              className="text-xs font-mono"
              style={{
                background: "oklch(0.72 0.16 85)",
                color: "oklch(0.12 0.01 160)",
              }}
            >
              Load Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Extracted card component for cleanliness
function TemplateCard({
  template,
  index,
  uniqueTypes,
  onLoad,
}: {
  template: Template;
  index: number;
  uniqueTypes: string[];
  onLoad: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      data-ocid={`templates.item.${index + 1}`}
      className="rounded-lg border flex flex-col transition-all overflow-hidden"
      style={{
        background: hovered ? "oklch(0.22 0.015 160)" : "oklch(0.20 0.01 160)",
        borderColor: hovered ? "oklch(0.72 0.16 85)" : "oklch(0.30 0.02 160)",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon area */}
      <div
        className="flex items-center justify-center py-4 md:py-5"
        style={{
          background: hovered ? "oklch(0.24 0.05 85)" : "oklch(0.22 0.03 160)",
          transition: "background 0.15s ease",
        }}
      >
        <div
          className="p-3 rounded-full"
          style={{
            background: hovered
              ? "oklch(0.72 0.16 85)"
              : "oklch(0.28 0.04 160)",
            color: hovered ? "oklch(0.12 0.01 160)" : "oklch(0.72 0.16 85)",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          {template.icon}
        </div>
      </div>

      {/* Card content */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Name + category badge */}
        <div className="flex items-start justify-between gap-1.5">
          <span
            className="text-sm font-semibold font-mono leading-tight"
            style={{ color: "oklch(0.88 0.04 160)" }}
          >
            {template.name}
          </span>
          <span
            className="text-xs font-mono shrink-0 px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{
              background: "oklch(0.24 0.02 85)",
              color: "oklch(0.72 0.16 85)",
            }}
          >
            {template.category}
          </span>
        </div>

        {/* Description */}
        <p
          className="text-xs leading-relaxed font-mono line-clamp-3 flex-1"
          style={{ color: "oklch(0.55 0.04 160)" }}
        >
          {template.description}
        </p>

        {/* Component type chips — show up to 4 */}
        <div className="flex flex-wrap gap-1">
          {uniqueTypes.slice(0, 4).map((type) => (
            <span
              key={type}
              className="text-xs px-1 py-0.5 rounded font-mono"
              style={{
                background: "oklch(0.26 0.02 160)",
                color: "oklch(0.60 0.06 160)",
              }}
            >
              {type}
            </span>
          ))}
          {uniqueTypes.length > 4 && (
            <span
              className="text-xs px-1 py-0.5 rounded font-mono"
              style={{
                background: "oklch(0.26 0.02 160)",
                color: "oklch(0.50 0.04 160)",
              }}
            >
              +{uniqueTypes.length - 4}
            </span>
          )}
        </div>

        {/* Bottom row: component count + Load button */}
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-xs font-mono"
            style={{ color: "oklch(0.50 0.04 160)" }}
          >
            {template.components.length} component
            {template.components.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            data-ocid={`templates.load_button.${index + 1}`}
            onClick={onLoad}
            className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded transition-all"
            style={{
              background: "oklch(0.72 0.16 85)",
              color: "oklch(0.12 0.01 160)",
              fontWeight: 700,
              minHeight: 36,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "oklch(0.78 0.18 85)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "oklch(0.72 0.16 85)";
            }}
          >
            Load →
          </button>
        </div>
      </div>
    </div>
  );
}

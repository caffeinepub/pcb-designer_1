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
import { Cpu, LayoutTemplate, Zap } from "lucide-react";
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
}

const TEMPLATES: Template[] = [
  {
    name: TESLA_COIL_TEMPLATE.name,
    description:
      "NE555 astable oscillator driving an NPN power transistor to trigger a high-voltage Tesla coil module. Includes timing pots and bypass caps.",
    components: TESLA_COIL_TEMPLATE.components,
    icon: <Zap className="w-5 h-5" />,
  },
];

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-ocid="templates.modal"
          className="max-w-lg"
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

          <div className="py-2 space-y-2">
            {TEMPLATES.map((template, index) => (
              <button
                key={template.name}
                type="button"
                data-ocid={`templates.load_button.${index + 1}`}
                onClick={() => handleTemplateClick(template)}
                className="w-full text-left rounded-md border p-4 transition-all group"
                style={{
                  background: "oklch(0.20 0.01 160)",
                  borderColor: "oklch(0.30 0.02 160)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(0.72 0.16 85)";
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(0.22 0.015 160)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(0.30 0.02 160)";
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(0.20 0.01 160)";
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 p-2 rounded"
                    style={{
                      background: "oklch(0.26 0.02 160)",
                      color: "oklch(0.72 0.16 85)",
                    }}
                  >
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm font-semibold font-mono"
                        style={{ color: "oklch(0.88 0.04 160)" }}
                      >
                        {template.name}
                      </span>
                      <span
                        className="text-xs font-mono shrink-0 px-2 py-0.5 rounded"
                        style={{
                          background: "oklch(0.26 0.02 160)",
                          color: "oklch(0.60 0.06 160)",
                        }}
                      >
                        {template.components.length} components
                      </span>
                    </div>
                    <p
                      className="mt-1 text-xs leading-relaxed font-mono"
                      style={{ color: "oklch(0.55 0.04 160)" }}
                    >
                      {template.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Array.from(
                        new Set(
                          template.components.map((c) => c.componentType),
                        ),
                      )
                        .slice(0, 6)
                        .map((type) => (
                          <span
                            key={type}
                            className="text-xs px-1.5 py-0.5 rounded font-mono"
                            style={{
                              background: "oklch(0.24 0.02 85)",
                              color: "oklch(0.72 0.16 85)",
                            }}
                          >
                            {type}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {TEMPLATES.length === 0 && (
              <div
                data-ocid="templates.empty_state"
                className="flex flex-col items-center gap-3 py-10"
                style={{ color: "oklch(0.45 0.03 160)" }}
              >
                <Cpu className="w-8 h-8 opacity-40" />
                <p className="text-sm font-mono">No templates available yet.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              data-ocid="templates.cancel_button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 px-4 text-xs font-mono border-border"
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

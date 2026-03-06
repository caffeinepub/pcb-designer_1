import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FolderOpen, Trash2 } from "lucide-react";
import type React from "react";
import { toast } from "sonner";
import type { PCBDesign } from "../backend";
import {
  useDeleteDesign,
  useListDesigns,
  useLoadDesign,
} from "../hooks/useQueries";

interface LoadDesignsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadComplete: (design: PCBDesign) => void;
}

export default function LoadDesignsModal({
  open,
  onOpenChange,
  onLoadComplete,
}: LoadDesignsModalProps) {
  const { data: designs, isLoading, error } = useListDesigns();
  const loadDesignMutation = useLoadDesign();
  const deleteDesignMutation = useDeleteDesign();

  const handleLoad = async (name: string) => {
    try {
      const design = await loadDesignMutation.mutateAsync(name);
      onLoadComplete(design);
      onOpenChange(false);
      toast.success(`Loaded "${name}"`);
    } catch {
      toast.error(`Failed to load "${name}"`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    try {
      await deleteDesignMutation.mutateAsync(name);
      toast.success(`Deleted "${name}"`);
    } catch {
      toast.error(`Failed to delete "${name}"`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-border"
        style={{
          background: "oklch(0.17 0.01 160)",
          color: "oklch(0.92 0.02 160)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-sans text-base tracking-wide flex items-center gap-2">
            <FolderOpen
              className="w-4 h-4"
              style={{ color: "oklch(0.72 0.16 85)" }}
            />
            Load Design
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select a saved board design to restore
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-10 w-full"
                  style={{ background: "oklch(0.22 0.01 160)" }}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm py-4">
              <AlertCircle className="w-4 h-4" />
              Failed to load designs list
            </div>
          )}

          {!isLoading && !error && designs && designs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No saved designs yet
            </div>
          )}

          {!isLoading && designs && designs.length > 0 && (
            <ScrollArea className="max-h-64">
              <div className="space-y-1 pr-2">
                {designs.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between group rounded px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/8"
                    style={{ border: "1px solid oklch(0.28 0.02 160)" }}
                    onClick={() => handleLoad(name)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleLoad(name);
                    }}
                  >
                    <span className="text-sm font-mono truncate flex-1">
                      {name}
                    </span>
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "oklch(0.72 0.16 85)" }}
                        onClick={() => handleLoad(name)}
                        disabled={loadDesignMutation.isPending}
                      >
                        Load
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(e, name)}
                        disabled={deleteDesignMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

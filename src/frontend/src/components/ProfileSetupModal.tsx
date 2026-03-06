import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cpu, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSave = async () => {
    if (!name.trim()) return;
    await saveProfile.mutateAsync({ name: name.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm border-border"
        style={{
          background: "oklch(0.17 0.01 160)",
          color: "oklch(0.92 0.02 160)",
        }}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5" style={{ color: "oklch(0.72 0.16 85)" }} />
            <DialogTitle className="font-sans text-base">
              Welcome to PCB Studio
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Set up your profile to get started. This name will identify your
            designs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="profile-name"
              className="text-xs font-mono text-muted-foreground uppercase tracking-wider"
            >
              Your Name
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Engineer"
              className="font-mono text-sm border-border"
              style={{ background: "oklch(0.20 0.01 160)" }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!name.trim() || saveProfile.isPending}
            className="w-full h-9 text-sm font-mono gap-2"
            style={{
              background: "oklch(0.72 0.16 85)",
              color: "oklch(0.12 0.01 160)",
            }}
          >
            {saveProfile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {saveProfile.isPending ? "Saving..." : "Get Started"}
          </Button>

          {saveProfile.isError && (
            <p className="text-xs text-destructive text-center">
              Failed to save profile. Please try again.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

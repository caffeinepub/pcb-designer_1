import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { CircuitBoard, Layers, User } from "lucide-react";
import React, { useState } from "react";
import { usePCBCanvas } from "../contexts/PCBCanvasContext";
import { useAutosaveAndLogout } from "../hooks/useAutosaveAndLogout";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import ComponentLibrary from "./ComponentLibrary";
import LoginButton from "./LoginButton";
import PCBCanvas from "./PCBCanvas";
import PCBToolbar from "./PCBToolbar";

export default function AppLayout() {
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { placedComponents, designName } = usePCBCanvas();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useAutosaveAndLogout({
    placedComponents,
    designName,
    onLogout: clear,
  });

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "oklch(0.12 0.01 160)" }}
    >
      {/* App Header */}
      <div
        className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border flex-shrink-0"
        style={{ background: "oklch(0.13 0.01 160)" }}
      >
        <div className="flex items-center gap-2">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded md:hidden"
            style={{ color: "oklch(0.72 0.16 85)" }}
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open component library"
            data-ocid="header.components_button"
          >
            <Layers className="w-5 h-5" />
          </button>

          <CircuitBoard
            className="w-5 h-5"
            style={{ color: "oklch(0.72 0.16 85)" }}
          />
          <span
            className="text-sm font-bold font-sans tracking-wide hidden sm:block"
            style={{ color: "oklch(0.92 0.02 160)" }}
          >
            PCB Layout Studio
          </span>
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded hidden sm:block"
            style={{
              background: "oklch(0.22 0.01 160)",
              color: "oklch(0.55 0.03 160)",
            }}
          >
            v1.0
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {userProfile && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span>{userProfile.name}</span>
            </div>
          )}
          <LoginButton />
        </div>
      </div>

      {/* Toolbar */}
      <PCBToolbar />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Component Library Sidebar — desktop only */}
        <div className="hidden md:flex">
          <ComponentLibrary />
        </div>

        {/* Canvas */}
        <PCBCanvas />
      </div>

      {/* Footer */}
      <footer
        className="flex items-center justify-between px-3 md:px-4 py-1.5 border-t border-border text-xs font-mono text-muted-foreground/50 flex-shrink-0"
        style={{ background: "oklch(0.13 0.01 160)" }}
      >
        <span className="hidden md:block">
          PCB Layout Studio — Electronic Design Automation
        </span>
        <span
          className="block md:hidden"
          style={{ color: "oklch(0.72 0.16 85)" }}
        >
          PCB Studio
        </span>
        <span>
          Built with <span style={{ color: "oklch(0.72 0.16 85)" }}>♥</span>{" "}
          using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "pcb-layout-studio")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "oklch(0.72 0.16 85)" }}
          >
            caffeine.ai
          </a>{" "}
          · © {new Date().getFullYear()}
        </span>
      </footer>

      {/* Mobile Component Library Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 w-[280px]"
          style={{
            background: "oklch(0.16 0.01 160)",
            borderRight: "1px solid oklch(0.28 0.02 160)",
          }}
        >
          <SheetHeader className="px-3 py-2.5 border-b border-border">
            <SheetTitle
              className="text-xs font-semibold tracking-widest uppercase font-sans text-left"
              style={{ color: "oklch(0.55 0.03 160)" }}
            >
              Components
            </SheetTitle>
          </SheetHeader>
          <ComponentLibrary onClose={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.20 0.01 160)",
            border: "1px solid oklch(0.28 0.02 160)",
            color: "oklch(0.92 0.02 160)",
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}

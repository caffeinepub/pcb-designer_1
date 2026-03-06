import { Toaster } from "@/components/ui/sonner";
import { CircuitBoard, User } from "lucide-react";
import React from "react";
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
        className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0"
        style={{ background: "oklch(0.13 0.01 160)" }}
      >
        <div className="flex items-center gap-2">
          <CircuitBoard
            className="w-5 h-5"
            style={{ color: "oklch(0.72 0.16 85)" }}
          />
          <span
            className="text-sm font-bold font-sans tracking-wide"
            style={{ color: "oklch(0.92 0.02 160)" }}
          >
            PCB Layout Studio
          </span>
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "oklch(0.22 0.01 160)",
              color: "oklch(0.55 0.03 160)",
            }}
          >
            v1.0
          </span>
        </div>

        <div className="flex items-center gap-3">
          {userProfile && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
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
        {/* Component Library Sidebar */}
        <ComponentLibrary />

        {/* Canvas */}
        <PCBCanvas />
      </div>

      {/* Footer */}
      <footer
        className="flex items-center justify-between px-4 py-1.5 border-t border-border text-xs font-mono text-muted-foreground/50 flex-shrink-0"
        style={{ background: "oklch(0.13 0.01 160)" }}
      >
        <span>PCB Layout Studio — Electronic Design Automation</span>
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

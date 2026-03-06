import { useCallback, useEffect, useRef } from "react";
import type { Component, PCBDesign } from "../backend";
import type { PlacedComponent } from "../types/pcb";
import { useSaveDesign } from "./useQueries";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll"] as const;

interface UseAutosaveAndLogoutOptions {
  placedComponents: PlacedComponent[];
  designName: string;
  onLogout: () => void;
}

export function useAutosaveAndLogout({
  placedComponents,
  designName,
  onLogout,
}: UseAutosaveAndLogoutOptions) {
  const saveDesignMutation = useSaveDesign();

  // Keep refs to avoid stale closures in event listeners
  const placedComponentsRef = useRef(placedComponents);
  const designNameRef = useRef(designName);
  const onLogoutRef = useRef(onLogout);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    placedComponentsRef.current = placedComponents;
  }, [placedComponents]);

  useEffect(() => {
    designNameRef.current = designName;
  }, [designName]);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  const shouldSave = useCallback(() => {
    const name = designNameRef.current.trim();
    return (
      placedComponentsRef.current.length > 0 &&
      name.length > 0 &&
      name !== "Untitled Board"
    );
  }, []);

  const silentSave = useCallback(async () => {
    if (!shouldSave()) return;
    try {
      const name = designNameRef.current.trim();
      const components: Component[] = placedComponentsRef.current.map((c) => ({
        id: BigInt(c.id),
        name: c.name,
        position: { x: c.position.x, y: c.position.y },
        rotation: BigInt(c.rotation),
      }));
      const design: PCBDesign = {
        name,
        components,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
      await saveDesignMutation.mutateAsync(design);
    } catch {
      // Best-effort silent save — swallow all errors
    }
  }, [saveDesignMutation, shouldSave]);

  // Inactivity timer management
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current !== null) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(async () => {
      // Save before logout
      await silentSave();
      // Mark session as auto-logged-out
      sessionStorage.setItem("pcb_autologout", "1");
      // Log out
      onLogoutRef.current();
    }, INACTIVITY_TIMEOUT_MS);
  }, [silentSave]);

  // Set up activity listeners and initial timer
  useEffect(() => {
    // Start the inactivity timer on mount
    resetInactivityTimer();

    const handleActivity = () => resetInactivityTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      if (inactivityTimerRef.current !== null) {
        clearTimeout(inactivityTimerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [resetInactivityTimer]);

  // beforeunload handler — save on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Best-effort: fire and forget (synchronous constraint)
      if (shouldSave()) {
        silentSave().catch(() => {});
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldSave, silentSave]);
}

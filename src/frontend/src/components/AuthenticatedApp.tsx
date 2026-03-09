import { CircuitBoard, Clock, Cpu, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import LoginButton from "./LoginButton";
import ProfileSetupModal from "./ProfileSetupModal";

interface AuthenticatedAppProps {
  children: React.ReactNode;
}

export default function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // Latch: once we've seen the user as authenticated, never flash the login
  // screen again during re-initialization cycles (e.g. authClient dep loop).
  const wasEverAuthenticated = useRef(false);
  if (isAuthenticated) wasEverAuthenticated.current = true;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
    isError: profileError,
  } = useGetCallerUserProfile();

  // Safety valve: if profile loading takes >5 s, proceed anyway.
  // The ProfileSetupModal handles the "no profile yet" case.
  const [profileTimedOut, setProfileTimedOut] = useState(false);

  // Check for autologout flag from sessionStorage
  const [showAutologoutNotice, setShowAutologoutNotice] = useState(false);

  // Welcome splash: show for at least 2 s after a brand-new profile is saved
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      const flag = sessionStorage.getItem("pcb_autologout");
      if (flag) {
        setShowAutologoutNotice(true);
        sessionStorage.removeItem("pcb_autologout");
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Reset timeout whenever authentication state or loading state changes
    setProfileTimedOut(false);
    if (!isAuthenticated || !profileLoading) return;
    const id = setTimeout(() => setProfileTimedOut(true), 5000);
    return () => clearTimeout(id);
  }, [isAuthenticated, profileLoading]);

  // Show welcome splash when profile first loads (new or returning user)
  const prevUserProfile = useRef<typeof userProfile>(undefined);
  useEffect(() => {
    if (!prevUserProfile.current && userProfile) {
      // Profile just appeared — show welcome splash for 2.5 s
      setShowWelcomeSplash(true);
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
      welcomeTimerRef.current = setTimeout(() => {
        setShowWelcomeSplash(false);
        welcomeTimerRef.current = null;
      }, 2500);
    }
    prevUserProfile.current = userProfile;
  }, [userProfile]);

  // Clean up welcome timer on unmount only
  useEffect(() => {
    return () => {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    };
  }, []);

  // Exit loading immediately on error — no need to wait for the timeout
  const profileResolved = isFetched || profileTimedOut || profileError;

  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileResolved &&
    !userProfile &&
    !showWelcomeSplash;

  // Show loading while initializing auth — but only if we haven't already
  // confirmed the user is authenticated (prevents login loop flicker).
  if (isInitializing && !wasEverAuthenticated.current) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.12 0.01 160)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <Cpu
            className="w-10 h-10 animate-pulse"
            style={{ color: "oklch(0.72 0.16 85)" }}
          />
          <p className="text-sm font-mono text-muted-foreground">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  // Welcome splash screen — shown for 2.5 s after a new profile is created
  if (showWelcomeSplash && isAuthenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: "oklch(0.12 0.01 160)" }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <svg width="100%" height="100%" aria-hidden="true">
            <defs>
              <pattern
                id="grid-splash"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="oklch(0.40 0.06 155)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-splash)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
          <CircuitBoard
            className="w-16 h-16 animate-pulse"
            style={{ color: "oklch(0.72 0.16 85)" }}
          />
          <h1
            className="text-3xl font-bold font-sans tracking-tight"
            style={{ color: "oklch(0.92 0.02 160)" }}
          >
            Welcome to PCB Studio
          </h1>
          <p
            className="text-sm font-mono"
            style={{ color: "oklch(0.60 0.04 160)" }}
          >
            {userProfile?.name
              ? `Hello, ${userProfile.name}!`
              : "Your workspace is ready."}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated — show login screen
  if (!isAuthenticated && !wasEverAuthenticated.current) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-8"
        style={{ background: "oklch(0.12 0.01 160)" }}
      >
        {/* PCB grid background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <svg width="100%" height="100%" aria-hidden="true">
            <defs>
              <pattern
                id="grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="oklch(0.40 0.06 155)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center px-6">
          <div className="flex items-center gap-3">
            <CircuitBoard
              className="w-12 h-12"
              style={{ color: "oklch(0.72 0.16 85)" }}
            />
            <div className="text-left">
              <h1
                className="text-2xl font-bold font-sans tracking-tight"
                style={{ color: "oklch(0.92 0.02 160)" }}
              >
                PCB Layout Studio
              </h1>
              <p
                className="text-xs font-mono"
                style={{ color: "oklch(0.55 0.03 160)" }}
              >
                Electronic Design Automation
              </p>
            </div>
          </div>

          {/* Autologout notice */}
          {showAutologoutNotice && (
            <div
              className="w-full flex items-start gap-2.5 rounded-lg px-4 py-3 text-xs font-mono text-left"
              style={{
                background: "oklch(0.20 0.04 85 / 0.25)",
                border: "1px solid oklch(0.55 0.10 85 / 0.4)",
                color: "oklch(0.82 0.08 85)",
              }}
            >
              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                You were logged out after 15 minutes of inactivity. Your design
                was saved.
              </span>
            </div>
          )}

          <div
            className="w-full rounded-lg p-6 border border-border space-y-4"
            style={{ background: "oklch(0.17 0.01 160)" }}
          >
            <div className="space-y-1">
              <h2 className="text-sm font-semibold font-sans">
                Sign in to continue
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Design, place, and save PCB layouts with a full component
                library. Your designs are stored securely on the Internet
                Computer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              {[
                "Visual Canvas",
                "Component Library",
                "Save & Load",
                "Grid Snapping",
              ].map((f) => (
                <div key={f} className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "oklch(0.72 0.16 85)" }}
                  />
                  {f}
                </div>
              ))}
            </div>

            <LoginButton />
          </div>

          <p className="text-xs text-muted-foreground/50">
            Powered by Internet Computer · Decentralized storage
          </p>
        </div>
      </div>
    );
  }

  // Authenticated but loading profile — also stop spinner immediately on error
  if (profileLoading && !profileTimedOut && !profileError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.12 0.01 160)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "oklch(0.72 0.16 85)" }}
          />
          <p className="text-sm font-mono text-muted-foreground">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showProfileSetup && <ProfileSetupModal open={showProfileSetup} />}
      {children}
    </>
  );
}

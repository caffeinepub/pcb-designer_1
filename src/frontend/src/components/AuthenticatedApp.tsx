import { CircuitBoard, Cpu, Loader2 } from "lucide-react";
import type React from "react";
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

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Show loading while initializing auth
  if (isInitializing) {
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

  // Not authenticated — show login screen
  if (!isAuthenticated) {
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

  // Authenticated but loading profile
  if (profileLoading) {
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

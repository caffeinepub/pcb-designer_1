import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn, LogOut } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === "User is already authenticated"
        ) {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn}
      size="sm"
      className="h-8 px-3 text-xs font-mono gap-1.5"
      style={
        isAuthenticated
          ? {
              background: "oklch(0.22 0.01 160)",
              color: "oklch(0.75 0.02 160)",
              border: "1px solid oklch(0.30 0.02 160)",
            }
          : { background: "oklch(0.72 0.16 85)", color: "oklch(0.12 0.01 160)" }
      }
    >
      {isLoggingIn ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isAuthenticated ? (
        <LogOut className="w-3.5 h-3.5" />
      ) : (
        <LogIn className="w-3.5 h-3.5" />
      )}
      {isLoggingIn ? "Logging in..." : isAuthenticated ? "Logout" : "Login"}
    </Button>
  );
}

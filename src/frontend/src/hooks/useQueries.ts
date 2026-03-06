import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PCBDesign, UserProfile } from "../backend";
import { useActor } from "./useActor";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: (failureCount, error) => {
      const msg = error instanceof Error ? error.message : String(error);
      // Don't retry permanent errors
      if (msg.includes("Design not found")) return false;
      // Unauthorized = access control still initialising — retry quickly, up to 5 times
      if (msg.toLowerCase().includes("unauthorized")) return failureCount < 5;
      // Other transient errors — retry up to 3 times
      return failureCount < 3;
    },
    retryDelay: (attempt, error) => {
      const msg = error instanceof Error ? error.message : String(error);
      // Fast retries for Unauthorized: 200ms, 400ms, 800ms, 1.2s, 2s
      if (msg.toLowerCase().includes("unauthorized"))
        return Math.min(200 * 2 ** attempt, 2000);
      // Normal backoff for other errors
      return Math.min(500 * 2 ** attempt, 5000);
    },
    staleTime: 30_000,
  });

  // Only show loading when the actor itself is still being fetched.
  // Once the actor exists, let the query's own loading/error state drive the UI.
  return {
    ...query,
    isLoading: actorFetching || (!query.isFetched && query.isLoading),
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── PCB Designs ─────────────────────────────────────────────────────────────

export function useListDesigns() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["designs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDesigns();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveDesign() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (design: PCBDesign) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveDesign(design);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

export function useLoadDesign() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.loadDesign(name);
    },
  });
}

export function useDeleteDesign() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteDesign(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

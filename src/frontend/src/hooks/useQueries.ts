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
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
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

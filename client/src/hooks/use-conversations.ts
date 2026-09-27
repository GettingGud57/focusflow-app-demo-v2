import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertConversation, UpdateConversationRequest } from "@shared/schema";

// Same shape as use-calendar / use-tasks: one query for the list, one mutation
// per write, and every write invalidates the list.

export function useConversations() {
  return useQuery({
    queryKey: [api.conversations.list.path],
    queryFn: async () => {
      const res = await fetch(api.conversations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return api.conversations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertConversation) => {
      const res = await fetch(api.conversations.create.path, {
        method: api.conversations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return api.conversations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] }),
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string } & UpdateConversationRequest) => {
      const { id, ...updateData } = data;
      const res = await fetch(buildUrl(api.conversations.update.path, { id }), {
        method: api.conversations.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update conversation");
      return api.conversations.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildUrl(api.conversations.delete.path, { id }), {
        method: api.conversations.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] }),
  });
}

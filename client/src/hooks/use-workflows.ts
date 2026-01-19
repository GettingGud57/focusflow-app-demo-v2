import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateWorkflowRequest, type UpdateWorkflowRequest } from "@shared/routes";

export function useWorkflows() {
  return useQuery({
    queryKey: [api.workflows.list.path],
    queryFn: async () => {
      const res = await fetch(api.workflows.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workflows");
      return api.workflows.list.responses[200].parse(await res.json());
    },
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: [api.workflows.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workflows.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch workflow");
      return api.workflows.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWorkflowRequest) => {
      const res = await fetch(api.workflows.create.path, {
        method: api.workflows.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create workflow");
      return api.workflows.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.workflows.list.path] }),
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & UpdateWorkflowRequest) => {
      const url = buildUrl(api.workflows.update.path, { id });
      const res = await fetch(url, {
        method: api.workflows.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update workflow");
      return api.workflows.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workflows.list.path] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.workflows.delete.path, { id });
      const res = await fetch(url, {
        method: api.workflows.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete workflow");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.workflows.list.path] }),
  });
}

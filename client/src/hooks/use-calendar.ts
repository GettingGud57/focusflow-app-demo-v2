import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateCalendarEventRequest, type UpdateCalendarEventRequest } from "@shared/routes";

export function useCalendarEvents() {
  return useQuery({
    queryKey: [api.calendar.list.path],
    queryFn: async () => {
      const res = await fetch(api.calendar.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch calendar events");
      const data = await res.json();
      // Manually handle date conversion because JSON dates are strings
      return api.calendar.list.responses[200].parse(data).map(event => ({
        ...event,
        startTime: new Date(event.startTime)
      }));
    },
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCalendarEventRequest) => {
      const res = await fetch(api.calendar.create.path, {
        method: api.calendar.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create event");
      return api.calendar.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.calendar.list.path] }),
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.calendar.delete.path, { id });
      const res = await fetch(url, {
        method: api.calendar.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete event");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.calendar.list.path] }),
  });
}

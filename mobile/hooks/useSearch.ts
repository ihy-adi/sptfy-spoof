import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 min — search results don't change that fast
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}

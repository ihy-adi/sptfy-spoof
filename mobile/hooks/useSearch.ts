import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import type { Song } from "@/types";

export function streamQueryKey(videoId: string) {
  return ["stream", videoId];
}

export function useSearch(query: string, page = 0, enabled = true) {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ["search", query, page],
    queryFn: () => api.search(query, page),
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Pre-fetch stream URLs for all results in the background
  useEffect(() => {
    if (!result.data?.results) return;
    result.data.results.forEach((song: Song) => {
      queryClient.prefetchQuery({
        queryKey: streamQueryKey(song.youtubeId),
        queryFn: () => api.getStream(song.youtubeId),
        staleTime: 55 * 60 * 1000,
      });
    });
  }, [result.data]);

  // Pre-fetch next page in background
  useEffect(() => {
    if (!result.data?.nextPage || !query) return;
    queryClient.prefetchQuery({
      queryKey: ["search", query, page + 1],
      queryFn: () => api.search(query, page + 1),
      staleTime: 5 * 60 * 1000,
    });
  }, [result.data?.nextPage, query, page]);

  return result;
}

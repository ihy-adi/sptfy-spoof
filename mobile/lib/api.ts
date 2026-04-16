import type { SearchResponse, StreamInfo } from "@/types";

// Update this to your machine's local IP when running on device
// On simulator: http://localhost:3000
// On physical device: http://YOUR_LOCAL_IP:3000
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  search(query: string, page = 0): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query, page: String(page) });
    return request<SearchResponse>(`/search?${params}`);
  },

  getStream(videoId: string): Promise<StreamInfo> {
    return request<StreamInfo>(`/stream/${videoId}`);
  },

  health(): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>("/health");
  },
};

export interface Song {
  youtubeId: string;
  title: string;
  channel: string;
  durationS: number;
  thumbnail: string;
}

export interface SearchResult {
  results: Song[];
  nextPage: string | null;
}

export interface StreamResult {
  streamUrl: string;
  expiresAt: string;
  title: string;
  durationMs: number;
  thumbnail: string;
}

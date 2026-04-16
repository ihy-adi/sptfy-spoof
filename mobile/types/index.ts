export interface Song {
  youtubeId: string;
  title: string;
  channel: string;
  durationS: number;
  thumbnail: string;
}

export interface StreamInfo {
  streamUrl: string;
  expiresAt: string;
  title: string;
  durationMs: number;
  thumbnail: string;
}

export interface SearchResponse {
  results: Song[];
  nextPage: string | null;
  prevPage: string | null;
  page: number;
}

export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error";
export type LoopMode = "off" | "one" | "all";

export interface PlayerState {
  currentSong: Song | null;
  playbackState: PlaybackState;
  positionMs: number;
  durationMs: number;
  streamUrl: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  cover?: string;
  songs: Song[];
  createdAt: string;
}

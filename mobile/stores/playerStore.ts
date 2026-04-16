import { create } from "zustand";
import type { PlaybackState, Song, LoopMode } from "@/types";
import { api } from "@/lib/api";
import { audioService } from "@/lib/audioService";
import type { AVPlaybackStatus } from "expo-av";
import { streamQueryKey } from "@/hooks/useSearch";

// Access the QueryClient outside of React — set once in _layout.tsx
let _queryClient: import("@tanstack/react-query").QueryClient | null = null;
export function setQueryClient(qc: import("@tanstack/react-query").QueryClient) {
  _queryClient = qc;
}

interface PlayerStore {
  // State
  currentSong: Song | null;
  playbackState: PlaybackState;
  positionMs: number;
  durationMs: number;
  streamUrl: string | null;
  queue: Song[];
  queueIndex: number;
  loopMode: LoopMode;
  shuffleMode: boolean;
  shuffledQueue: Song[];

  // Actions
  playSong: (song: Song) => Promise<void>;
  addToQueue: (song: Song) => void;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  setQueue: (songs: Song[], startIndex?: number) => Promise<void>;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  _onPlaybackStatus: (status: AVPlaybackStatus) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const usePlayerStore = create<PlayerStore>((set, get) => {
  audioService.addListener((status) => {
    get()._onPlaybackStatus(status);
  });

  return {
    currentSong: null,
    playbackState: "idle",
    positionMs: 0,
    durationMs: 0,
    streamUrl: null,
    queue: [],
    queueIndex: -1,
    loopMode: "off",
    shuffleMode: false,
    shuffledQueue: [],

    playSong: async (song: Song) => {
      set({ playbackState: "loading", currentSong: song, positionMs: 0 });
      try {
        // Check TanStack Query cache first (pre-fetched by useSearch)
        const cached = _queryClient?.getQueryData<import("@/types").StreamInfo>(
          streamQueryKey(song.youtubeId)
        );
        const streamInfo = cached ?? (await api.getStream(song.youtubeId));

        await audioService.loadAndPlay(streamInfo.streamUrl, get().loopMode === "one");
        set({
          streamUrl: streamInfo.streamUrl,
          durationMs: streamInfo.durationMs,
          playbackState: "playing",
        });
      } catch (err) {
        console.error("playSong error:", err);
        set({ playbackState: "error" });
      }
    },

    addToQueue: (song: Song) => {
      set((s) => {
        const alreadyInQueue = s.queue.some((q) => q.youtubeId === song.youtubeId);
        if (alreadyInQueue) return s;
        return { queue: [...s.queue, song] };
      });
    },

    togglePlayPause: async () => {
      const { playbackState } = get();
      if (playbackState === "playing") {
        await audioService.pause();
        set({ playbackState: "paused" });
      } else if (playbackState === "paused") {
        await audioService.play();
        set({ playbackState: "playing" });
      }
    },

    seekTo: async (positionMs: number) => {
      await audioService.seekTo(positionMs);
      set({ positionMs });
    },

    playNext: async () => {
      const { queue, shuffledQueue, shuffleMode, queueIndex, loopMode } = get();
      const activeQueue = shuffleMode ? shuffledQueue : queue;
      if (activeQueue.length === 0) return;

      let next = queueIndex + 1;

      if (next >= activeQueue.length) {
        if (loopMode === "all") {
          next = 0;
        } else {
          return; // end of queue
        }
      }

      set({ queueIndex: next });
      await get().playSong(activeQueue[next]);
    },

    playPrev: async () => {
      const { queue, shuffledQueue, shuffleMode, queueIndex, positionMs } = get();
      const activeQueue = shuffleMode ? shuffledQueue : queue;

      // If >3s in, restart current track
      if (positionMs > 3000) {
        await audioService.seekTo(0);
        set({ positionMs: 0 });
        return;
      }

      const prev = queueIndex - 1;
      if (prev >= 0) {
        set({ queueIndex: prev });
        await get().playSong(activeQueue[prev]);
      }
    },

    setQueue: async (songs: Song[], startIndex = 0) => {
      const { shuffleMode } = get();
      const shuffled = shuffleMode ? shuffleArray(songs) : [];
      set({ queue: songs, queueIndex: startIndex, shuffledQueue: shuffled });
      await get().playSong(songs[startIndex]);
    },

    toggleLoop: () => {
      const { loopMode, currentSong } = get();
      const next: LoopMode =
        loopMode === "off" ? "one" : loopMode === "one" ? "all" : "off";
      set({ loopMode: next });
      // Apply immediately to the current sound
      if (currentSong) {
        audioService.setLooping(next === "one").catch(console.warn);
      }
    },

    toggleShuffle: () => {
      const { shuffleMode, queue, queueIndex, currentSong } = get();
      const next = !shuffleMode;
      if (next && queue.length > 0) {
        // Build a shuffled queue with current song first
        const rest = queue.filter((_, i) => i !== queueIndex);
        const shuffled = currentSong
          ? [currentSong, ...shuffleArray(rest)]
          : shuffleArray(queue);
        set({ shuffleMode: next, shuffledQueue: shuffled, queueIndex: 0 });
      } else {
        // Restore original queue, find current song's original index
        const originalIndex = currentSong
          ? queue.findIndex((s) => s.youtubeId === currentSong.youtubeId)
          : 0;
        set({ shuffleMode: next, shuffledQueue: [], queueIndex: Math.max(0, originalIndex) });
      }
    },

    _onPlaybackStatus: (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      const positionMs = status.positionMillis ?? 0;
      const durationMs = status.durationMillis ?? get().durationMs;

      set({ positionMs, durationMs });

      if (status.didJustFinish) {
        const { loopMode } = get();
        if (loopMode === "one") {
          // expo-av native loop handles this — shouldn't reach here, but just in case
          audioService.seekTo(0).then(() => audioService.play());
        } else {
          get().playNext();
        }
      }
    },
  };
});

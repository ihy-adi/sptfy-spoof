import { usePlayerStore } from "@/stores/playerStore";
import { useLibraryStore } from "@/stores/libraryStore";
import type { Song } from "@/types";

export function usePlayer() {
  const store = usePlayerStore();
  const addRecent = useLibraryStore((s) => s.addRecent);

  const playSong = async (song: Song) => {
    addRecent(song);
    await store.playSong(song);
  };

  const progressPercent =
    store.durationMs > 0 ? store.positionMs / store.durationMs : 0;

  const timeRemainingMs = Math.max(0, store.durationMs - store.positionMs);

  return {
    currentSong: store.currentSong,
    playbackState: store.playbackState,
    positionMs: store.positionMs,
    durationMs: store.durationMs,
    timeRemainingMs,
    progressPercent,
    isPlaying: store.playbackState === "playing",
    isLoading: store.playbackState === "loading",
    loopMode: store.loopMode,
    shuffleMode: store.shuffleMode,
    playSong,
    togglePlayPause: store.togglePlayPause,
    seekTo: store.seekTo,
    playNext: store.playNext,
    playPrev: store.playPrev,
    setQueue: store.setQueue,
    toggleLoop: store.toggleLoop,
    toggleShuffle: store.toggleShuffle,
  };
}

export function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

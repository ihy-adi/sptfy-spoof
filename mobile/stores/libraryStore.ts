import { create } from "zustand";
import type { Song, Playlist } from "@/types";
import {
  saveSongToDb,
  addFavorite as dbAddFavorite,
  removeFavorite as dbRemoveFavorite,
  getFavorites,
  upsertRecent,
  supabase,
} from "@/lib/supabase";

interface LibraryStore {
  favorites: Song[];
  recents: Song[];
  playlists: Playlist[];
  favoritesLoaded: boolean;

  // Bootstrap
  loadFavorites: () => Promise<void>;

  // Favorites
  addFavorite: (song: Song) => Promise<void>;
  removeFavorite: (youtubeId: string) => Promise<void>;
  isFavorite: (youtubeId: string) => boolean;

  // Recents (local + Supabase fire-and-forget)
  addRecent: (song: Song) => void;

  // Playlists (local for Phase 2, Supabase in Phase 3)
  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, youtubeId: string) => void;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  favorites: [],
  recents: [],
  playlists: [],
  favoritesLoaded: false,

  loadFavorites: async () => {
    if (get().favoritesLoaded) return;
    try {
      const rows = await getFavorites();
      const songs: Song[] = rows
        .map((row: any) => {
          const s = Array.isArray(row.songs) ? row.songs[0] : row.songs;
          if (!s) return null;
          return {
            youtubeId: s.youtube_id,
            title: s.title,
            channel: s.channel,
            durationS: s.duration_s,
            thumbnail: s.thumbnail,
          } satisfies Song;
        })
        .filter(Boolean) as Song[];

      set({ favorites: songs, favoritesLoaded: true });
    } catch (err) {
      console.warn("loadFavorites failed:", err);
      set({ favoritesLoaded: true });
    }
  },

  addFavorite: async (song) => {
    // Optimistic update first
    set((s) => ({
      favorites: s.favorites.some((f) => f.youtubeId === song.youtubeId)
        ? s.favorites
        : [song, ...s.favorites],
    }));
    try {
      const songId = await saveSongToDb(song);
      await dbAddFavorite(songId);
    } catch (err) {
      console.warn("addFavorite failed, rolling back:", err);
      set((s) => ({
        favorites: s.favorites.filter((f) => f.youtubeId !== song.youtubeId),
      }));
    }
  },

  removeFavorite: async (youtubeId) => {
    const prev = get().favorites;
    // Optimistic update
    set((s) => ({
      favorites: s.favorites.filter((f) => f.youtubeId !== youtubeId),
    }));
    try {
      const { data } = await supabase
        .from("songs")
        .select("id")
        .eq("youtube_id", youtubeId)
        .single();
      if (data?.id) await dbRemoveFavorite(data.id);
    } catch (err) {
      console.warn("removeFavorite failed, rolling back:", err);
      set({ favorites: prev });
    }
  },

  isFavorite: (youtubeId) =>
    get().favorites.some((f) => f.youtubeId === youtubeId),

  addRecent: (song) => {
    set((s) => ({
      recents: [
        song,
        ...s.recents.filter((r) => r.youtubeId !== song.youtubeId),
      ].slice(0, 30),
    }));
    // Fire-and-forget persistence
    saveSongToDb(song)
      .then((id) => upsertRecent(id))
      .catch((err) => console.warn("addRecent failed:", err));
  },

  createPlaylist: (name) =>
    set((s) => ({
      playlists: [
        ...s.playlists,
        {
          id: Math.random().toString(36).slice(2),
          name,
          songs: [],
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  deletePlaylist: (id) =>
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

  addToPlaylist: (playlistId, song) =>
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id !== playlistId
          ? p
          : p.songs.some((s) => s.youtubeId === song.youtubeId)
          ? p
          : { ...p, songs: [...p.songs, song] }
      ),
    })),

  removeFromPlaylist: (playlistId, youtubeId) =>
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id !== playlistId
          ? p
          : { ...p, songs: p.songs.filter((s) => s.youtubeId !== youtubeId) }
      ),
    })),
}));

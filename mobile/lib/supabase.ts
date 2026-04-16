import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // personal app, no auth needed
  },
});

// ---- Favorites ----

export async function saveSongToDb(song: {
  youtubeId: string;
  title: string;
  channel: string;
  durationS: number;
  thumbnail: string;
}) {
  const { data, error } = await supabase
    .from("songs")
    .upsert(
      {
        youtube_id: song.youtubeId,
        title: song.title,
        channel: song.channel,
        duration_s: song.durationS,
        thumbnail: song.thumbnail,
      },
      { onConflict: "youtube_id" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function addFavorite(songId: string) {
  const { error } = await supabase
    .from("favorites")
    .insert({ song_id: songId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function removeFavorite(songId: string) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("song_id", songId);
  if (error) throw error;
}

export async function getFavorites() {
  const { data, error } = await supabase
    .from("favorites")
    .select("song_id, songs(youtube_id, title, channel, duration_s, thumbnail)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ---- Recents ----

export async function upsertRecent(songId: string) {
  const { error } = await supabase.from("recents").upsert(
    { song_id: songId, played_at: new Date().toISOString() },
    { onConflict: "song_id" }
  );
  if (error) throw error;
}

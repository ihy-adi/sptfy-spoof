import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SearchBar } from "@/components/SearchBar";
import { SongCard } from "@/components/SongCard";
import { Colors } from "@/constants/colors";
import { useSearch } from "@/hooks/useSearch";
import { usePlayer } from "@/hooks/usePlayer";
import { useLibraryStore } from "@/stores/libraryStore";

const QUICK_SEARCHES = ["lo-fi", "hiphop beats", "ambient focus", "jazz chill", "synthwave"];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [inputValue, setInputValue] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [page, setPage] = useState(0);
  const { playSong, setQueue } = usePlayer();
  const recents = useLibraryStore((s) => s.recents);

  const { data, isLoading, isError, error } = useSearch(submittedQuery, page);

  const handleSubmit = useCallback((q: string) => {
    Keyboard.dismiss();
    setPage(0); // reset to first page on new search
    setSubmittedQuery(q);
  }, []);

  const handlePlayAll = useCallback(async () => {
    if (!data?.results?.length) return;
    await setQueue(data.results, 0);
  }, [data, setQueue]);

  const goNextPage = () => setPage((p) => p + 1);
  const goPrevPage = () => setPage((p) => Math.max(0, p - 1));

  const renderEmpty = () => {
    if (submittedQuery && isLoading) return null;
    if (submittedQuery && isError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 }}>
          <Ionicons name="wifi-outline" size={48} color={Colors.muted} />
          <Text style={{ color: Colors.muted, fontSize: 14, textAlign: "center" }}>
            {"Search failed.\nCheck your API server is running."}
          </Text>
          <Text style={{ color: Colors.border, fontSize: 11 }}>{String(error)}</Text>
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12, letterSpacing: 0.8, textTransform: "uppercase" }}>
          Quick search
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {QUICK_SEARCHES.map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => { setInputValue(q); handleSubmit(q); }}
              style={{
                backgroundColor: Colors.elevated,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {recents.length > 0 && (
          <>
            <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" }}>
              Recently played
            </Text>
            {recents.slice(0, 5).map((song) => (
              <SongCard key={song.youtubeId} song={song} onPlay={playSong} />
            ))}
          </>
        )}
      </View>
    );
  };

  const hasResults = (data?.results?.length ?? 0) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.bg, gap: 12 }}>
        <Text style={{ color: Colors.textPrimary, fontSize: 28, fontWeight: "800" }}>sptfy</Text>
        <SearchBar value={inputValue} onChange={setInputValue} onSubmit={handleSubmit} />
      </View>

      {/* Results header with pagination */}
      {hasResults && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 }}>
          {/* Prev / page indicator */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={goPrevPage}
              disabled={page === 0 || isLoading}
              hitSlop={8}
              style={{ opacity: page === 0 ? 0.3 : 1 }}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{ color: Colors.textSecondary, fontSize: 13, minWidth: 24, textAlign: "center" }}>
              {page + 1}
            </Text>
            <TouchableOpacity
              onPress={goNextPage}
              disabled={!data?.nextPage || isLoading}
              hitSlop={8}
              style={{ opacity: !data?.nextPage ? 0.3 : 1 }}
            >
              <Ionicons name="chevron-forward" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Play all */}
          <TouchableOpacity
            onPress={handlePlayAll}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}
          >
            <Ionicons name="shuffle" size={14} color="#000" />
            <Text style={{ color: "#000", fontSize: 13, fontWeight: "700" }}>Play all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {isLoading && submittedQuery && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 12 }}>
            {page === 0 ? "Searching…" : `Loading page ${page + 1}…`}
          </Text>
        </View>
      )}

      {/* List */}
      {!isLoading && (
        <FlatList
          data={data?.results ?? []}
          keyExtractor={(item) => item.youtubeId}
          renderItem={({ item }) => <SongCard song={item} onPlay={playSong} />}
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

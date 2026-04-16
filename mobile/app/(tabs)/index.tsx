import React, { useState, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SearchBar } from "@/components/SearchBar";
import { SongCard } from "@/components/SongCard";
import { Colors } from "@/constants/colors";
import { useSearch } from "@/hooks/useSearch";
import { usePlayer } from "@/hooks/usePlayer";
import { useLibraryStore } from "@/stores/libraryStore";
import type { Song } from "@/types";

const QUICK_SEARCHES = ["lo-fi", "hiphop beats", "ambient focus", "jazz chill", "synthwave"];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [inputValue, setInputValue] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const { playSong, setQueue } = usePlayer();
  const recents = useLibraryStore((s) => s.recents);

  const { data, isLoading, isError, error } = useSearch(submittedQuery);

  const handleSubmit = useCallback((q: string) => {
    Keyboard.dismiss();
    setSubmittedQuery(q);
  }, []);

  const handlePlayAll = useCallback(async () => {
    if (!data?.results?.length) return;
    await setQueue(data.results, 0);
  }, [data, setQueue]);

  const renderEmpty = () => {
    if (submittedQuery && isLoading) return null;
    if (submittedQuery && isError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Ionicons name="wifi-outline" size={48} color={Colors.muted} />
          <Text style={{ color: Colors.muted, fontSize: 14, textAlign: "center" }}>
            {"Search failed.\nCheck your API server is running."}
          </Text>
          <Text style={{ color: Colors.border, fontSize: 11 }}>
            {String(error)}
          </Text>
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        {/* Quick searches */}
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

        {/* Recents */}
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: Colors.bg,
          gap: 12,
        }}
      >
        <Text style={{ color: Colors.textPrimary, fontSize: 28, fontWeight: "800" }}>
          sptfy
        </Text>
        <SearchBar
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
        />
      </View>

      {/* Results header */}
      {data?.results && data.results.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
            {data.results.length} results
          </Text>
          <TouchableOpacity
            onPress={handlePlayAll}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: Colors.accent,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Ionicons name="shuffle" size={14} color="#000" />
            <Text style={{ color: "#000", fontSize: 13, fontWeight: "700" }}>
              Play all
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {isLoading && submittedQuery && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 12 }}>
            Searching…
          </Text>
        </View>
      )}

      {/* List */}
      {!isLoading && (
        <FlatList
          data={data?.results ?? []}
          keyExtractor={(item) => item.youtubeId}
          renderItem={({ item }) => (
            <SongCard song={item} onPlay={playSong} />
          )}
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

import React from "react";
import { View, Text, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SongCard } from "@/components/SongCard";
import { Colors } from "@/constants/colors";
import { useLibraryStore } from "@/stores/libraryStore";
import { usePlayer } from "@/hooks/usePlayer";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const favorites = useLibraryStore((s) => s.favorites);
  const { playSong, setQueue } = usePlayer();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: Colors.textPrimary, fontSize: 28, fontWeight: "800" }}>
          Favorites
        </Text>
        {favorites.length > 0 && (
          <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4 }}>
            {favorites.length} {favorites.length === 1 ? "song" : "songs"}
          </Text>
        )}
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.youtubeId}
        renderItem={({ item }) => (
          <SongCard song={item} onPlay={playSong} />
        )}
        ListEmptyComponent={() => (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 100,
              gap: 12,
            }}
          >
            <Ionicons name="heart-outline" size={56} color={Colors.border} />
            <Text style={{ color: Colors.muted, fontSize: 15, fontWeight: "600" }}>
              No favorites yet
            </Text>
            <Text style={{ color: Colors.border, fontSize: 13, textAlign: "center" }}>
              {"Tap the heart on any song\nwhile searching to save it here."}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

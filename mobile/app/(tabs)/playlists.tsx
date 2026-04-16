import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLibraryStore } from "@/stores/libraryStore";
import { usePlayer } from "@/hooks/usePlayer";
import type { Playlist } from "@/types";

export default function PlaylistsScreen() {
  const insets = useSafeAreaInsets();
  const playlists = useLibraryStore((s) => s.playlists);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist);
  const { setQueue } = usePlayer();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createPlaylist(name);
    setNewName("");
    setShowCreate(false);
  };

  const handleDelete = (playlist: Playlist) => {
    Alert.alert("Delete playlist", `Delete "${playlist.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePlaylist(playlist.id),
      },
    ]);
  };

  const handlePlay = (playlist: Playlist) => {
    if (!playlist.songs.length) return;
    setQueue(playlist.songs, 0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ color: Colors.textPrimary, fontSize: 28, fontWeight: "800" }}>
            Playlists
          </Text>
          {playlists.length > 0 && (
            <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4 }}>
              {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: Colors.elevated,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Ionicons name="add" size={16} color={Colors.accent} />
          <Text style={{ color: Colors.accent, fontSize: 13, fontWeight: "600" }}>
            New
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePlay(item)}
            onLongPress={() => handleDelete(item)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 20,
              gap: 14,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                backgroundColor: Colors.elevated,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Ionicons name="musical-notes" size={22} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: "600" }}
              >
                {item.name}
              </Text>
              <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>
                {item.songs.length} {item.songs.length === 1 ? "song" : "songs"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.border} />
          </TouchableOpacity>
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
            <Ionicons name="library-outline" size={56} color={Colors.border} />
            <Text style={{ color: Colors.muted, fontSize: 15, fontWeight: "600" }}>
              No playlists yet
            </Text>
            <Text style={{ color: Colors.border, fontSize: 13, textAlign: "center" }}>
              {"Tap \"New\" to create your first playlist."}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Create playlist modal */}
      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCreate(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 32 }}
        >
          <TouchableOpacity activeOpacity={1}>
            <View
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 16,
                padding: 24,
                gap: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: "700" }}>
                New Playlist
              </Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Playlist name"
                placeholderTextColor={Colors.muted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                style={{
                  backgroundColor: Colors.elevated,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  color: Colors.textPrimary,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                }}
              />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowCreate(false)}
                  style={{ flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}
                >
                  <Text style={{ color: Colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreate}
                  style={{ flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: Colors.accent }}
                >
                  <Text style={{ color: "#000", fontWeight: "700" }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

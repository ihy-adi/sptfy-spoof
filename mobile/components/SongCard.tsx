import React, { useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Alert,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useLibraryStore } from "@/stores/libraryStore";
import { usePlayerStore } from "@/stores/playerStore";
import type { Song } from "@/types";

interface Props {
  song: Song;
  onPlay: (song: Song) => void;
  showFavoriteButton?: boolean;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function SongCard({ song, onPlay, showFavoriteButton = true }: Props) {
  const swipeableRef = useRef<Swipeable>(null);

  const isFavorite = useLibraryStore((s) => s.isFavorite(song.youtubeId));
  const addFavorite = useLibraryStore((s) => s.addFavorite);
  const removeFavorite = useLibraryStore((s) => s.removeFavorite);
  const playlists = useLibraryStore((s) => s.playlists);
  const addToPlaylist = useLibraryStore((s) => s.addToPlaylist);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playbackState = usePlayerStore((s) => s.playbackState);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const isActive = currentSong?.youtubeId === song.youtubeId;
  const isLoading = isActive && playbackState === "loading";

  const handleFavorite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFavorite) removeFavorite(song.youtubeId);
    else addFavorite(song);
  };

  const handlePlay = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlay(song);
  };

  const handleMore = () => {
    const playlistOptions = playlists.map((p) => p.name);
    const options = [
      "Add to Queue",
      ...(playlistOptions.length > 0 ? ["Add to Playlist →"] : []),
      "Cancel",
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          tintColor: Colors.accent,
        },
        (index) => {
          if (options[index] === "Add to Queue") {
            addToQueue(song);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (options[index] === "Add to Playlist →") {
            showPlaylistPicker();
          }
        }
      );
    } else {
      // Android fallback
      Alert.alert(song.title, undefined, [
        { text: "Add to Queue", onPress: () => addToQueue(song) },
        ...(playlistOptions.length > 0
          ? [{ text: "Add to Playlist →", onPress: showPlaylistPicker }]
          : []),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const showPlaylistPicker = () => {
    const options = [...playlists.map((p) => p.name), "Cancel"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Add to Playlist",
          options,
          cancelButtonIndex: options.length - 1,
          tintColor: Colors.accent,
        },
        (index) => {
          if (index < playlists.length) {
            addToPlaylist(playlists[index].id, song);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      );
    }
  };

  // Right swipe → Add to Queue
  const renderLeftActions = () => (
    <View
      style={{
        backgroundColor: Colors.accent,
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        marginVertical: 2,
        marginLeft: 8,
        borderRadius: 10,
      }}
    >
      <Ionicons name="add-circle-outline" size={24} color="#000" />
      <Text style={{ color: "#000", fontSize: 10, fontWeight: "700", marginTop: 2 }}>
        Queue
      </Text>
    </View>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={(direction) => {
        if (direction === "left") {
          addToQueue(song);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          swipeableRef.current?.close();
        }
      }}
      leftThreshold={60}
      friction={2}
      overshootLeft={false}
    >
      <TouchableOpacity
        onPress={handlePlay}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
          paddingHorizontal: 16,
          backgroundColor: isActive ? Colors.elevated : "transparent",
          borderRadius: 10,
          marginHorizontal: 8,
          marginVertical: 2,
        }}
      >
        {/* Thumbnail */}
        <View style={{ position: "relative", marginRight: 12 }}>
          <Image
            source={{ uri: song.thumbnail }}
            style={{ width: 52, height: 52, borderRadius: 6, backgroundColor: Colors.elevated }}
            resizeMode="cover"
          />
          {isLoading && (
            <View
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.6)",
                borderRadius: 6,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="small" color={Colors.accent} />
            </View>
          )}
          {isActive && !isLoading && (
            <View
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: Colors.accent,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="musical-note" size={9} color="#000" />
            </View>
          )}
        </View>

        {/* Text */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              color: isActive ? Colors.accent : Colors.textPrimary,
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 3,
            }}
          >
            {song.title}
          </Text>
          <Text numberOfLines={1} style={{ color: Colors.textSecondary, fontSize: 12 }}>
            {song.channel} · {formatDuration(song.durationS)}
          </Text>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginLeft: 8 }}>
          {showFavoriteButton && (
            <TouchableOpacity onPress={handleFavorite} hitSlop={8}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? Colors.accent : Colors.muted}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleMore} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={18} color={Colors.muted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

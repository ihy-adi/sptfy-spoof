import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { usePlayer, formatMs } from "@/hooks/usePlayer";
import { useLibraryStore } from "@/stores/libraryStore";

const { width: SCREEN_W } = Dimensions.get("window");
const ART_SIZE = SCREEN_W - 64;
const TRACK_W = SCREEN_W - 48;

export function PlayerModal({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const {
    currentSong,
    isPlaying,
    isLoading,
    positionMs,
    durationMs,
    timeRemainingMs,
    progressPercent,
    loopMode,
    shuffleMode,
    togglePlayPause,
    seekTo,
    playNext,
    playPrev,
    toggleLoop,
    toggleShuffle,
  } = usePlayer();

  const isFavorite = useLibraryStore((s) =>
    currentSong ? s.isFavorite(currentSong.youtubeId) : false
  );
  const addFavorite = useLibraryStore((s) => s.addFavorite);
  const removeFavorite = useLibraryStore((s) => s.removeFavorite);

  const artScale = useSharedValue(isPlaying ? 1 : 0.88);
  const artStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(artScale.value, { damping: 15, stiffness: 120 }) }],
  }));

  React.useEffect(() => {
    artScale.value = isPlaying ? 1 : 0.88;
  }, [isPlaying]);

  if (!currentSong) return null;

  const haptic = (style = Haptics.ImpactFeedbackStyle.Light) =>
    Haptics.impactAsync(style);

  const handleToggle = async () => {
    await haptic(Haptics.ImpactFeedbackStyle.Medium);
    await togglePlayPause();
  };

  const handleFavorite = async () => {
    await haptic();
    if (isFavorite) removeFavorite(currentSong.youtubeId);
    else addFavorite(currentSong);
  };

  const handleLoop = async () => {
    await haptic();
    toggleLoop();
  };

  const handleShuffle = async () => {
    await haptic();
    toggleShuffle();
  };

  const loopColor =
    loopMode === "off" ? Colors.muted : Colors.accent;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <LinearGradient
        colors={["#1a1a2e", Colors.bg]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Ionicons name="chevron-down" size={28} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity hitSlop={12}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.artContainer}>
        <Animated.View style={[styles.artWrapper, artStyle]}>
          <Image
            source={{ uri: currentSong.thumbnail }}
            style={styles.art}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Song info + favorite */}
      <View style={styles.infoRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.title}>
            {currentSong.title}
          </Text>
          <Text numberOfLines={1} style={styles.channel}>
            {currentSong.channel}
          </Text>
        </View>
        <TouchableOpacity onPress={handleFavorite} hitSlop={8}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={26}
            color={isFavorite ? Colors.accent : Colors.muted}
          />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { width: TRACK_W }]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => {
            const x = e.nativeEvent.locationX;
            const pct = Math.max(0, Math.min(1, x / TRACK_W));
            seekTo(Math.floor(pct * durationMs));
          }}
          style={styles.progressTouchArea}
        >
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progressPercent * 100}%` }]}
            />
            <View
              style={[styles.progressThumb, { left: `${progressPercent * 100}%` }]}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatMs(positionMs)}</Text>
          <Text style={styles.timeText}>
            -{formatMs(timeRemainingMs)}
          </Text>
        </View>
      </View>

      {/* Main controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={playPrev} hitSlop={12}>
          <Ionicons name="play-skip-back" size={32} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggle}
          disabled={isLoading}
          style={styles.playButton}
        >
          <Ionicons
            name={isLoading ? "hourglass" : isPlaying ? "pause" : "play"}
            size={36}
            color="#000"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} hitSlop={12}>
          <Ionicons name="play-skip-forward" size={32} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Secondary controls: shuffle / loop */}
      <View style={[styles.secondaryControls, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={handleShuffle} hitSlop={12} style={styles.secondaryBtn}>
          <Ionicons
            name="shuffle"
            size={22}
            color={shuffleMode ? Colors.accent : Colors.muted}
          />
          {shuffleMode && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLoop} hitSlop={12} style={styles.secondaryBtn}>
          {loopMode === "one" ? (
            <>
              <Ionicons name="repeat-outline" size={22} color={Colors.accent} />
              <Text style={styles.loopOneLabel}>1</Text>
            </>
          ) : (
            <>
              <Ionicons name="repeat-outline" size={22} color={loopColor} />
              {loopMode === "all" && <View style={styles.activeDot} />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  artContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  artWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 16,
    backgroundColor: Colors.elevated,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  channel: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  progressContainer: {
    alignSelf: "center",
    marginBottom: 24,
  },
  progressTouchArea: {
    height: 20,
    justifyContent: "center",
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -5,
    marginLeft: -6,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Colors.textPrimary,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    color: Colors.muted,
    fontSize: 12,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginBottom: 28,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  secondaryControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 56,
  },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  activeDot: {
    position: "absolute",
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  loopOneLabel: {
    position: "absolute",
    bottom: 2,
    fontSize: 9,
    fontWeight: "700",
    color: Colors.accent,
  },
});

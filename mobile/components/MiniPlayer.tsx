import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { usePlayer } from "@/hooks/usePlayer";

export function MiniPlayer() {
  const { currentSong, isPlaying, isLoading, progressPercent, togglePlayPause, playNext } =
    usePlayer();
  const router = useRouter();

  // Slide up from below when a song first loads
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (currentSong) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(80);
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [!!currentSong]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!currentSong) return null;

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await togglePlayPause();
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playNext();
  };

  return (
    <Animated.View style={[{ marginHorizontal: 8, marginBottom: 6 }, animStyle]}>
      <Pressable
        onPress={() => router.push("/player")}
        style={{
          borderRadius: 14,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <BlurView
          intensity={80}
          tint="dark"
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: 14, // extra room for the progress bar
            gap: 12,
          }}
        >
          {/* Thumbnail */}
          <Image
            source={{ uri: currentSong.thumbnail }}
            style={{ width: 40, height: 40, borderRadius: 6 }}
          />

          {/* Title */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: "600" }}
            >
              {currentSong.title}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: Colors.textSecondary, fontSize: 11 }}
            >
              {currentSong.channel}
            </Text>
          </View>

          {/* Controls */}
          <TouchableOpacity onPress={handleToggle} hitSlop={8} disabled={isLoading}>
            <Ionicons
              name={isLoading ? "hourglass" : isPlaying ? "pause" : "play"}
              size={24}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} hitSlop={8}>
            <Ionicons name="play-skip-forward" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </BlurView>

        {/* Progress bar — sits at the very bottom of the card */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: Colors.border,
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${progressPercent * 100}%`,
              backgroundColor: Colors.accent,
              borderRadius: 1,
            }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

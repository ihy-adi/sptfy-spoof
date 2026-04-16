import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { PlayerModal } from "@/components/PlayerModal";

export default function PlayerScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <PlayerModal onClose={() => router.back()} />
    </View>
  );
}

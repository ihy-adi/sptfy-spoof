import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { MiniPlayer } from "@/components/MiniPlayer";
import { usePlayerStore } from "@/stores/playerStore";

function TabBarIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const hasActiveTrack = usePlayerStore((s) => s.currentSong !== null);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.tabBar,
            borderTopColor: Colors.tabBarBorder,
            borderTopWidth: 1,
            paddingTop: 4,
            // Don't let tab bar overlap mini player
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.muted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Search",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="search" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="heart" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: "Playlists",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="library" color={color} />
            ),
          }}
        />
      </Tabs>

      {/* MiniPlayer sits above tab bar */}
      {hasActiveTrack && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 56 + insets.bottom,
          }}
        >
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

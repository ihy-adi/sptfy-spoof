import React, { useRef, useState } from "react";
import {
  TextInput,
  View,
  TouchableOpacity,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search songs, artists…",
}: Props) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.elevated,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: focused ? Colors.accent : Colors.border,
        paddingHorizontal: 12,
        height: 46,
      }}
    >
      <Ionicons
        name="search"
        size={18}
        color={focused ? Colors.accent : Colors.muted}
        style={{ marginRight: 8 }}
      />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={() => {
          if (value.trim()) onSubmit(value.trim());
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={{
          flex: 1,
          color: Colors.textPrimary,
          fontSize: 15,
          paddingVertical: 0,
          fontWeight: "400",
        }}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={Colors.muted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

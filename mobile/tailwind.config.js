/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#161616",
        elevated: "#1e1e1e",
        border: "#2a2a2a",
        accent: "#1DB954",       // Spotify green
        "accent-dim": "#158a3e",
        muted: "#6b7280",
        textPrimary: "#ffffff",
        textSecondary: "#9ca3af",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};

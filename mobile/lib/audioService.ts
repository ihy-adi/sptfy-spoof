/**
 * audioService — singleton expo-av Audio instance.
 *
 * Responsibilities:
 *  - Configure audio session once at app start (background, lock screen)
 *  - Load / play / pause / seek a stream URL
 *  - Emit status updates to registered listeners
 */

import { Audio, type AVPlaybackStatus } from "expo-av";

type StatusListener = (status: AVPlaybackStatus) => void;

class AudioService {
  private sound: Audio.Sound | null = null;
  private listeners: Set<StatusListener> = new Set();
  private configured = false;

  async configure() {
    if (this.configured) return;
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,         // keep playing when app is backgrounded
      playsInSilentModeIOS: true,            // play even when mute switch is on
      allowsRecordingIOS: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    this.configured = true;
  }

  addListener(fn: StatusListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private broadcast(status: AVPlaybackStatus) {
    this.listeners.forEach((fn) => fn(status));
  }

  async loadAndPlay(url: string, isLooping = false): Promise<void> {
    await this.configure();

    // Unload previous track
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      {
        shouldPlay: true,
        isLooping,
        progressUpdateIntervalMillis: 500,
        androidImplementation: "MediaPlayer",
      },
      (status) => this.broadcast(status)
    );

    this.sound = sound;
  }

  async setLooping(isLooping: boolean) {
    await this.sound?.setIsLoopingAsync(isLooping);
  }

  async play() {
    await this.sound?.playAsync();
  }

  async pause() {
    await this.sound?.pauseAsync();
  }

  async seekTo(positionMs: number) {
    await this.sound?.setPositionAsync(positionMs);
  }

  async setRate(rate: number) {
    await this.sound?.setRateAsync(rate, true);
  }

  async unload() {
    await this.sound?.unloadAsync();
    this.sound = null;
  }

  getSound() {
    return this.sound;
  }
}

export const audioService = new AudioService();

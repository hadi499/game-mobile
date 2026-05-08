import { Audio } from 'expo-av';
import { useEffect, useRef, useCallback } from 'react';

const soundAssets = {
  benar: require('../assets/sounds/benar.mp3'),
  wrong: require('../assets/sounds/wrong.mp3'),
  tepukTangan: require('../assets/sounds/tepuk-tangan.mp3'),
};

const bgmAsset = require('../assets/sounds/bgm.mp3');

type SoundName = keyof typeof soundAssets;

export function useSound() {
  const soundsRef = useRef<Record<string, Audio.Sound | null>>({});
  const bgmRef = useRef<Audio.Sound | null>(null);
  const loadedRef = useRef(false);

  // Preload all sounds on mount
  useEffect(() => {
    let cancelled = false;

    async function loadSounds() {
      try {
        // Set audio mode for playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });

        for (const [key, asset] of Object.entries(soundAssets)) {
          if (cancelled) return;
          try {
            const { sound } = await Audio.Sound.createAsync(asset);
            soundsRef.current[key] = sound;
          } catch (e) {
            // If a sound fails to load, continue without it
            console.warn(`Failed to load sound: ${key}`, e);
            soundsRef.current[key] = null;
          }
        }

        // Preload BGM (looping, lower volume)
        if (!cancelled) {
          try {
            const { sound: bgm } = await Audio.Sound.createAsync(bgmAsset, {
              isLooping: true,
              volume: 0.35,
            });
            bgmRef.current = bgm;
          } catch (e) {
            console.warn('Failed to load BGM', e);
            bgmRef.current = null;
          }
        }

        loadedRef.current = true;
      } catch (e) {
        console.warn('Failed to set audio mode', e);
      }
    }

    loadSounds();

    return () => {
      cancelled = true;
      // Unload all sounds on unmount
      for (const sound of Object.values(soundsRef.current)) {
        if (sound) {
          sound.unloadAsync().catch(() => {});
        }
      }
      if (bgmRef.current) {
        bgmRef.current.stopAsync().catch(() => {});
        bgmRef.current.unloadAsync().catch(() => {});
        bgmRef.current = null;
      }
      soundsRef.current = {};
      loadedRef.current = false;
    };
  }, []);

  const play = useCallback(async (name: SoundName) => {
    try {
      const sound = soundsRef.current[name];
      if (!sound) return;

      // Rewind to start before playing (in case it's already been played)
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (e) {
      // Silently fail — game continues without sound
      console.warn(`Failed to play sound: ${name}`, e);
    }
  }, []);

  const playBenar = useCallback(() => play('benar'), [play]);
  const playWrong = useCallback(() => play('wrong'), [play]);
  const playTepukTangan = useCallback(() => play('tepukTangan'), [play]);

  const playBgm = useCallback(async () => {
    try {
      const bgm = bgmRef.current;
      if (!bgm) return;
      await bgm.setPositionAsync(0);
      await bgm.playAsync();
    } catch (e) {
      console.warn('Failed to play BGM', e);
    }
  }, []);

  const stopBgm = useCallback(async () => {
    try {
      const bgm = bgmRef.current;
      if (!bgm) return;
      await bgm.stopAsync();
    } catch (e) {
      console.warn('Failed to stop BGM', e);
    }
  }, []);

  return { playBenar, playWrong, playTepukTangan, playBgm, stopBgm };
}

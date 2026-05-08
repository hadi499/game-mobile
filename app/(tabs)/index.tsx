import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const MAX_CONTENT_WIDTH = 600;

const COLORS = {
  bg: "#F8F0FF",
  primary: "#7C3AED",
  primaryLight: "#C4B5FD",
  accent: "#FF6B9D",
  accentLight: "#FFD6E5",
  yellow: "#FFD93D",
  yellowDark: "#E6B800",
  teal: "#4ECDC4",
  tealDark: "#2D9B93",
  white: "#FFFFFF",
  text: "#1E1B4B",
  textSecondary: "#6B7280",
  cardShadow: "#C4B5FD",
};

// Animated floating decoration
function FloatingDecor({
  emoji,
  size,
  left,
  top,
  delay: delayMs,
}: {
  emoji: string;
  size: number;
  left: number;
  top: number;
  delay: number;
}) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    rotate.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(10, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[{ position: "absolute", left, top, zIndex: 0 }, animStyle]}
    >
      <Text style={{ fontSize: size, opacity: 0.3 }}>{emoji}</Text>
    </Animated.View>
  );
}

// Game card component
function GameCard({
  emoji,
  title,
  subtitle,
  colors,
  onPress,
  index,
  disabled,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  colors: { bg: string; border: string; shadow: string; text: string };
  onPress: () => void;
  index: number;
  disabled?: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(200 + index * 120)
        .springify()
        .damping(14)}
    >
      <TouchableOpacity
        style={[
          styles.gameCard,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            boxShadow: `0px 6px 12px ${colors.shadow}80`,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <View style={styles.gameCardContent}>
          <Text style={styles.gameCardEmoji}>{emoji}</Text>
          <View style={styles.gameCardTextArea}>
            <Text style={[styles.gameCardTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={styles.gameCardSubtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.playBadge, { backgroundColor: colors.text }]}>
            <Text style={styles.playBadgeText}>▶</Text>
          </View>
        </View>
        {disabled && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Segera</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Loading dot animation
function LoadingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-14, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.loadingDot, animStyle]} />;
}

// Splash loading overlay
function SplashOverlay() {
  const scale = useSharedValue(0.2);
  const emojiOpacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    emojiOpacity.value = withTiming(1, { duration: 500 });
    rotate.value = withSequence(
      withTiming(-12, { duration: 200 }),
      withTiming(12, { duration: 200 }),
      withTiming(-6, { duration: 150 }),
      withTiming(0, { duration: 150 }),
    );
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    const fadeTimer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: 400 });
    }, 2000);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    opacity: emojiOpacity.value,
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.splashOverlay, containerStyle]}>
      <View style={[styles.splashCircle, styles.splashCircle1]} />
      <View style={[styles.splashCircle, styles.splashCircle2]} />
      <View style={[styles.splashCircle, styles.splashCircle3]} />
      <Animated.Text style={[styles.splashEmoji, emojiStyle]}>🎮</Animated.Text>
      <Animated.Text style={[styles.splashTitle, textStyle]}>
        Ayo Bermain!
      </Animated.Text>
      <Animated.View style={[styles.loadingDotsRow, textStyle]}>
        <LoadingDot delay={0} />
        <LoadingDot delay={150} />
        <LoadingDot delay={300} />
      </Animated.View>
    </Animated.View>
  );
}

// Unique ID generated every time this file is evaluated (Hot Reload)
const MODULE_EVALUATION_ID = Date.now();

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [splashKey, setSplashKey] = useState(MODULE_EVALUATION_ID);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSplashKey(Date.now());
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Splash loading overlay - will remount and play animation on every Fast Refresh */}
      <SplashOverlay key={splashKey} />

      {/* Floating decorations */}
      <FloatingDecor
        emoji="🎈"
        size={40}
        left={screenWidth - 70}
        top={80}
        delay={0}
      />
      <FloatingDecor emoji="⭐" size={30} left={20} top={140} delay={500} />
      <FloatingDecor
        emoji="🦋"
        size={35}
        left={screenWidth - 90}
        top={320}
        delay={1000}
      />
      <FloatingDecor emoji="🌈" size={32} left={30} top={460} delay={1500} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
            title="Tarik untuk refresh..."
            titleColor={COLORS.textSecondary}
          />
        }
      >
        {/* Tablet wrapper - membatasi lebar konten */}
        <View style={styles.tabletWrapper}>
        {/* Hero section */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>🎮</Text>
          <Text style={styles.heroTitle}>Ayo Bermain!</Text>
          <Text style={styles.heroSubtitle}>
            Pilih permainan seru dan belajar sambil bermain
          </Text>
        </Animated.View>

        {/* Games list */}
        <View style={styles.gamesList}>
          {/* Section: Hitung Benda */}
          <Text style={styles.sectionTitle}>🔢 Hitung Benda</Text>

          <GameCard
            emoji="🔢"
            title="Hitung Benda"
            subtitle="Hitung jumlah emoji dan pilih jawaban yang benar! (1-10)"
            colors={{
              bg: "#FFF0F5",
              border: "#FFD6E5",
              shadow: "#FFB6D0",
              text: "#FF6B9D",
            }}
            onPress={() => router.push("/counting-game" as any)}
            index={0}
          />

          <GameCard
            emoji="🔢"
            title="Hitung Benda (Sulit)"
            subtitle="Tantangan lebih sulit! Hitung emoji 11-20."
            colors={{
              bg: "#EEF2FF",
              border: "#C7D2FE",
              shadow: "#A5B4FC",
              text: "#6366F1",
            }}
            onPress={() => router.push("/counting-game-hard" as any)}
            index={1}
          />

          {/* Section: Tabel Schulte */}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
            🧮 Tabel Schulte
          </Text>

          <GameCard
            emoji="🧮"
            title="Tabel Schulte"
            subtitle="Temukan angka 1-25 berurutan secepat mungkin!"
            colors={{
              bg: "#F0F9FF",
              border: "#BAE6FD",
              shadow: "#7DD3FC",
              text: "#0EA5E9",
            }}
            onPress={() => router.push("/schulte-game" as any)}
            index={2}
          />

          <GameCard
            emoji="🔬"
            title="Schulte Prima"
            subtitle="Urutkan 25 bilangan prima (2-97) secepat mungkin!"
            colors={{
              bg: "#F5F3FF",
              border: "#DDD6FE",
              shadow: "#C4B5FD",
              text: "#8B5CF6",
            }}
            onPress={() => router.push("/schulte-prime-game" as any)}
            index={3}
          />

          {/* Section: Memory Game */}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
            🃏 Memory Game
          </Text>

          <GameCard
            emoji="🐱"
            title="Memory 4 Gambar - Hewan"
            subtitle="Hafal posisi 4 gambar hewan lalu tebak!"
            colors={{
              bg: "#FFFBEB",
              border: "#FDE68A",
              shadow: "#FCD34D",
              text: "#D97706",
            }}
            onPress={() =>
              router.push("/memory-game?theme=animals&count=4" as any)
            }
            index={4}
          />

          <GameCard
            emoji="🖼️"
            title="Memory 4 Gambar Asli"
            subtitle="Hafal posisi gambar PNG asli lalu tebak!"
            colors={{
              bg: "#F0FDF4",
              border: "#BBF7D0",
              shadow: "#86EFAC",
              text: "#16A34A",
            }}
            onPress={() =>
              router.push("/memory-game-image?theme=fruits&count=4" as any)
            }
            index={4.5}
          />

          <GameCard
            emoji="🍎"
            title="Memory 4 Gambar - Buah"
            subtitle="Hafal posisi 4 gambar buah lalu tebak!"
            colors={{
              bg: "#FEF2F2",
              border: "#FECACA",
              shadow: "#FCA5A5",
              text: "#EF4444",
            }}
            onPress={() =>
              router.push("/memory-game?theme=fruits&count=4" as any)
            }
            index={5}
          />

          <GameCard
            emoji="🚗"
            title="Memory 4 Gambar - Kendaraan"
            subtitle="Hafal posisi 4 gambar kendaraan lalu tebak!"
            colors={{
              bg: "#EFF6FF",
              border: "#BFDBFE",
              shadow: "#93C5FD",
              text: "#3B82F6",
            }}
            onPress={() =>
              router.push("/memory-game?theme=vehicles&count=4" as any)
            }
            index={6}
          />

          <GameCard
            emoji="🐶"
            title="Memory 6 Gambar - Hewan"
            subtitle="Tantangan lebih sulit! Hafal posisi 6 gambar hewan."
            colors={{
              bg: "#FFFBEB",
              border: "#FDE68A",
              shadow: "#FCD34D",
              text: "#B45309",
            }}
            onPress={() =>
              router.push("/memory-game?theme=animals&count=6" as any)
            }
            index={7}
          />

          <GameCard
            emoji="🍓"
            title="Memory 6 Gambar - Buah"
            subtitle="Tantangan lebih sulit! Hafal posisi 6 gambar buah."
            colors={{
              bg: "#FEF2F2",
              border: "#FECACA",
              shadow: "#FCA5A5",
              text: "#DC2626",
            }}
            onPress={() =>
              router.push("/memory-game?theme=fruits&count=6" as any)
            }
            index={8}
          />

          <GameCard
            emoji="🚌"
            title="Memory 6 Gambar - Kendaraan"
            subtitle="Tantangan lebih sulit! Hafal posisi 6 kendaraan."
            colors={{
              bg: "#EFF6FF",
              border: "#BFDBFE",
              shadow: "#93C5FD",
              text: "#2563EB",
            }}
            onPress={() =>
              router.push("/memory-game?theme=vehicles&count=6" as any)
            }
            index={9}
          />
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
    alignItems: "center",
  },
  tabletWrapper: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
  },

  // Hero
  hero: {
    alignItems: "center",
    marginBottom: 32,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },

  // Games list
  gamesList: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: -4,
  },
  gameCard: {
    borderRadius: 24,
    borderWidth: 2.5,
    padding: 20,
    elevation: 6,
    overflow: "hidden",
  },
  gameCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  gameCardEmoji: {
    fontSize: 44,
  },
  gameCardTextArea: {
    flex: 1,
    gap: 4,
  },
  gameCardTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  gameCardSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  playBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playBadgeText: {
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 2,
  },
  comingSoonBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  // Splash overlay
  splashOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  splashCircle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.12,
  },
  splashCircle1: {
    width: 300,
    height: 300,
    backgroundColor: "#A78BFA",
    top: -80,
    left: -60,
  },
  splashCircle2: {
    width: 250,
    height: 250,
    backgroundColor: "#C4B5FD",
    bottom: -50,
    right: -40,
  },
  splashCircle3: {
    width: 180,
    height: 180,
    backgroundColor: "#FFD93D",
    bottom: 200,
    right: -30,
  },
  splashEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 24,
  },
  loadingDotsRow: {
    flexDirection: "row",
    gap: 10,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFD93D",
  },
});

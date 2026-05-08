import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn
} from "react-native-reanimated";
import { useSound } from "../hooks/useSound";

const MAX_CONTENT_WIDTH = 600;
const GRID_SIZE = 25;
const COLS = 5;
const GRID_GAP = 5;
const GRID_PADDING = 8;
const OUTER_PADDING = 20;

const COLORS = {
  bg: "#F0F9FF",
  primary: "#0EA5E9",
  primaryDark: "#0284C7",
  primaryLight: "#BAE6FD",
  primarySuperLight: "#E0F2FE",
  accent: "#10B981",
  accentDark: "#059669",
  white: "#FFFFFF",
  cardBorder: "#BAE6FD",
  text: "#0C4A6E",
  textSecondary: "#0369A1",
  cellBg: "#FFFFFF",
  cellBorder: "#7DD3FC",
  cellFound: "#E0F2FE",
  cellFoundText: "#7DD3FC",
  error: "#EF4444",
  shadow: "#7DD3FC",
};

function shuffleArray(arr: number[]) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Animated grid cell
function GridCell({
  number,
  isFound,
  isWrong,
  onPress,
  disabled,
  cellSize,
}: {
  number: number;
  isFound: boolean;
  isWrong: boolean;
  onPress: () => void;
  disabled: boolean;
  cellSize: number;
}) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isWrong) {
      translateX.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [isWrong]);

  useEffect(() => {
    if (isFound) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 8 }),
        withSpring(1, { damping: 12 }),
      );
    }
  }, [isFound]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || isFound}
    >
      <Animated.View
        style={[
          styles.gridCell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: isWrong
              ? COLORS.error
              : isFound
                ? COLORS.cellFound
                : COLORS.cellBg,
            borderColor: isWrong
              ? COLORS.error
              : isFound
                ? "#E2E8F0"
                : COLORS.cellBorder,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={[
            styles.gridCellText,
            {
              color: isWrong
                ? COLORS.white
                : isFound
                  ? COLORS.cellFoundText
                  : COLORS.text,
            },
          ]}
        >
          {number}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function SchulteGameScreen() {
  const { playTepukTangan, playBgm, stopBgm } = useSound();
  const [grid, setGrid] = useState<number[]>([]);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [wrongIndex, setWrongIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  // Kalkulasi cell size dinamis untuk tablet
  const effectiveWidth = Math.min(screenWidth, MAX_CONTENT_WIDTH);
  const cellSize = Math.min(
    Math.floor(
      (effectiveWidth -
        OUTER_PADDING * 2 -
        GRID_PADDING * 2 -
        (COLS - 1) * GRID_GAP) /
        COLS,
    ),
    70,
  );

  const initGame = useCallback(() => {
    const numbers = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
    setGrid(shuffleArray(numbers));
    setCurrentTarget(1);
    setTime(0);
    setIsPlaying(false);
    setIsGameOver(false);
    setWrongIndex(-1);

    if (timerRef.current) clearInterval(timerRef.current);
    stopBgm();
  }, [stopBgm]);

  const startGame = useCallback(() => {
    setIsPlaying(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);

    // Start background music
    playBgm();
  }, [playBgm]);

  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopBgm();
    };
  }, [initGame, stopBgm]);

  const handleCellClick = useCallback(
    (number: number, index: number) => {
      if (!isPlaying || isGameOver) return;

      if (number === currentTarget) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const next = currentTarget + 1;
        if (next > GRID_SIZE) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsGameOver(true);
          setIsPlaying(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          stopBgm();
          playTepukTangan();
        }
        setCurrentTarget(next);
      } else {
        setWrongIndex(index);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => setWrongIndex(-1), 400);
      }
    },
    [currentTarget, isPlaying, isGameOver],
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getTimeRating = () => {
    if (time <= 30) return { emoji: "🏆", message: "Luar biasa cepat!" };
    if (time <= 60) return { emoji: "🥇", message: "Hebat sekali!" };
    if (time <= 90) return { emoji: "🎉", message: "Bagus!" };
    if (time <= 120) return { emoji: "👍", message: "Lumayan!" };
    return { emoji: "💪", message: "Terus berlatih!" };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Tablet wrapper */}
        <View style={styles.tabletWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Tabel Schulte</Text>

            <TouchableOpacity
              style={styles.restartButton}
              onPress={initGame}
              activeOpacity={0.7}
            >
              <Text style={styles.restartIcon}>↻</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <Animated.View
            entering={FadeIn.delay(100)}
            style={styles.instructionCard}
          >
            <Text style={styles.instructionText}>
              Temukan dan klik angka berurutan dari{" "}
              <Text style={styles.instructionBold}>1 hingga 25</Text> secepat
              mungkin!
            </Text>
          </Animated.View>

          {/* HUD */}
          <View style={styles.hudRow}>
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>CARI ANGKA</Text>
              <Text style={styles.hudValue}>
                {currentTarget <= GRID_SIZE ? currentTarget : "✅"}
              </Text>
            </View>
            <View style={styles.hudDivider} />
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>STOPWATCH</Text>
              <Text style={styles.hudTimer}>{formatTime(time)}</Text>
            </View>
          </View>

          {/* Grid 5x5 */}
          <View style={styles.gridContainer}>
            {Array.from({ length: COLS }).map((_, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.gridRow}>
                {grid
                  .slice(rowIndex * COLS, rowIndex * COLS + COLS)
                  .map((number, colIndex) => {
                    const index = rowIndex * COLS + colIndex;
                    return (
                      <GridCell
                        key={`${number}-${index}`}
                        number={number}
                        isFound={number < currentTarget}
                        isWrong={wrongIndex === index}
                        onPress={() => handleCellClick(number, index)}
                        disabled={!isPlaying}
                        cellSize={cellSize}
                      />
                    );
                  })}
              </View>
            ))}
            
            {!isPlaying && !isGameOver && (
              <View style={styles.startOverlay}>
                <TouchableOpacity
                  style={styles.startOverlayButton}
                  onPress={startGame}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startOverlayText}>▶ MULAI</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Game Over Modal */}
      <Modal
        visible={isGameOver}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            style={styles.modalCard}
          >
            <Text style={styles.trophyEmoji}>{getTimeRating().emoji}</Text>
            <Text style={styles.congratsTitle}>Terselesaikan!</Text>
            <Text style={styles.congratsSubtitle}>
              {getTimeRating().message}
            </Text>

            <View style={styles.timeResultCard}>
              <Text style={styles.timeResultLabel}>Waktu Kamu:</Text>
              <Text style={styles.timeResultValue}>{formatTime(time)}</Text>
            </View>

            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={initGame}
              activeOpacity={0.8}
            >
              <Text style={styles.playAgainText}>Main Lagi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.homeButtonText}>Kembali ke Beranda</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 100,
    alignItems: "center",
  },
  tabletWrapper: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  restartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  restartIcon: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.accent,
  },

  // Instruction
  instructionCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FEF3C7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  instructionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    textAlign: "center",
  },
  instructionBold: {
    fontWeight: "900",
    color: "#78350F",
    fontSize: 15,
  },

  // HUD
  hudRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.6)",
    marginBottom: 20,
    alignItems: "center",
  },
  hudItem: {
    flex: 1,
    alignItems: "center",
  },
  hudLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  hudValue: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.accent,
  },
  hudTimer: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  hudDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.cardBorder,
  },

  // Start Overlay
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  startOverlayButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },
  startOverlayText: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 1,
  },

  // Grid
  gridContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: GRID_PADDING,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: GRID_GAP,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: GRID_GAP,
  },
  gridCell: {
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCellText: {
    fontSize: 24,
    fontWeight: "800",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 32,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    boxShadow: `0px 12px 24px rgba(0,0,0,0.15)`,
    elevation: 12,
  },
  trophyEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 4,
  },
  congratsSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  timeResultCard: {
    backgroundColor: COLORS.primarySuperLight,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginBottom: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  timeResultLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timeResultValue: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.primary,
    fontVariant: ["tabular-nums"],
  },
  playAgainButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 12,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
  },
  homeButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: COLORS.cellFound,
    borderRadius: 16,
    alignItems: "center",
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
});

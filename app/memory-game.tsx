import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
  ZoomIn,
  BounceIn,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Themes with emoji sets and colors matching homepage
const THEMES: Record<string, { name: string; emoji: string[]; color: string; colorLight: string; colorDark: string; bg: string; border: string; shadow: string; text: string }> = {
  animals: {
    name: 'Hewan',
    emoji: ['🐶', '🐱', '🐰', '🐻', '🦊', '🐸'],
    color: '#F59E0B',
    colorLight: '#FEF3C7',
    colorDark: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    shadow: '#FCD34D',
    text: '#D97706',
  },
  fruits: {
    name: 'Buah',
    emoji: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍌'],
    color: '#EF4444',
    colorLight: '#FEE2E2',
    colorDark: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    shadow: '#FCA5A5',
    text: '#EF4444',
  },
  vehicles: {
    name: 'Kendaraan',
    emoji: ['🚗', '🚌', '🚂', '🚀', '🚁', '🏎️'],
    color: '#3B82F6',
    colorLight: '#DBEAFE',
    colorDark: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    shadow: '#93C5FD',
    text: '#3B82F6',
  },
};

type GameState = 'start' | 'memorize' | 'guessing' | 'result';

interface Card {
  id: number;
  number: number;
  emoji: string;
}

const COLORS = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  cardBorder: '#E2E8F0',
  success: '#10B981',
  error: '#EF4444',
  shadow: '#94A3B8',
};

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Card component with flip animation
function MemoryCard({
  card,
  isFlipped,
  onPress,
  disabled,
  themeColor,
  cardSize,
}: {
  card: Card;
  isFlipped: boolean;
  onPress: () => void;
  disabled: boolean;
  themeColor: string;
  cardSize: number;
}) {
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotateY.value = withTiming(isFlipped ? 180 : 0, { duration: 400 });
  }, [isFlipped]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotateY.value}deg` }],
    backfaceVisibility: 'hidden' as const,
    opacity: rotateY.value < 90 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotateY.value - 180}deg` }],
    backfaceVisibility: 'hidden' as const,
    opacity: rotateY.value >= 90 ? 1 : 0,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[{ width: cardSize, height: cardSize }, containerStyle]}>
        {/* Front - shows emoji */}
        <Animated.View
          style={[
            styles.cardFace,
            {
              width: cardSize,
              height: cardSize,
              borderColor: COLORS.cardBorder,
            },
            frontStyle,
          ]}
        >
          <Text style={[styles.cardEmoji, { fontSize: cardSize * 0.45 }]}>
            {card.emoji}
          </Text>
        </Animated.View>

        {/* Back - shows number */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardBack,
            {
              width: cardSize,
              height: cardSize,
              backgroundColor: themeColor,
              borderColor: themeColor,
            },
            backStyle,
          ]}
        >
          <Text style={[styles.cardNumber, { fontSize: cardSize * 0.4 }]}>
            {card.number}
          </Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Floating blob background decoration
function FloatingBlob({
  color,
  size,
  initialX,
  initialY,
  delay: delayMs,
}: {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  delay: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const blobScale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
          withTiming(-20, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    translateY.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-50, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    blobScale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.9, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const animatedBlobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: blobScale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: initialX,
          top: initialY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.35,
        },
        animatedBlobStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export default function MemoryGameScreen() {
  const params = useLocalSearchParams<{ theme?: string; count?: string }>();
  const themeKey = params.theme || 'animals';
  const cardCount = parseInt(params.count || '4', 10);

  const theme = THEMES[themeKey] || THEMES.animals;
  const emojis = theme.emoji.slice(0, cardCount);
  const CARD_GAP = 10;
  const OUTER_PADDING = 16;
  const CARD_PADDING = 14;

  const [gameState, setGameState] = useState<GameState>('start');
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');
  const [targetCard, setTargetCard] = useState<Card | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedTime, setSelectedTime] = useState(10);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(emojis);
    const newCards = shuffled.map((emoji, index) => ({
      id: index + 1,
      number: index + 1,
      emoji,
    }));

    setCards(newCards);
    setTargetCard(newCards[Math.floor(Math.random() * newCards.length)]);
    setGameState('memorize');
    setCountdown(selectedTime);
    setMessage('Hafalkan posisi gambar-gambar ini!');
    setIsCorrect(null);
  }, [emojis, selectedTime]);

  // Countdown timer for memorize phase
  useEffect(() => {
    if (gameState === 'memorize' && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => {
        if (countdownRef.current) clearTimeout(countdownRef.current);
      };
    } else if (gameState === 'memorize' && countdown === 0) {
      setGameState('guessing');
      setMessage('Di nomor berapakah gambar ini berada?');
    }
  }, [gameState, countdown]);

  const handleGuess = useCallback(
    (card: Card) => {
      if (gameState !== 'guessing' || !targetCard) return;

      if (card.id === targetCard.id) {
        setMessage(`Benar sekali! Gambar itu ada di nomor ${card.number}.`);
        setIsCorrect(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setMessage(`Salah! Gambar yang benar ada di nomor ${targetCard.number}.`);
        setIsCorrect(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setGameState('result');
    },
    [gameState, targetCard]
  );

  // 2 columns: screenWidth - outer padding*2 - card padding*2 - gap
  const cardSize = Math.floor((SCREEN_WIDTH - OUTER_PADDING * 2 - CARD_PADDING * 2 - CARD_GAP) / 2);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Floating blob decorations */}
      <FloatingBlob
        color={theme.colorLight}
        size={250}
        initialX={-80}
        initialY={-60}
        delay={0}
      />
      <FloatingBlob
        color={theme.border}
        size={280}
        initialX={SCREEN_WIDTH - 120}
        initialY={500}
        delay={2000}
      />
      <FloatingBlob
        color={theme.shadow}
        size={200}
        initialX={SCREEN_WIDTH / 2 - 100}
        initialY={200}
        delay={1000}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { borderColor: theme.border, boxShadow: `0px 2px 4px ${theme.shadow}80` }
            ]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backIcon, { color: theme.color }]}>‹</Text>
          </TouchableOpacity>
        </View>

        <View style={[
          styles.gameCard,
          { borderColor: theme.border, boxShadow: `0px 4px 12px ${theme.shadow}80` }
        ]}>
          <Text style={styles.gameTitle}>
            Game {cardCount} Gambar
          </Text>
          <Text style={[styles.gameSubtitle, { color: theme.color }]}>
            {theme.name}
          </Text>

          {/* Game content area */}
          <View style={styles.gameContent}>
            {gameState === 'start' && (
              <Animated.View entering={FadeIn} style={styles.startContent}>
                <Text style={styles.readyText}>Sudah siap bermain?</Text>

                {/* Time selector */}
                <View style={[styles.timeSelector, { backgroundColor: theme.colorLight }]}>
                  <Text style={[styles.timeSelectorLabel, { color: theme.colorDark }]}>
                    Pilih Waktu Menghafal:
                  </Text>
                  <View style={styles.timeOptions}>
                    {[10, 7, 5].map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeButton,
                          selectedTime === time
                            ? { backgroundColor: theme.color, borderColor: theme.color }
                            : { backgroundColor: COLORS.white, borderColor: theme.color },
                        ]}
                        onPress={() => setSelectedTime(time)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.timeButtonText,
                            { color: selectedTime === time ? COLORS.white : theme.color },
                          ]}
                        >
                          {time} Detik
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.startButton, { backgroundColor: '#F97316' }]}
                  onPress={startGame}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startButtonText}>▶ MULAI MAIN</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {gameState === 'memorize' && (
              <Animated.View entering={FadeIn} style={styles.memorizeContent}>
                <Text style={styles.memorizeText}>{message}</Text>
                <Text style={styles.countdownText}>
                  Waktu: {countdown} detik
                </Text>
              </Animated.View>
            )}

            {(gameState === 'guessing' || gameState === 'result') && (
              <Animated.View entering={FadeIn} style={styles.guessContent}>
                <Text
                  style={[
                    styles.guessMessage,
                    {
                      color:
                        gameState === 'result'
                          ? isCorrect
                            ? COLORS.success
                            : COLORS.error
                          : COLORS.text,
                    },
                  ]}
                >
                  {message}
                </Text>

                {targetCard && (
                  <View style={[styles.targetEmojiContainer, { borderColor: theme.color }]}>
                    <Text style={styles.targetEmoji}>{targetCard.emoji}</Text>
                  </View>
                )}

                {gameState === 'result' && (
                  <TouchableOpacity
                    style={[styles.playAgainSmall, { backgroundColor: COLORS.success }]}
                    onPress={startGame}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.playAgainSmallText}>Main Lagi</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </View>

          {/* Card Grid - 2 columns */}
          {gameState !== 'start' && (
            <View style={styles.cardGrid}>
              {/* Render rows of 2 */}
              {Array.from({ length: Math.ceil(cards.length / 2) }).map((_, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.cardRow}>
                  {cards.slice(rowIndex * 2, rowIndex * 2 + 2).map((card, colIndex) => (
                    <Animated.View
                      key={`card-${card.id}`}
                      entering={ZoomIn.delay((rowIndex * 2 + colIndex) * 80).springify().damping(12)}
                    >
                      <MemoryCard
                        card={card}
                        isFlipped={gameState === 'guessing'}
                        onPress={() => handleGuess(card)}
                        disabled={gameState !== 'guessing'}
                        themeColor={theme.color}
                        cardSize={cardSize}
                      />
                    </Animated.View>
                  ))}
                </View>
              ))}
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    elevation: 2,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: -2,
  },

  // Game Card
  gameCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  gameSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },

  // Game content
  gameContent: {
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },

  // Start screen
  startContent: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  readyText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  timeSelector: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  timeSelectorLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  timeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  startButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Memorize screen
  memorizeContent: {
    alignItems: 'center',
    gap: 8,
  },
  memorizeText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  countdownText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.error,
  },

  // Guess screen
  guessContent: {
    alignItems: 'center',
    gap: 12,
  },
  guessMessage: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 22,
  },
  targetEmojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetEmoji: {
    fontSize: 44,
  },
  playAgainSmall: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  playAgainSmallText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Card grid - 2 columns
  cardGrid: {
    gap: 10,
    width: '100%',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },

  // Card faces
  cardFace: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 3,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardBack: {
    // color set dynamically
  },
  cardEmoji: {
    // fontSize set dynamically
  },
  cardNumber: {
    fontWeight: '900',
    color: COLORS.white,
  },
});

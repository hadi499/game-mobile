import React, { useState, useEffect, useCallback } from 'react';
import { useSound } from '../hooks/useSound';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  FadeIn,
  BounceIn,
  ZoomIn,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';

const MAX_CONTENT_WIDTH = 600;

const EMOJIS = ['🍎', '🐶', '🎈', '🚗', '🧸', '🐱', '🍓', '🦋', '⭐', '⚽'];
const TOTAL_QUESTIONS = 10;

// Indigo color palette for hard mode
const COLORS = {
  bg: '#EEF2FF',
  primary: '#6366F1',
  primaryDark: '#4338CA',
  primaryLight: '#A5B4FC',
  primarySuperLight: '#E0E7FF',
  accent: '#FFD93D',
  accentDark: '#E6B800',
  white: '#FFFFFF',
  cardBorder: '#C7D2FE',
  text: '#1E1B4B',
  textSecondary: '#4F46E5',
  progressInactive: '#C7D2FE',
  progressActive: '#6366F1',
  shadow: '#A5B4FC',
  success: '#4ECDC4',
  error: '#FF6B6B',
};

function generateQuestion() {
  const count = Math.floor(Math.random() * 10) + 11; // 11-20
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  const optionsSet = new Set<number>([count]);
  while (optionsSet.size < 3) {
    const wrong = Math.floor(Math.random() * 10) + 11;
    optionsSet.add(wrong);
  }
  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  return { count, emoji, options };
}

// Animated emoji item component
function EmojiItem({ emoji, index }: { emoji: string; index: number }) {
  return (
    <Animated.View
      entering={ZoomIn.delay(index * 50)
        .duration(300)
        .springify()
        .damping(12)}
    >
      <Text style={styles.emojiItem}>{emoji}</Text>
    </Animated.View>
  );
}

// Animated option button
function OptionButton({
  value,
  onPress,
  disabled,
  shakeError,
  buttonSize,
}: {
  value: number;
  onPress: (v: number) => void;
  disabled: boolean;
  shakeError: boolean;
  buttonSize: number;
}) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (shakeError) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [shakeError]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(value)}
      disabled={disabled}
    >
      <Animated.View style={[styles.optionButton, animatedStyle, { width: buttonSize, height: buttonSize }]}>
        <Text style={styles.optionText}>{value}</Text>
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
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-50, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    blobScale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.9, { duration: 3500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
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
          position: 'absolute',
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
    />
  );
}

export default function CountingGameHardScreen() {
  const { width } = useWindowDimensions();
  const { playBenar, playWrong, playTepukTangan } = useSound();

  const [question, setQuestion] = useState(() => generateQuestion());
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);

  // Kalkulasi ukuran tombol, dibatasi max 140px untuk Tablet
  const effectiveWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const calculatedButtonSize = Math.floor((effectiveWidth - 72) / 3);
  const buttonSize = calculatedButtonSize > 140 ? 140 : calculatedButtonSize;

  const startGame = useCallback(() => {
    setScore(0);
    setQuestionNumber(1);
    setIsGameOver(false);
    setShowSuccess(false);
    const q = generateQuestion();
    setQuestion(q);
    setQuestionKey((k) => k + 1);
  }, []);

  const nextQuestion = useCallback(() => {
    const nextNum = questionNumber + 1;
    if (nextNum > TOTAL_QUESTIONS) {
      setIsGameOver(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playTepukTangan();
      return;
    }
    setQuestionNumber(nextNum);
    const q = generateQuestion();
    setQuestion(q);
    setQuestionKey((k) => k + 1);
  }, [questionNumber]);

  const handleAnswer = useCallback(
    (selected: number) => {
      if (showSuccess) return;

      if (selected === question.count) {
        setScore((s) => s + 1);
        setShowSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playBenar();

        setTimeout(() => {
          setShowSuccess(false);
          nextQuestion();
        }, 1000);
      } else {
        setShakeError(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        playWrong();
        setTimeout(() => setShakeError(false), 400);
      }
    },
    [showSuccess, question, nextQuestion]
  );

  const getScoreMessage = () => {
    if (score === 10) return 'Sempurna! 🌟';
    if (score >= 8) return 'Luar biasa!';
    if (score >= 6) return 'Bagus sekali!';
    if (score >= 4) return 'Lumayan!';
    return 'Coba lagi ya!';
  };

  const getScoreEmoji = () => {
    if (score === 10) return '🏆';
    if (score >= 8) return '🥇';
    if (score >= 6) return '🎉';
    if (score >= 4) return '👍';
    return '💪';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Floating blob decorations */}
      <FloatingBlob
        color="#C7D2FE"
        size={250}
        initialX={-80}
        initialY={-60}
        delay={0}
      />
      <FloatingBlob
        color={COLORS.primarySuperLight}
        size={280}
        initialX={width - 120}
        initialY={500}
        delay={2000}
      />
      <FloatingBlob
        color="#DDD6FE"
        size={200}
        initialX={width / 2 - 100}
        initialY={200}
        delay={1000}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Wrapper pembatas lebar untuk Tablet */}
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

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>SULIT</Text>
          </View>

          <View style={styles.progressContainer}>
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      i < questionNumber - (showSuccess ? 0 : 1)
                        ? COLORS.progressActive
                        : COLORS.progressInactive,
                  },
                  i < questionNumber - (showSuccess ? 0 : 1) && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Question card */}
        <View style={styles.card}>
          <Text style={styles.questionTitle}>Berapa jumlahnya?</Text>

          {/* Emoji display area */}
          <View style={styles.emojiArea}>
            {showSuccess ? (
              <Animated.Text
                entering={BounceIn.duration(600)}
                style={styles.successStar}
              >
                🌟
              </Animated.Text>
            ) : (
              <View style={styles.emojiGrid} key={questionKey}>
                {Array.from({ length: question.count }).map((_, i) => (
                  <EmojiItem key={`${questionKey}-${i}`} emoji={question.emoji} index={i} />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Answer options */}
        <View style={styles.optionsRow}>
          {question.options.map((opt) => (
            <OptionButton
              key={`${questionKey}-opt-${opt}`}
              value={opt}
              onPress={handleAnswer}
              disabled={showSuccess}
              shakeError={shakeError}
              buttonSize={buttonSize}
            />
          ))}
        </View>

        {/* Score indicator */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.scoreChip}>
          <Text style={styles.scoreChipText}>
            ⭐ {score} / {questionNumber - 1 > 0 ? questionNumber - 1 : 0}
          </Text>
        </Animated.View>
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
            <Text style={styles.trophyEmoji}>{getScoreEmoji()}</Text>
            <Text style={styles.congratsTitle}>HOREE!</Text>
            <Text style={styles.congratsSubtitle}>{getScoreMessage()}</Text>
            <Text style={styles.scoreText}>
              Adik betul{' '}
              <Text style={styles.scoreHighlight}>{score}</Text> dari{' '}
              <Text style={styles.scoreHighlight}>{TOTAL_QUESTIONS}</Text>
            </Text>

            {/* Score stars visualization */}
            <View style={styles.starsRow}>
              {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                <Animated.Text
                  key={i}
                  entering={FadeInUp.delay(i * 100).springify()}
                  style={styles.starItem}
                >
                  {i < score ? '⭐' : '☆'}
                </Animated.Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={startGame}
              activeOpacity={0.8}
            >
              <Text style={styles.playAgainText}>Main Lagi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.homeButtonText}>Pulang</Text>
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
    alignItems: 'center',
  },
  tabletWrapper: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    gap: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: -2,
  },
  levelBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressDotActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },

  // Question Card
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 24,
    borderWidth: 3,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
    marginBottom: 28,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 20,
  },
  emojiArea: {
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  emojiItem: {
    fontSize: 28,
    lineHeight: 38,
  },
  successStar: {
    fontSize: 80,
  },

  // Options
  optionsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 24,
  },
  optionButton: {
    // width & height dikendalikan dinamis di komponen OptionButton
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 3.5,
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 0,
    elevation: 6,
  },
  optionText: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.primary,
  },

  // Score chip
  scoreChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreChipText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 75, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  trophyEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  congratsTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 2,
  },
  congratsSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  scoreHighlight: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 28,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  starItem: {
    fontSize: 24,
  },
  playAgainButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 0,
    elevation: 5,
    marginBottom: 12,
  },
  playAgainText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  homeButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 0,
    elevation: 5,
  },
  homeButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#6B4F00',
    letterSpacing: 1,
  },
});

// ============================================================
// FILE: components.tsx — all UI components
// ============================================================

// --- ErrorBoundary.tsx ---
import React, { Component, ComponentType, PropsWithChildren } from "react";

import { ErrorFallback, ErrorFallbackProps } from "@/components/ErrorFallback";

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
}>;

type ErrorBoundaryState = { error: Error | null };

/**
 * This is a special case for for using the class components. Error boundaries must be class components because React only provides error boundary functionality through lifecycle methods (componentDidCatch and getDerivedStateFromError) which are not available in functional components.
 * https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static defaultProps: {
    FallbackComponent: ComponentType<ErrorFallbackProps>;
  } = {
    FallbackComponent: ErrorFallback,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info.componentStack);
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render() {
    const { FallbackComponent } = this.props;

    return this.state.error && FallbackComponent ? (
      <FallbackComponent
        error={this.state.error}
        resetError={this.resetError}
      />
    ) : (
      this.props.children
    );
  }
}

// --- ErrorFallback.tsx ---
import { Feather } from "@expo/vector-icons";
import { reloadAppAsync } from "expo";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  const monoFont = Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {__DEV__ ? (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          accessibilityLabel="View error details"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.topButton,
            {
              top: insets.top + 16,
              backgroundColor: colors.card,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="alert-circle" size={20} color={colors.foreground} />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Something went wrong
        </Text>

        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          Please reload the app to continue.
        </Text>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              { color: colors.primaryForeground },
            ]}
          >
            Try Again
          </Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Error Details
                </Text>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  accessibilityLabel="Close error details"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Feather name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={[
                  styles.modalScrollContent,
                  { paddingBottom: insets.bottom + 16 },
                ]}
                showsVerticalScrollIndicator
              >
                <View
                  style={[
                    styles.errorContainer,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Text
                    style={[
                      styles.errorText,
                      {
                        color: colors.foreground,
                        fontFamily: monoFont,
                      },
                    ]}
                    selectable
                  >
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    width: "100%",
    maxWidth: 600,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 40,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  topButton: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    paddingHorizontal: 24,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "90%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
  },
  errorContainer: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    width: "100%",
  },
});

// --- ExerciseCard.tsx ---
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Exercise, MUSCLE_COLORS } from "@/constants/exercises";
import { useColors } from "@/hooks/useColors";

interface Props {
  exercise: Exercise;
  onPress?: () => void;
  onAdd?: () => void;
  showAdd?: boolean;
  compact?: boolean;
}

export function ExerciseCard({ exercise, onPress, onAdd, showAdd, compact }: Props) {
  const colors = useColors();
  const muscleColor = MUSCLE_COLORS[exercise.primaryMuscle] ?? colors.primary;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.colorBar, { backgroundColor: muscleColor }]} />
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {exercise.name}
        </Text>
        {!compact && (
          <View style={styles.meta}>
            <Text style={[styles.muscle, { color: colors.primary }]}>{exercise.primaryMuscle}</Text>
            <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[styles.equipment, { color: colors.mutedForeground }]}>{exercise.equipment}</Text>
            <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
            <Text
              style={[
                styles.difficulty,
                {
                  color:
                    exercise.difficulty === "Advanced"
                      ? colors.destructive
                      : exercise.difficulty === "Intermediate"
                      ? colors.warning
                      : colors.success,
                },
              ]}
            >
              {exercise.difficulty}
            </Text>
          </View>
        )}
        {compact && (
          <Text style={[styles.muscle, { color: colors.mutedForeground, fontSize: 12 }]}>
            {exercise.primaryMuscle} · {exercise.equipment}
          </Text>
        )}
        {exercise.isCustom && (
          <View style={[styles.customBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.customText, { color: colors.mutedForeground }]}>Custom</Text>
          </View>
        )}
      </View>
      {showAdd && (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={onAdd}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      )}
      {!showAdd && onPress && (
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  colorBar: { width: 4, alignSelf: "stretch" },
  content: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 4 },
  meta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  muscle: { fontFamily: "Inter_500Medium", fontSize: 13 },
  equipment: { fontFamily: "Inter_400Regular", fontSize: 13 },
  difficulty: { fontFamily: "Inter_500Medium", fontSize: 13 },
  dot: { fontSize: 13 },
  customBadge: { marginTop: 4, alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  customText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
});

// --- KeyboardAwareScrollViewCompat.tsx ---
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";
import { Platform, ScrollView, ScrollViewProps } from "react-native";

type Props = KeyboardAwareScrollViewProps & ScrollViewProps;

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  ...props
}: Props) {
  if (Platform.OS === "web") {
    return (
      <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
        {children}
      </ScrollView>
    );
  }
  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

// --- RestTimerModal.tsx ---
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  duration: number;
  onDismiss: () => void;
}

export function RestTimerModal({ visible, duration, onDismiss }: Props) {
  const colors = useColors();
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setRemaining(duration);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [visible, duration]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = remaining / duration;

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.mutedForeground }]}>REST TIMER</Text>

          <View style={styles.timerContainer}>
            <Text style={[styles.time, { color: remaining <= 10 ? colors.destructive : colors.foreground }]}>
              {mins}:{String(secs).padStart(2, "0")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {remaining > 0 ? "Rest up" : "Time!"}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: remaining <= 10 ? colors.destructive : colors.primary,
                    width: `${progress * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.skipBtn, { backgroundColor: colors.primary }]}
            onPress={onDismiss}
          >
            <Feather name="skip-forward" size={18} color="#FFF" />
            <Text style={styles.skipText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 32, alignItems: "center", gap: 20, paddingBottom: 48 },
  title: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 2 },
  timerContainer: { alignItems: "center" },
  time: { fontFamily: "Inter_700Bold", fontSize: 64 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 16, marginTop: 4 },
  progressBar: { width: "100%" },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  skipBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 100 },
  skipText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
});

// --- SetRow.tsx ---
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ActiveSet } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  set: ActiveSet;
  setNumber: number;
  trackingType: string;
  unitLabel: string;
  onUpdate: (updates: Partial<ActiveSet>) => void;
  onRemove: () => void;
}

export function SetRow({ set, setNumber, trackingType, unitLabel, onUpdate, onRemove }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function toggleComplete() {
    const newVal = !set.isCompleted;
    scale.value = withSpring(0.9, {}, () => { scale.value = withSpring(1); });
    if (newVal) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate({ isCompleted: newVal });
  }

  const isWeightReps = trackingType === "weight_reps" || trackingType === "bodyweight_reps";
  const showWeight = trackingType === "weight_reps";
  const isDuration = trackingType === "duration";
  const isDistance = trackingType === "distance_duration";

  const bg = set.isCompleted ? colors.success + "22" : colors.card;
  const borderColor = set.isCompleted ? colors.success + "44" : colors.border;

  return (
    <View style={[styles.row, { backgroundColor: bg, borderColor }]}>
      <TouchableOpacity onPress={onRemove} style={styles.setNumContainer}>
        <Text style={[styles.setNum, { color: colors.mutedForeground }]}>{setNumber}</Text>
      </TouchableOpacity>

      {set.previousWeight != null && set.previousReps != null ? (
        <Text style={[styles.prev, { color: colors.mutedForeground }]}>
          {set.previousWeight}{unitLabel} × {set.previousReps}
        </Text>
      ) : (
        <Text style={[styles.prev, { color: colors.mutedForeground }]}>—</Text>
      )}

      {showWeight && (
        <TextInput
          style={[styles.input, { color: set.isCompleted ? colors.success : colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
          value={set.weight}
          onChangeText={(t) => onUpdate({ weight: t })}
          keyboardType="decimal-pad"
          placeholder={unitLabel}
          placeholderTextColor={colors.mutedForeground}
          editable={!set.isCompleted}
          selectTextOnFocus
        />
      )}

      {isWeightReps && (
        <TextInput
          style={[styles.input, { color: set.isCompleted ? colors.success : colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
          value={set.reps}
          onChangeText={(t) => onUpdate({ reps: t })}
          keyboardType="number-pad"
          placeholder="Reps"
          placeholderTextColor={colors.mutedForeground}
          editable={!set.isCompleted}
          selectTextOnFocus
        />
      )}

      {isDuration && (
        <TextInput
          style={[styles.inputWide, { color: set.isCompleted ? colors.success : colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
          value={set.duration}
          onChangeText={(t) => onUpdate({ duration: t })}
          keyboardType="decimal-pad"
          placeholder="Seconds"
          placeholderTextColor={colors.mutedForeground}
          editable={!set.isCompleted}
          selectTextOnFocus
        />
      )}

      {isDistance && (
        <>
          <TextInput
            style={[styles.input, { color: set.isCompleted ? colors.success : colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
            value={set.distance}
            onChangeText={(t) => onUpdate({ distance: t })}
            keyboardType="decimal-pad"
            placeholder="km"
            placeholderTextColor={colors.mutedForeground}
            editable={!set.isCompleted}
            selectTextOnFocus
          />
          <TextInput
            style={[styles.input, { color: set.isCompleted ? colors.success : colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
            value={set.duration}
            onChangeText={(t) => onUpdate({ duration: t })}
            keyboardType="decimal-pad"
            placeholder="min"
            placeholderTextColor={colors.mutedForeground}
            editable={!set.isCompleted}
            selectTextOnFocus
          />
        </>
      )}

      <Animated.View style={animStyle}>
        <TouchableOpacity
          style={[styles.checkBtn, { backgroundColor: set.isCompleted ? colors.success : colors.muted }]}
          onPress={toggleComplete}
        >
          <Feather name="check" size={16} color={set.isCompleted ? "#FFF" : colors.mutedForeground} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6, gap: 8 },
  setNumContainer: { width: 24, alignItems: "center" },
  setNum: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  prev: { width: 70, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  input: { width: 60, height: 36, borderRadius: 8, borderWidth: 1, textAlign: "center", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  inputWide: { flex: 1, height: 36, borderRadius: 8, borderWidth: 1, textAlign: "center", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  checkBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});

// --- SimpleBarChart.tsx ---
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface DataPoint { label: string; value: number; }

interface Props {
  data: DataPoint[];
  height?: number;
  barColor?: string;
  unit?: string;
}

function formatValue(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

export function SimpleBarChart({ data, height = 120, barColor, unit = "" }: Props) {
  const colors = useColors();
  const max = Math.max(...data.map((d) => d.value), 1);
  const accent = barColor ?? colors.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 24);
          return (
            <View key={i} style={styles.barWrapper}>
              {d.value > 0 && (
                <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                  {formatValue(d.value)}
                </Text>
              )}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barH,
                      backgroundColor: accent,
                      opacity: d.value === 0 ? 0.2 : 1,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={i} style={[styles.xLabel, { color: colors.mutedForeground }]}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  barWrapper: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barTrack: { width: "80%", alignItems: "center" },
  bar: { width: "100%", borderRadius: 4, minHeight: 2 },
  barLabel: { fontFamily: "Inter_400Regular", fontSize: 9, marginBottom: 2 },
  labels: { flexDirection: "row", marginTop: 6, gap: 4 },
  xLabel: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
});

// --- StatCard.tsx ---
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: string;
}

export function StatCard({ label, value, subtitle, icon, accent }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon && <View style={styles.iconRow}>{icon}</View>}
      <Text style={[styles.value, { color: accent ?? colors.primary }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 4, minWidth: 100 },
  iconRow: { marginBottom: 4 },
  value: { fontFamily: "Inter_700Bold", fontSize: 22 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
});

// --- TierBadge.tsx ---
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TierInfo } from "@/constants/tiers";
import { useColors } from "@/hooks/useColors";

interface Props {
  tier: TierInfo;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const TIER_ICONS: Record<string, string> = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Diamond: "💠",
};

export function TierBadge({ tier, size = "md", showLabel = true }: Props) {
  const colors = useColors();
  const badgeSizes = { sm: 36, md: 56, lg: 80 };
  const fontSize = { sm: 16, md: 24, lg: 36 };
  const labelSize = { sm: 10, md: 12, lg: 14 };
  const dim = badgeSizes[size];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[tier.gradientStart, tier.gradientEnd]}
        style={[styles.badge, { width: dim, height: dim, borderRadius: dim / 2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={{ fontSize: fontSize[size] }}>{TIER_ICONS[tier.tier]}</Text>
      </LinearGradient>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: tier.color, fontSize: labelSize[size] }]}>
            {tier.label}
          </Text>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontSize: labelSize[size] - 2 }]}>
            {tier.description}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 6 },
  badge: { alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  labelContainer: { alignItems: "center", gap: 2 },
  label: { fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  desc: { fontFamily: "Inter_400Regular" },
});

// --- WorkoutPlanCard.tsx ---
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WorkoutPlan } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  plan: WorkoutPlan;
  onPress: () => void;
  onStart: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function WorkoutPlanCard({ plan, onPress, onStart, onDuplicate, onDelete }: Props) {
  const colors = useColors();
  const totalExercises = plan.days.reduce((acc, d) => acc + d.exercises.length, 0);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{plan.name}</Text>
          {plan.description ? (
            <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>{plan.description}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={onStart}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Feather name="play" size={14} color="#FFF" />
          <Text style={styles.startText}>Start</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.days}>
        {plan.days.slice(0, 5).map((day) => (
          <View key={day.id} style={[styles.dayChip, { backgroundColor: colors.muted }]}>
            <Text style={[styles.dayText, { color: colors.mutedForeground }]}>{day.name}</Text>
          </View>
        ))}
        {plan.days.length > 5 && (
          <View style={[styles.dayChip, { backgroundColor: colors.muted }]}>
            <Text style={[styles.dayText, { color: colors.mutedForeground }]}>+{plan.days.length - 5}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {plan.days.length} day{plan.days.length !== 1 ? "s" : ""} · {totalExercises} exercises
          {plan.lastUsed ? ` · Last: ${timeAgo(plan.lastUsed)}` : ""}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onDuplicate}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Feather name="copy" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  titleRow: { flex: 1 },
  name: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 2 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13 },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  startText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFF" },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  dayChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dayText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: { padding: 2 },
});


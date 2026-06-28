// ============================================================
// FILE: app-screens.tsx — all Expo Router screens
// ============================================================

// --- app/+not-found.tsx ---
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          This screen doesn&apos;t exist.
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
  },
});

// --- app/_layout.tsx ---
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="workouts">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet.rectangle.fill" }} />
        <Label>Workouts</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <Icon sf={{ default: "books.vertical", selected: "books.vertical.fill" }} />
        <Label>Library</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <Icon sf={{ default: "chart.xyaxis.line", selected: "chart.bar.fill" }} />
        <Label>Progress</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginBottom: isWeb ? 4 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="list.bullet.rectangle.fill" tintColor={color} size={24} />
            ) : (
              <Feather name="list" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="books.vertical.fill" tintColor={color} size={24} />
            ) : (
              <Feather name="book-open" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="chart.bar.fill" tintColor={color} size={24} />
            ) : (
              <Feather name="trending-up" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.fill" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

// --- app/active-workout.tsx ---
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExerciseCard } from "@/components/ExerciseCard";
import { RestTimerModal } from "@/components/RestTimerModal";
import { SetRow } from "@/components/SetRow";
import { CATEGORIES } from "@/constants/exercises";
import { ActiveExercise, useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

function useElapsedTimer(startTime: number | null): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!startTime) return "0:00";
  const s = Math.floor((now - startTime) / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default function ActiveWorkoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ planId?: string; dayIndex?: string }>();
  const {
    activeWorkout,
    workoutPlans,
    exercises,
    startWorkout,
    cancelWorkout,
    finishWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    addSet,
    removeSet,
    updateSet,
    getPreviousValues,
    settings,
    getUnitLabel,
  } = useWorkout();

  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState("All");
  const [restTimer, setRestTimer] = useState<{ visible: boolean; duration: number }>({
    visible: false,
    duration: settings.defaultRestTime,
  });

  const elapsed = useElapsedTimer(activeWorkout?.startTime ?? null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!activeWorkout && params.planId) {
      const plan = workoutPlans.find((p) => p.id === params.planId);
      const dayIdx = parseInt(params.dayIndex ?? "0");
      if (plan && plan.days[dayIdx]) {
        const day = plan.days[dayIdx];
        const exList: ActiveExercise[] = day.exercises.map((pe, i) => {
          const prev = getPreviousValues(pe.exerciseId);
          return {
            id: `${Date.now()}_${i}`,
            exerciseId: pe.exerciseId,
            sets: Array.from({ length: pe.sets }, (_, si) => ({
              id: `${Date.now()}_${i}_${si}`,
              weight: pe.weight > 0 ? String(pe.weight) : (prev?.weight ? String(prev.weight) : ""),
              reps: pe.reps > 0 ? String(pe.reps) : (prev?.reps ? String(prev.reps) : ""),
              duration: "", distance: "",
              isCompleted: false as const,
              previousWeight: prev?.weight,
              previousReps: prev?.reps,
            })),
            restTime: pe.restTime,
            notes: pe.notes,
          };
        });
        startWorkout(`${plan.name} - ${day.name}`, exList, plan.id);
      }
    } else if (!activeWorkout && !params.planId) {
      startWorkout("My Workout", [], undefined);
    }
  }, []);

  const filteredExercises = useMemo(() => {
    return exercises.filter((e) => {
      const matchSearch =
        !pickerSearch ||
        e.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        e.primaryMuscle.toLowerCase().includes(pickerSearch.toLowerCase());
      const matchCat = pickerCategory === "All" || e.category === pickerCategory;
      return matchSearch && matchCat;
    });
  }, [exercises, pickerSearch, pickerCategory]);

  function hasProgress(): boolean {
    if (!activeWorkout) return false;
    return activeWorkout.exercises.some((e) =>
      e.sets.some((s) => s.isCompleted || s.weight.trim() !== "" || s.reps.trim() !== "")
    );
  }

  function handleClose() {
    if (!activeWorkout) {
      router.back();
      return;
    }
    if (!hasProgress()) {
      cancelWorkout();
      router.back();
      return;
    }

    Alert.alert(
      "Close Workout",
      "You have unsaved progress. What would you like to do?",
      [
        { text: "Continue Workout", style: "cancel" },
        {
          text: "Save & Exit",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            finishWorkout();
            router.back();
            setTimeout(() => Alert.alert("Pyra", "Workout saved successfully!"), 400);
          },
        },
        {
          text: "Discard Workout",
          style: "destructive",
          onPress: () => {
            cancelWorkout();
            router.back();
          },
        },
      ]
    );
  }

  function handleFinish() {
    if (!activeWorkout) return;
    const completedSets = activeWorkout.exercises.reduce(
      (s, e) => s + e.sets.filter((set) => set.isCompleted).length,
      0
    );
    const totalSets = activeWorkout.exercises.reduce((s, e) => s + e.sets.length, 0);

    Alert.alert(
      "Finish Workout",
      totalSets === 0
        ? "Save this empty workout?"
        : `Save workout with ${completedSets} of ${totalSets} set${totalSets !== 1 ? "s" : ""} completed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save Workout",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            finishWorkout();
            router.back();
            setTimeout(
              () => Alert.alert("Pyra", `Workout saved! ${completedSets} set${completedSets !== 1 ? "s" : ""} logged.`),
              400
            );
          },
        },
      ]
    );
  }

  function handleSetComplete(activeExId: string, setId: string, currentlyCompleted: boolean) {
    updateSet(activeExId, setId, { isCompleted: !currentlyCompleted });
    if (!currentlyCompleted) {
      const ex = activeWorkout?.exercises.find((e) => e.id === activeExId);
      if (ex) {
        setTimeout(() => {
          setRestTimer({ visible: true, duration: ex.restTime });
        }, 300);
      }
    }
  }

  function handleAddExercise(exerciseId: string) {
    const prev = getPreviousValues(exerciseId);
    addExerciseToWorkout(exerciseId, prev?.weight, prev?.reps);
    setShowExercisePicker(false);
    setPickerSearch("");
  }

  function handleRemoveExercise(activeExId: string) {
    Alert.alert("Remove Exercise", "Remove this exercise from the workout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeExerciseFromWorkout(activeExId) },
    ]);
  }

  const unitLabel = getUnitLabel();

  if (!activeWorkout) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Starting workout…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={handleClose} style={styles.topBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={[styles.workoutName, { color: colors.foreground }]} numberOfLines={1}>
            {activeWorkout.name}
          </Text>
          <Text style={[styles.timer, { color: colors.primary }]}>{elapsed}</Text>
        </View>
        <TouchableOpacity
          style={[styles.finishBtn, { backgroundColor: colors.primary }]}
          onPress={handleFinish}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeWorkout.exercises.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="plus-circle" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No exercises yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Add exercises from the library to start logging.
              </Text>
            </View>
          )}

          {activeWorkout.exercises.map((activeEx) => {
            const exercise = exercises.find((e) => e.id === activeEx.exerciseId);
            if (!exercise) return null;
            const completedCount = activeEx.sets.filter((s) => s.isCompleted).length;
            return (
              <View
                key={activeEx.id}
                style={[styles.exerciseBlock, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.exerciseHeader}>
                  <View style={styles.exTitleRow}>
                    <Text style={[styles.exName, { color: colors.primary }]}>{exercise.name}</Text>
                    <Text style={[styles.exMeta, { color: colors.mutedForeground }]}>
                      {exercise.primaryMuscle} · {exercise.equipment}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveExercise(activeEx.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.setHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.setHeaderText, { color: colors.mutedForeground, width: 24 }]}>SET</Text>
                  <Text style={[styles.setHeaderText, { color: colors.mutedForeground, width: 70, textAlign: "center" }]}>PREV</Text>
                  {exercise.trackingType === "weight_reps" && (
                    <Text style={[styles.setHeaderText, { color: colors.mutedForeground, width: 60, textAlign: "center" }]}>
                      {unitLabel.toUpperCase()}
                    </Text>
                  )}
                  {(exercise.trackingType === "weight_reps" || exercise.trackingType === "bodyweight_reps") && (
                    <Text style={[styles.setHeaderText, { color: colors.mutedForeground, width: 60, textAlign: "center" }]}>REPS</Text>
                  )}
                  {exercise.trackingType === "duration" && (
                    <Text style={[styles.setHeaderText, { color: colors.mutedForeground, flex: 1, textAlign: "center" }]}>SECS</Text>
                  )}
                  {exercise.trackingType === "distance_duration" && (
                    <>
                      <Text style={[styles.setHeaderText, { color: colors.mutedForeground, width: 60, textAlign: "center" }]}>KM</Text>
                      <Text style={[styles.setHeaderText, { color: colors.mutedForeground, width: 60, textAlign: "center" }]}>MIN</Text>
                    </>
                  )}
                  <Text style={[styles.setHeaderText, { color: colors.mutedForeground, width: 36, textAlign: "center" }]}>✓</Text>
                </View>

                {activeEx.sets.map((set, idx) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    setNumber={idx + 1}
                    trackingType={exercise.trackingType}
                    unitLabel={unitLabel}
                    onUpdate={(updates) => {
                      if (updates.isCompleted !== undefined) {
                        handleSetComplete(activeEx.id, set.id, set.isCompleted);
                      } else {
                        updateSet(activeEx.id, set.id, updates);
                      }
                    }}
                    onRemove={() => {
                      if (activeEx.sets.length > 1) removeSet(activeEx.id, set.id);
                    }}
                  />
                ))}

                <View style={styles.exFooter}>
                  <Text style={[styles.completedText, { color: colors.success }]}>
                    {completedCount}/{activeEx.sets.length} sets done
                  </Text>
                  <TouchableOpacity
                    style={[styles.addSetBtn, { borderColor: colors.primary }]}
                    onPress={() => addSet(activeEx.id)}
                  >
                    <Feather name="plus" size={14} color={colors.primary} />
                    <Text style={[styles.addSetText, { color: colors.primary }]}>Add Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.addExBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={() => setShowExercisePicker(true)}
          >
            <Feather name="plus" size={20} color={colors.primary} />
            <Text style={[styles.addExText, { color: colors.primary }]}>Add Exercise</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showExercisePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: colors.border, paddingTop: 20 }]}>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Add Exercise</Text>
            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={[styles.pickerSearch, { borderBottomColor: colors.border }]}>
            <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search exercises..."
                placeholderTextColor={colors.mutedForeground}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoFocus
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, { backgroundColor: pickerCategory === cat ? colors.primary : colors.muted }]}
                  onPress={() => setPickerCategory(cat)}
                >
                  <Text style={[styles.filterText, { color: pickerCategory === cat ? "#FFF" : colors.mutedForeground }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExerciseCard
                exercise={item}
                showAdd
                onAdd={() => handleAddExercise(item.id)}
                onPress={() => handleAddExercise(item.id)}
                compact
              />
            )}
            contentContainerStyle={styles.pickerList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      <RestTimerModal
        visible={restTimer.visible}
        duration={restTimer.duration}
        onDismiss={() => setRestTimer((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  topBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topCenter: { flex: 1, alignItems: "center" },
  workoutName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  timer: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: 1 },
  finishBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  finishText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFF" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22 },
  exerciseBlock: { borderRadius: 16, borderWidth: 1, padding: 14 },
  exerciseHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  exTitleRow: { flex: 1, gap: 2 },
  exName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  exMeta: { fontFamily: "Inter_400Regular", fontSize: 13 },
  setHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, gap: 8 },
  setHeaderText: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.5 },
  exFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  completedText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  addSetBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  addSetText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  addExBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderStyle: "dashed" },
  addExText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  pickerContainer: { flex: 1 },
  pickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  pickerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  pickerSearch: { paddingHorizontal: 20, paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 42, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  pickerList: { paddingHorizontal: 20, paddingVertical: 12 },
});

// --- app/exercise.tsx ---
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { MUSCLE_COLORS } from "@/constants/exercises";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { exercises, workoutHistory, personalRecords, formatWeight } = useWorkout();

  const exercise = exercises.find((e) => e.id === id);
  const pr = personalRecords[id ?? ""];

  const history = useMemo(() => {
    if (!id) return [];
    const records: { date: number; weight: number | null; reps: number | null; volume: number }[] = [];
    for (const workout of workoutHistory) {
      for (const ex of workout.exercises) {
        if (ex.exerciseId !== id) continue;
        const bestSet = ex.sets
          .filter((s) => s.isCompleted && s.weight)
          .sort((a, b) => (b.weight ?? 0) * (b.reps ?? 1) - (a.weight ?? 0) * (a.reps ?? 1))[0];
        if (bestSet) {
          records.push({
            date: workout.startTime,
            weight: bestSet.weight,
            reps: bestSet.reps,
            volume: ex.sets.filter((s) => s.isCompleted && s.weight && s.reps).reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0),
          });
        }
      }
    }
    return records.sort((a, b) => a.date - b.date).slice(-12);
  }, [id, workoutHistory]);

  const chartData = history.map((h) => ({
    label: new Date(h.date).toLocaleDateString("en", { month: "numeric", day: "numeric" }),
    value: h.weight ?? 0,
  }));

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (!exercise) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Exercise not found</Text>
      </View>
    );
  }

  const muscleColor = MUSCLE_COLORS[exercise.primaryMuscle] ?? colors.primary;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 + bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.heroSection, { borderBottomColor: colors.border }]}>
        <View style={[styles.muscleTag, { backgroundColor: muscleColor + "22" }]}>
          <View style={[styles.muscleDot, { backgroundColor: muscleColor }]} />
          <Text style={[styles.muscleName, { color: muscleColor }]}>{exercise.primaryMuscle}</Text>
        </View>
        <Text style={[styles.exName, { color: colors.foreground }]}>{exercise.name}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: colors.muted }]}>
            <Feather name="box" size={13} color={colors.mutedForeground} />
            <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{exercise.equipment}</Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  exercise.difficulty === "Advanced"
                    ? colors.destructive + "22"
                    : exercise.difficulty === "Intermediate"
                    ? colors.warning + "22"
                    : colors.success + "22",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
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
          {exercise.isCustom && (
            <View style={[styles.badge, { backgroundColor: colors.info + "22" }]}>
              <Text style={[styles.badgeText, { color: colors.info }]}>Custom</Text>
            </View>
          )}
        </View>
        {exercise.secondaryMuscles.length > 0 && (
          <Text style={[styles.secondary, { color: colors.mutedForeground }]}>
            Also works: {exercise.secondaryMuscles.join(", ")}
          </Text>
        )}
        {exercise.notes && (
          <Text style={[styles.notes, { color: colors.mutedForeground }]}>{exercise.notes}</Text>
        )}
      </View>

      {pr && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Record</Text>
          <View style={[styles.prCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.prIcon, { backgroundColor: colors.accent + "22" }]}>
              <Feather name="award" size={24} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.prValue, { color: colors.foreground }]}>
                {pr.weight}kg × {pr.reps} reps
              </Text>
              <Text style={[styles.prOneRM, { color: colors.accent }]}>
                Estimated 1RM: {pr.estimatedOneRM}kg
              </Text>
              <Text style={[styles.prDate, { color: colors.mutedForeground }]}>
                {new Date(pr.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
          </View>
        </View>
      )}

      {chartData.length > 1 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Weight Progress</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SimpleBarChart data={chartData} height={120} barColor={muscleColor} unit="kg" />
          </View>
        </View>
      )}

      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>History</Text>
          {history
            .slice()
            .reverse()
            .slice(0, 10)
            .map((h, i) => (
              <View key={i} style={[styles.histRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.histDate, { color: colors.mutedForeground }]}>
                  {new Date(h.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </Text>
                <Text style={[styles.histValue, { color: colors.foreground }]}>
                  {h.weight ? `${h.weight}kg × ${h.reps ?? "?"}` : `${h.reps ?? "?"} reps`}
                </Text>
                {h.volume > 0 && (
                  <Text style={[styles.histVolume, { color: colors.mutedForeground }]}>
                    {Math.round(h.volume)}kg vol
                  </Text>
                )}
              </View>
            ))}
        </View>
      )}

      {history.length === 0 && !pr && (
        <View style={styles.empty}>
          <Feather name="bar-chart-2" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No history yet. Log this exercise in a workout to see progress.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { textAlign: "center", marginTop: 100, fontFamily: "Inter_400Regular", fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, flex: 1, textAlign: "center" },
  heroSection: { padding: 20, gap: 10, borderBottomWidth: 1 },
  muscleTag: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  muscleDot: { width: 8, height: 8, borderRadius: 4 },
  muscleName: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  exName: { fontFamily: "Inter_700Bold", fontSize: 24 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  secondary: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  notes: { fontFamily: "Inter_400Regular", fontSize: 14, fontStyle: "italic", lineHeight: 20 },
  section: { padding: 20 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 12 },
  prCard: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  prIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  prValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  prOneRM: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 2 },
  prDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  histRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  histDate: { fontFamily: "Inter_400Regular", fontSize: 13, width: 60 },
  histValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1, textAlign: "center" },
  histVolume: { fontFamily: "Inter_400Regular", fontSize: 13 },
  empty: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
});

// --- app/history.tsx ---
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workoutHistory, exercises } = useWorkout();

  const workout = workoutHistory.find((w) => w.id === id);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (!workout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Workout not found</Text>
      </View>
    );
  }

  const date = new Date(workout.startTime);
  const endDate = new Date(workout.endTime);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 + bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Workout Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.summarySection, { borderBottomColor: colors.border }]}>
        <Text style={[styles.workoutName, { color: colors.foreground }]}>{workout.name}</Text>
        <Text style={[styles.workoutDate, { color: colors.mutedForeground }]}>
          {date.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </Text>
        <Text style={[styles.workoutTime, { color: colors.mutedForeground }]}>
          {date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })} – {endDate.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
        </Text>

        <View style={styles.statsRow}>
          {[
            { label: "Duration", value: formatDuration(workout.duration), color: colors.primary },
            { label: "Volume", value: `${Math.round(workout.totalVolume)}kg`, color: colors.accent },
            { label: "Sets", value: String(workout.totalSets), color: colors.success },
            { label: "Reps", value: String(workout.totalReps), color: colors.info },
          ].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.exercisesSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exercises</Text>
        {workout.exercises.map((loggedEx) => {
          const exercise = exercises.find((e) => e.id === loggedEx.exerciseId);
          const completedSets = loggedEx.sets.filter((s) => s.isCompleted);
          const totalVolume = completedSets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0);
          return (
            <TouchableOpacity
              key={loggedEx.id}
              style={[styles.exCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/exercise/${loggedEx.exerciseId}`)}
              activeOpacity={0.8}
            >
              <View style={styles.exHeader}>
                <Text style={[styles.exName, { color: colors.primary }]}>{exercise?.name ?? "Unknown Exercise"}</Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.exMeta, { color: colors.mutedForeground }]}>
                {exercise?.primaryMuscle} · {completedSets.length} sets completed
                {totalVolume > 0 ? ` · ${Math.round(totalVolume)}kg volume` : ""}
              </Text>

              {completedSets.length > 0 && (
                <View style={[styles.setsTable, { borderTopColor: colors.border }]}>
                  <View style={styles.setTableHeader}>
                    <Text style={[styles.setTableHead, { color: colors.mutedForeground }]}>SET</Text>
                    <Text style={[styles.setTableHead, { color: colors.mutedForeground }]}>WEIGHT</Text>
                    <Text style={[styles.setTableHead, { color: colors.mutedForeground }]}>REPS</Text>
                    <Text style={[styles.setTableHead, { color: colors.mutedForeground }]}>VOLUME</Text>
                  </View>
                  {loggedEx.sets.map((s, idx) => (
                    <View
                      key={s.id}
                      style={[
                        styles.setTableRow,
                        { borderTopColor: colors.border },
                        !s.isCompleted && styles.skippedRow,
                      ]}
                    >
                      <Text style={[styles.setCell, { color: s.isCompleted ? colors.foreground : colors.mutedForeground }]}>{idx + 1}</Text>
                      <Text style={[styles.setCell, { color: s.isCompleted ? colors.foreground : colors.mutedForeground }]}>
                        {s.weight ? `${s.weight}kg` : s.duration ? `${s.duration}s` : "—"}
                      </Text>
                      <Text style={[styles.setCell, { color: s.isCompleted ? colors.foreground : colors.mutedForeground }]}>
                        {s.reps ?? (s.duration ? "—" : "—")}
                      </Text>
                      <Text style={[styles.setCell, { color: s.isCompleted ? colors.success : colors.mutedForeground }]}>
                        {s.weight && s.reps ? `${Math.round(s.weight * s.reps)}kg` : "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { textAlign: "center", marginTop: 100, fontFamily: "Inter_400Regular", fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  summarySection: { padding: 20, gap: 8, borderBottomWidth: 1 },
  workoutName: { fontFamily: "Inter_700Bold", fontSize: 22 },
  workoutDate: { fontFamily: "Inter_500Medium", fontSize: 14 },
  workoutTime: { fontFamily: "Inter_400Regular", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  statBox: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 2 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 17 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  exercisesSection: { padding: 20, gap: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 4 },
  exCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  exHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exName: { fontFamily: "Inter_700Bold", fontSize: 15 },
  exMeta: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 3, marginBottom: 8 },
  setsTable: { borderTopWidth: 1, paddingTop: 8 },
  setTableHeader: { flexDirection: "row", marginBottom: 6 },
  setTableHead: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.5 },
  setTableRow: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 6 },
  skippedRow: { opacity: 0.4 },
  setCell: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13 },
});

// --- app/import.tsx ---
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CompletedWorkout, LoggedExercise, LoggedSet, useWorkout } from "@/context/WorkoutContext";
import { BUILT_IN_EXERCISES } from "@/constants/exercises";
import { useColors } from "@/hooks/useColors";

type ParsedWorkout = Omit<CompletedWorkout, "id"> & {
  _parseWarnings: string[];
  _isDuplicate: boolean;
  _selected: boolean;
};

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
  april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
  august: 7, aug: 7, september: 8, sep: 8, sept: 8, october: 9, oct: 9,
  november: 10, nov: 10, december: 11, dec: 11,
};

function parseDate(line: string): Date | null {
  line = line.trim().replace(/[*_#]/g, "").trim();

  // ISO: 2024-01-15
  let m = line.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));

  // Month Day, Year: January 15, 2024 / Jan 15 2024
  m = line.match(/\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})\b/);
  if (m) {
    const month = MONTH_MAP[m[1].toLowerCase()];
    if (month !== undefined) return new Date(parseInt(m[3]), month, parseInt(m[2]));
  }

  // Month Day (no year): January 15 / Jan 15
  m = line.match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/i);
  if (m) {
    const month = MONTH_MAP[m[1].toLowerCase()];
    if (month !== undefined) return new Date(new Date().getFullYear(), month, parseInt(m[2]));
  }

  // Weekday, Month Day Year: Monday, January 15, 2024
  m = line.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (m) {
    const month = MONTH_MAP[m[1].toLowerCase()];
    if (month !== undefined) return new Date(parseInt(m[3]), month, parseInt(m[2]));
  }

  // MM/DD/YYYY or M/D/YY
  m = line.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
    const month = parseInt(m[1]) - 1;
    const day = parseInt(m[2]);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      return new Date(year, month, day);
    }
  }

  return null;
}

function isDateLine(line: string): boolean {
  const clean = line.replace(/[*_#\-]/g, " ").trim();
  if (parseDate(clean)) return true;
  // Workout headers like "Workout - Tuesday" or "Day 1" etc.
  if (/^(workout|training|session|day\s*\d)/i.test(clean) && clean.length < 60) return true;
  return false;
}

function parseWeightReps(token: string): { weight?: number; reps?: number; sets?: number } | null {
  // "3x8@100kg" or "3x8 @ 100" or "100kg x 8"
  let m = token.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+)\s*@?\s*(\d+(?:\.\d+)?)\s*(?:kg|lb|lbs)?/i);
  if (m) return { sets: parseInt(m[1]), reps: parseInt(m[2]), weight: parseFloat(m[3]) };

  // "3 sets x 8 reps @ 100" or "3 sets × 8"
  m = token.match(/(\d+)\s*sets?\s*[x×]\s*(\d+)\s*(?:reps?)?\s*(?:@|at|@)?\s*(\d+(?:\.\d+)?)?/i);
  if (m) return { sets: parseInt(m[1]), reps: parseInt(m[2]), weight: m[3] ? parseFloat(m[3]) : undefined };

  // "100kg x 8" or "100 x 8"
  m = token.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb|lbs)?\s*[x×]\s*(\d+)\s*(?:reps?)?/i);
  if (m) return { weight: parseFloat(m[1]), reps: parseInt(m[2]) };

  // "8 reps" or "8x" bare
  m = token.match(/^(\d+)\s*(?:reps?|x)$/i);
  if (m) return { reps: parseInt(m[1]) };

  return null;
}

function extractSetsFromLine(line: string): Array<{ weight?: number; reps?: number }> {
  const sets: Array<{ weight?: number; reps?: number }> = [];

  // Try comma-separated sets: "100kg x 8, 105kg x 8, 110kg x 6"
  const commaSegments = line.split(",").map((s) => s.trim()).filter(Boolean);
  if (commaSegments.length > 1) {
    for (const seg of commaSegments) {
      const p = parseWeightReps(seg);
      if (p) {
        if (p.sets && p.sets > 1) {
          for (let i = 0; i < p.sets; i++) sets.push({ weight: p.weight, reps: p.reps });
        } else {
          sets.push({ weight: p.weight, reps: p.reps });
        }
      }
    }
    if (sets.length > 0) return sets;
  }

  // Single set/group
  const p = parseWeightReps(line);
  if (p) {
    const count = p.sets && p.sets > 1 ? p.sets : 1;
    for (let i = 0; i < count; i++) sets.push({ weight: p.weight, reps: p.reps });
  }

  return sets;
}

function matchExerciseName(name: string): string | null {
  const normalized = name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  // Exact match
  const exact = BUILT_IN_EXERCISES.find((e) => e.name.toLowerCase() === normalized);
  if (exact) return exact.id;
  // Contains match
  const contains = BUILT_IN_EXERCISES.find(
    (e) =>
      e.name.toLowerCase().includes(normalized) ||
      normalized.includes(e.name.toLowerCase())
  );
  if (contains) return contains.id;
  // Word overlap (at least 2 words match)
  const words = normalized.split(/\s+/).filter((w) => w.length > 2);
  if (words.length >= 2) {
    const wordMatch = BUILT_IN_EXERCISES.find((e) => {
      const eWords = e.name.toLowerCase().split(/\s+/);
      const overlap = words.filter((w) => eWords.some((ew) => ew.includes(w) || w.includes(ew)));
      return overlap.length >= Math.min(2, words.length);
    });
    if (wordMatch) return wordMatch.id;
  }
  return null;
}

const EXERCISE_LINE_RE = /^[-•*\s]*(.+?)(?:\s*[:\-–]?\s*)(\d.*)?$/;
const WEIGHT_RE = /\d+(?:\.\d+)?\s*(?:kg|lb|lbs|x|×|\*)/i;

function isExerciseLine(line: string): boolean {
  if (line.trim().length < 3) return false;
  if (isDateLine(line)) return false;
  // Has weight/reps pattern
  if (WEIGHT_RE.test(line)) return true;
  // Looks like a known exercise name
  const clean = line.replace(/^[-•*\s]+/, "").split(/[:\-–]/)[0].trim();
  if (clean.length > 2 && matchExerciseName(clean)) return true;
  return false;
}

function parseWorkoutText(text: string, existingHistory: CompletedWorkout[]): {
  workouts: ParsedWorkout[];
  totalWarnings: string[];
} {
  const lines = text.split("\n").map((l) => l.trimEnd());
  const totalWarnings: string[] = [];
  const workouts: ParsedWorkout[] = [];

  // Find workout boundaries by looking for date lines or headers
  const blocks: { startLine: number; date: Date | null; label: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (isDateLine(line)) {
      const d = parseDate(line.replace(/^[-•*#\s]+/, "").trim());
      blocks.push({ startLine: i, date: d, label: line });
    }
  }

  // If no date blocks found, treat entire text as one workout
  if (blocks.length === 0 && text.trim().length > 0) {
    blocks.push({ startLine: 0, date: new Date(), label: "Imported Workout" });
  }

  const existingDates = new Set(existingHistory.map((w) => new Date(w.startTime).toDateString()));

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    const nextStart = bi + 1 < blocks.length ? blocks[bi + 1].startLine : lines.length;
    const blockLines = lines.slice(block.startLine + 1, nextStart).filter((l) => l.trim());

    const workoutDate = block.date ?? new Date();
    const startTime = workoutDate.setHours(9, 0, 0, 0) ? workoutDate.getTime() : Date.now();
    const warnings: string[] = [];

    // Derive workout name from label
    const workoutName = block.label
      .replace(/^[-•*#\s]+/, "")
      .replace(/\s*\d{4}\s*$/, "")
      .trim() || "Workout";

    const loggedExercises: LoggedExercise[] = [];
    let currentExerciseName = "";
    let currentExerciseId: string | null = null;
    let currentSets: LoggedSet[] = [];

    function flushExercise() {
      if (currentExerciseId && currentSets.length > 0) {
        loggedExercises.push({
          id: `imp_${Date.now()}_${loggedExercises.length}`,
          exerciseId: currentExerciseId,
          sets: currentSets,
          notes: "",
        });
      } else if (currentExerciseName && currentSets.length === 0) {
        warnings.push(`No sets found for: "${currentExerciseName}"`);
      }
      currentSets = [];
    }

    for (const line of blockLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if this is a new exercise name line (no weight pattern, or starts with exercise)
      const cleanLine = trimmed.replace(/^[-•*\s]+/, "");
      const colonIdx = cleanLine.indexOf(":");
      const nameCandidate = colonIdx > 0 ? cleanLine.slice(0, colonIdx).trim() : cleanLine.split(/\s+\d/)[0].trim();
      const exerciseId = matchExerciseName(nameCandidate);

      if (exerciseId && exerciseId !== currentExerciseId) {
        flushExercise();
        currentExerciseName = nameCandidate;
        currentExerciseId = exerciseId;
        // Try to parse sets from the rest of the line (after the colon)
        const rest = colonIdx > 0 ? cleanLine.slice(colonIdx + 1).trim() : cleanLine.slice(nameCandidate.length).trim();
        if (rest && WEIGHT_RE.test(rest)) {
          const parsed = extractSetsFromLine(rest);
          for (const s of parsed) {
            currentSets.push({
              id: `s_${Date.now()}_${currentSets.length}`,
              weight: s.weight ?? null,
              reps: s.reps ?? null,
              duration: null,
              distance: null,
              isCompleted: true,
            });
          }
        }
      } else if (WEIGHT_RE.test(trimmed) && currentExerciseId) {
        // Additional sets for current exercise
        const parsed = extractSetsFromLine(trimmed);
        for (const s of parsed) {
          currentSets.push({
            id: `s_${Date.now()}_${currentSets.length}`,
            weight: s.weight ?? null,
            reps: s.reps ?? null,
            duration: null,
            distance: null,
            isCompleted: true,
          });
        }
      } else if (!exerciseId && !WEIGHT_RE.test(trimmed) && trimmed.length > 3 && !isDateLine(trimmed)) {
        warnings.push(`Couldn't parse: "${trimmed}"`);
      }
    }
    flushExercise();

    if (loggedExercises.length === 0) continue;

    const totalVolume = loggedExercises.reduce(
      (sum, e) => sum + e.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0),
      0
    );
    const totalSets = loggedExercises.reduce((s, e) => s + e.sets.filter((set) => set.isCompleted).length, 0);
    const totalReps = loggedExercises.reduce((s, e) => s + e.sets.reduce((sum, set) => sum + (set.reps ?? 0), 0), 0);

    const isDuplicate = existingDates.has(new Date(startTime).toDateString());

    workouts.push({
      name: workoutName,
      planId: undefined,
      startTime,
      endTime: startTime + 3600000,
      duration: 3600,
      exercises: loggedExercises,
      totalVolume: Math.round(totalVolume),
      totalSets,
      totalReps,
      notes: "",
      _parseWarnings: warnings,
      _isDuplicate: isDuplicate,
      _selected: !isDuplicate,
    });

    if (warnings.length > 0) {
      totalWarnings.push(...warnings.map((w) => `[${workoutName}] ${w}`));
    }
  }

  return { workouts, totalWarnings };
}

type Step = "input" | "preview";

export default function ImportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { importWorkouts, workoutHistory } = useWorkout();

  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedWorkout[]>([]);
  const [allWarnings, setAllWarnings] = useState<string[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  function handleParse() {
    if (!text.trim()) {
      Alert.alert("No text", "Please paste your workout notes first.");
      return;
    }
    setParsing(true);
    setTimeout(() => {
      const { workouts, totalWarnings } = parseWorkoutText(text, workoutHistory);
      setParsed(workouts.map((w) => ({ ...w })));
      setAllWarnings(totalWarnings);
      setParsing(false);
      if (workouts.length === 0) {
        Alert.alert("Nothing found", "Couldn't detect any workouts in the text. Check the format and try again.");
        return;
      }
      setStep("preview");
    }, 100);
  }

  function toggleSelect(idx: number) {
    setParsed((prev) => prev.map((w, i) => (i === idx ? { ...w, _selected: !w._selected } : w)));
  }

  function handleImport() {
    const selected = parsed.filter((w) => w._selected);
    if (selected.length === 0) {
      Alert.alert("Nothing selected", "Select at least one workout to import.");
      return;
    }
    Alert.alert(
      "Import Workouts",
      `Import ${selected.length} workout${selected.length !== 1 ? "s" : ""} into Pyra?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: () => {
            importWorkouts(selected.map(({ _parseWarnings, _isDuplicate, _selected, ...w }) => w));
            Alert.alert("Imported!", `${selected.length} workout${selected.length !== 1 ? "s" : ""} added to your history.`);
            router.back();
          },
        },
      ]
    );
  }

  const selectedCount = parsed.filter((w) => w._selected).length;

  if (step === "preview") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStep("input")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {selectedCount} of {parsed.length} selected
          </Text>
          <TouchableOpacity
            style={[styles.importBtn, { backgroundColor: selectedCount > 0 ? colors.primary : colors.muted }]}
            onPress={handleImport}
            disabled={selectedCount === 0}
          >
            <Text style={[styles.importBtnText, { color: selectedCount > 0 ? "#FFF" : colors.mutedForeground }]}>
              Import
            </Text>
          </TouchableOpacity>
        </View>

        {allWarnings.length > 0 && (
          <TouchableOpacity
            style={[styles.warningBanner, { backgroundColor: colors.warning + "22", borderColor: colors.warning }]}
            onPress={() => setShowWarnings(!showWarnings)}
          >
            <Feather name="alert-triangle" size={16} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              {allWarnings.length} line{allWarnings.length !== 1 ? "s" : ""} couldn't be parsed. Tap to {showWarnings ? "hide" : "view"}.
            </Text>
          </TouchableOpacity>
        )}

        {showWarnings && allWarnings.length > 0 && (
          <View style={[styles.warningList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {allWarnings.slice(0, 10).map((w, i) => (
              <Text key={i} style={[styles.warningItem, { color: colors.mutedForeground }]}>• {w}</Text>
            ))}
            {allWarnings.length > 10 && (
              <Text style={[styles.warningItem, { color: colors.mutedForeground }]}>
                …and {allWarnings.length - 10} more
              </Text>
            )}
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 40 }}>
          {parsed.map((w, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.previewCard,
                {
                  backgroundColor: colors.card,
                  borderColor: w._selected ? colors.primary : colors.border,
                  borderWidth: w._selected ? 2 : 1,
                  opacity: w._isDuplicate && !w._selected ? 0.6 : 1,
                },
              ]}
              onPress={() => toggleSelect(idx)}
              activeOpacity={0.8}
            >
              <View style={styles.previewCardHeader}>
                <View style={styles.previewCheckbox}>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: w._selected ? colors.primary : colors.border },
                      w._selected && { backgroundColor: colors.primary },
                    ]}
                  >
                    {w._selected && <Feather name="check" size={12} color="#FFF" />}
                  </View>
                  <View>
                    <Text style={[styles.previewName, { color: colors.foreground }]}>{w.name}</Text>
                    <Text style={[styles.previewDate, { color: colors.mutedForeground }]}>
                      {new Date(w.startTime).toLocaleDateString("en", {
                        weekday: "short", month: "short", day: "numeric", year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
                {w._isDuplicate && (
                  <View style={[styles.dupTag, { backgroundColor: colors.warning + "22" }]}>
                    <Text style={[styles.dupText, { color: colors.warning }]}>Duplicate</Text>
                  </View>
                )}
              </View>

              <View style={styles.previewStats}>
                <Text style={[styles.previewStat, { color: colors.mutedForeground }]}>
                  {w.exercises.length} exercise{w.exercises.length !== 1 ? "s" : ""}
                </Text>
                <Text style={[styles.previewStat, { color: colors.mutedForeground }]}>·</Text>
                <Text style={[styles.previewStat, { color: colors.mutedForeground }]}>{w.totalSets} sets</Text>
                {w.totalVolume > 0 && (
                  <>
                    <Text style={[styles.previewStat, { color: colors.mutedForeground }]}>·</Text>
                    <Text style={[styles.previewStat, { color: colors.mutedForeground }]}>{w.totalVolume}kg vol</Text>
                  </>
                )}
              </View>

              {w.exercises.slice(0, 3).map((e, ei) => {
                const ex = BUILT_IN_EXERCISES.find((b) => b.id === e.exerciseId);
                return (
                  <Text key={ei} style={[styles.previewExercise, { color: colors.foreground }]}>
                    {ex?.name ?? e.exerciseId} ×{" "}
                    {e.sets.map((s) => (s.reps ?? "?")).join(", ")} reps
                    {e.sets[0]?.weight ? ` @ ${e.sets[0].weight}kg` : ""}
                  </Text>
                );
              })}
              {w.exercises.length > 3 && (
                <Text style={[styles.previewMore, { color: colors.mutedForeground }]}>
                  +{w.exercises.length - 3} more…
                </Text>
              )}
              {w._parseWarnings.length > 0 && (
                <View style={[styles.cardWarnings, { borderTopColor: colors.border }]}>
                  {w._parseWarnings.slice(0, 2).map((warn, wi) => (
                    <Text key={wi} style={[styles.cardWarningText, { color: colors.warning }]}>⚠ {warn}</Text>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Import Data</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Paste Your Workout Notes</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Paste text from Notes, Google Docs, or any format. Pyra will detect dates, exercises, sets, reps, and weight automatically.
          </Text>
        </View>

        <View style={[styles.formatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formatTitle, { color: colors.foreground }]}>Supported formats</Text>
          {[
            "March 15, 2024\nBench Press: 3x8 @ 100kg\nSquat: 4x6 @ 120kg",
            "2024-01-15\n- Bench Press 100kg x 8 reps x 3 sets",
            "January 15\nBench: 100 x 8, 100 x 8, 105 x 6",
          ].map((ex, i) => (
            <View key={i} style={[styles.formatExample, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Text style={[styles.formatCode, { color: colors.mutedForeground }]}>{ex}</Text>
            </View>
          ))}
        </View>

        <TextInput
          style={[
            styles.textArea,
            { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
          ]}
          multiline
          numberOfLines={14}
          textAlignVertical="top"
          placeholder={"Paste your workout notes here...\n\nExample:\nMarch 15, 2024\nBench Press: 3x8 @ 100kg\nSquat: 120kg x 6 x 4 sets\n\nMarch 17, 2024\nDeadlift: 140kg x 5\nPull-ups: 3x10"}
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
        />

        <TouchableOpacity
          style={[styles.parseBtn, { backgroundColor: parsing ? colors.muted : colors.primary }]}
          onPress={handleParse}
          disabled={parsing}
        >
          {parsing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Feather name="zap" size={18} color="#FFF" />
              <Text style={styles.parseBtnText}>Parse & Preview</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  importBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  importBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  formatCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  formatTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 4 },
  formatExample: { borderRadius: 8, borderWidth: 1, padding: 10 },
  formatCode: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, lineHeight: 18 },
  textArea: { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 200, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  parseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  parseBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  warningBanner: { flexDirection: "row", alignItems: "center", gap: 8, margin: 16, marginBottom: 0, padding: 12, borderRadius: 10, borderWidth: 1 },
  warningText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  warningList: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  warningItem: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  previewCard: { borderRadius: 16, padding: 14, gap: 8 },
  previewCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewCheckbox: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  previewName: { fontFamily: "Inter_700Bold", fontSize: 15 },
  previewDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  dupTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  dupText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  previewStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  previewStat: { fontFamily: "Inter_400Regular", fontSize: 13 },
  previewExercise: { fontFamily: "Inter_500Medium", fontSize: 13 },
  previewMore: { fontFamily: "Inter_400Regular", fontSize: 12 },
  cardWarnings: { borderTopWidth: 1, paddingTop: 8, gap: 3 },
  cardWarningText: { fontFamily: "Inter_400Regular", fontSize: 12 },
});

// --- app/index.tsx ---
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatCard } from "@/components/StatCard";
import { TierBadge } from "@/components/TierBadge";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { getCurrentTier, getNextTier, getTierProgress } from "@/constants/tiers";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getWeekDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({ date: d.toDateString(), label: d.toLocaleDateString("en", { weekday: "short" })[0] });
  }
  return days;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workoutHistory, personalRecords, exercises, streak, activeWorkout, workoutPlans } = useWorkout();

  const weekDays = useMemo(() => getWeekDays(), []);
  const workoutDates = useMemo(
    () => new Set(workoutHistory.map((w) => new Date(w.startTime).toDateString())),
    [workoutHistory]
  );

  const totalWorkouts = workoutHistory.length;
  const tier = getCurrentTier(totalWorkouts);
  const nextTier = getNextTier(totalWorkouts);
  const progress = getTierProgress(totalWorkouts);

  const recentWorkouts = workoutHistory.slice(0, 5);

  const weeklyVolume = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return workoutHistory
      .filter((w) => w.startTime > cutoff)
      .reduce((s, w) => s + w.totalVolume, 0);
  }, [workoutHistory]);

  const weeklyCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return workoutHistory.filter((w) => w.startTime > cutoff).length;
  }, [workoutHistory]);

  const topPRs = useMemo(() => {
    return Object.values(personalRecords)
      .sort((a, b) => b.date - a.date)
      .slice(0, 3);
  }, [personalRecords]);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[colors.primary + "22", colors.background]}
        style={[styles.header, { paddingTop: topInset + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Pyra</Text>
          </View>
          <TierBadge tier={tier} size="sm" showLabel={false} />
        </View>

        {streak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="zap" size={16} color={colors.accent} />
            <Text style={[styles.streakText, { color: colors.foreground }]}>
              {streak} day streak
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/workout/active")}
          activeOpacity={0.85}
        >
          <Feather name="play" size={20} color="#FFF" />
          <Text style={styles.startBtnText}>
            {activeWorkout ? "Resume Workout" : "Start Workout"}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.weekRow}>
          {weekDays.map((day) => {
            const done = workoutDates.has(day.date);
            const isToday = day.date === new Date().toDateString();
            return (
              <View key={day.date} style={styles.dayItem}>
                <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>{day.label}</Text>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: done ? colors.primary : isToday ? colors.border : colors.muted,
                      borderWidth: isToday ? 2 : 0,
                      borderColor: colors.primary,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, styles.statsRow]}>
        <StatCard label="Workouts" value={String(weeklyCount)} subtitle="this week" accent={colors.primary} />
        <StatCard label="Volume" value={weeklyVolume > 0 ? `${Math.round(weeklyVolume / 1000)}k` : "0"} subtitle="this week" accent={colors.accent} />
        <StatCard label="Streak" value={String(streak)} subtitle={streak === 1 ? "day" : "days"} accent={colors.success} />
      </View>

      {totalWorkouts > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tier Progress</Text>
            <Text style={[styles.seeAll, { color: colors.primary }]} onPress={() => router.push("/(tabs)/profile")}>
              View all
            </Text>
          </View>
          <View style={[styles.tierCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TierBadge tier={tier} size="md" showLabel />
            <View style={styles.tierInfo}>
              <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: tier.color }]} />
              </View>
              <Text style={[styles.tierMeta, { color: colors.mutedForeground }]}>
                {totalWorkouts} workouts
                {nextTier ? ` · ${nextTier.minWorkouts - totalWorkouts} to ${nextTier.label}` : " · Max tier!"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {recentWorkouts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Workouts</Text>
            <Text style={[styles.seeAll, { color: colors.primary }]} onPress={() => router.push("/(tabs)/progress")}>
              See all
            </Text>
          </View>
          {recentWorkouts.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/history/${w.id}`)}
              activeOpacity={0.75}
            >
              <View style={styles.historyLeft}>
                <Text style={[styles.historyName, { color: colors.foreground }]}>{w.name}</Text>
                <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                  {new Date(w.startTime).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}{formatDuration(w.duration)}
                  {" · "}{w.totalSets} sets
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {topPRs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Records</Text>
            <Text style={[styles.seeAll, { color: colors.primary }]} onPress={() => router.push("/(tabs)/progress")}>
              See all
            </Text>
          </View>
          {topPRs.map((pr) => {
            const ex = exercises.find((e) => e.id === pr.exerciseId);
            return (
              <View key={pr.exerciseId} style={[styles.prCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.prIcon, { backgroundColor: colors.accent + "22" }]}>
                  <Feather name="award" size={16} color={colors.accent} />
                </View>
                <View style={styles.prInfo}>
                  <Text style={[styles.prName, { color: colors.foreground }]}>{ex?.name ?? "Unknown"}</Text>
                  <Text style={[styles.prValue, { color: colors.mutedForeground }]}>
                    {pr.weight}kg × {pr.reps} · 1RM ~{pr.estimatedOneRM}kg
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {workoutHistory.length === 0 && workoutPlans.length === 0 && (
        <View style={styles.emptyContainer}>
          <Feather name="activity" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ready to start?</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Tap "Start Workout" to log your first session, or create a plan first.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 2 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  streakText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  startBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFF" },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  seeAll: { fontFamily: "Inter_500Medium", fontSize: 14 },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayItem: { alignItems: "center", gap: 6 },
  dayLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  dayDot: { width: 28, height: 28, borderRadius: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  tierCard: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  tierInfo: { flex: 1, gap: 8 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  tierMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  historyCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  historyLeft: { flex: 1 },
  historyName: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 3 },
  historyMeta: { fontFamily: "Inter_400Regular", fontSize: 13 },
  prCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  prIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  prInfo: { flex: 1 },
  prName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  prValue: { fontFamily: "Inter_400Regular", fontSize: 13 },
  emptyContainer: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
});

// --- app/library.tsx ---
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExerciseCard } from "@/components/ExerciseCard";
import { CATEGORIES } from "@/constants/exercises";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import type { Exercise } from "@/constants/exercises";
import type { MuscleGroup } from "@/constants/exercises";

const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"] as const;

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { exercises, addCustomExercise } = useWorkout();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showCreate, setShowCreate] = useState(false);

  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>("Chest");
  const [newEquip, setNewEquip] = useState("Barbell");
  const [newNotes, setNewNotes] = useState("");
  const [newDiff, setNewDiff] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.primaryMuscle.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || e.category === category;
      return matchSearch && matchCat;
    });
  }, [exercises, search, category]);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  function handleCreate() {
    if (!newName.trim()) return;
    addCustomExercise({
      name: newName.trim(),
      primaryMuscle: newMuscle,
      secondaryMuscles: [],
      equipment: newEquip,
      difficulty: newDiff,
      category: "Custom",
      trackingType: "weight_reps",
      notes: newNotes,
    });
    setNewName("");
    setNewNotes("");
    setShowCreate(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Exercise Library</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreate(true)}
          >
            <Feather name="plus" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search exercises..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                {
                  backgroundColor: category === cat ? colors.primary : colors.muted,
                  borderColor: category === cat ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: category === cat ? "#FFF" : colors.mutedForeground },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            onPress={() => router.push(`/exercise/${item.id}`)}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: 100 + bottomPad }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No exercises found</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={showCreate} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Custom Exercise</Text>
            <TouchableOpacity onPress={handleCreate}>
              <Text style={[styles.save, { color: newName.trim() ? colors.primary : colors.mutedForeground }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NAME *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Exercise name"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>EQUIPMENT</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Barbell, Dumbbell, Bodyweight"
              placeholderTextColor={colors.mutedForeground}
              value={newEquip}
              onChangeText={setNewEquip}
            />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DIFFICULTY</Text>
            <View style={styles.chipRow}>
              {(["Beginner", "Intermediate", "Advanced"] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, { backgroundColor: newDiff === d ? colors.primary : colors.muted }]}
                  onPress={() => setNewDiff(d)}
                >
                  <Text style={[styles.chipText, { color: newDiff === d ? "#FFF" : colors.mutedForeground }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NOTES</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Optional notes..."
              placeholderTextColor={colors.mutedForeground}
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
              numberOfLines={4}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  filterRow: { marginBottom: 8, marginLeft: -20, paddingLeft: 20 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  cancel: { fontFamily: "Inter_400Regular", fontSize: 16 },
  save: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  modalContent: { padding: 20, gap: 8 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, marginTop: 8 },
  textInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: "Inter_400Regular", fontSize: 15 },
  textArea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
});

// --- app/plan.tsx ---
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExerciseCard } from "@/components/ExerciseCard";
import { CATEGORIES } from "@/constants/exercises";
import {
  ActiveExercise,
  PlanDay,
  PlanExercise,
  WorkoutPlan,
  useWorkout,
} from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ─── Day-of-week toggle picker ─────────────────────────────────────────────────
const WEEK_DAYS = [
  { key: "Mon", full: "Monday" },
  { key: "Tue", full: "Tuesday" },
  { key: "Wed", full: "Wednesday" },
  { key: "Thu", full: "Thursday" },
  { key: "Fri", full: "Friday" },
  { key: "Sat", full: "Saturday" },
  { key: "Sun", full: "Sunday" },
];

interface DayPickerProps {
  days: PlanDay[];
  onChange: (days: PlanDay[]) => void;
}

function DayPicker({ days, onChange }: DayPickerProps) {
  const colors = useColors();

  // Which weekday keys are active
  const activeDayNames = new Set(days.map((d) => d.name));

  function toggle(full: string) {
    if (activeDayNames.has(full)) {
      // Remove this day (ask if it has exercises)
      const existing = days.find((d) => d.name === full);
      if (existing && existing.exercises.length > 0) {
        Alert.alert(
          "Remove Day",
          `Remove ${full} and its ${existing.exercises.length} exercise(s)?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: () => onChange(days.filter((d) => d.name !== full)),
            },
          ]
        );
      } else {
        onChange(days.filter((d) => d.name !== full));
      }
    } else {
      // Add this day — insert in week order
      const newDay: PlanDay = { id: genId(), name: full, exercises: [] };
      const weekOrder = WEEK_DAYS.map((w) => w.full);
      const next = [...days, newDay].sort(
        (a, b) => weekOrder.indexOf(a.name) - weekOrder.indexOf(b.name)
      );
      onChange(next);
    }
  }

  return (
    <View style={styles.dayPickerRow}>
      {WEEK_DAYS.map(({ key, full }) => {
        const active = activeDayNames.has(full);
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.dayChip,
              {
                backgroundColor: active ? colors.primary : colors.muted,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            onPress={() => toggle(full)}
          >
            <Text
              style={[
                styles.dayChipText,
                { color: active ? "#FFF" : colors.mutedForeground },
              ]}
            >
              {key}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workoutPlans, exercises, addWorkoutPlan, updateWorkoutPlan, startWorkout, getPreviousValues } =
    useWorkout();

  const isNew = id === "new";
  const existingPlan = workoutPlans.find((p) => p.id === id);

  const [name, setName] = useState(existingPlan?.name ?? "");
  const [description, setDescription] = useState(existingPlan?.description ?? "");
  const [days, setDays] = useState<PlanDay[]>(existingPlan?.days ?? []);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(
    existingPlan?.id ?? null
  );

  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [showExPicker, setShowExPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState("All");
  const [isSaving, setIsSaving] = useState(false);

  const filteredExercises = useMemo(() => {
    return exercises.filter((e) => {
      const matchSearch =
        !pickerSearch ||
        e.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        e.primaryMuscle.toLowerCase().includes(pickerSearch.toLowerCase());
      const matchCat = pickerCategory === "All" || e.category === pickerCategory;
      return matchSearch && matchCat;
    });
  }, [exercises, pickerSearch, pickerCategory]);

  function addExerciseToDay(exerciseId: string) {
    if (selectedDayIdx === null) return;
    const pe: PlanExercise = {
      id: genId(),
      exerciseId,
      sets: 3,
      reps: 10,
      weight: 0,
      restTime: 90,
      notes: "",
    };
    setDays((prev) =>
      prev.map((d, i) =>
        i === selectedDayIdx ? { ...d, exercises: [...d.exercises, pe] } : d
      )
    );
    setShowExPicker(false);
    setPickerSearch("");
  }

  function removeExerciseFromDay(dayIdx: number, exId: string) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d
      )
    );
  }

  function updatePlanExercise(dayIdx: number, exId: string, updates: Partial<PlanExercise>) {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...updates } : e)) }
      )
    );
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  function handleSave(): string | null {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a plan name.");
      return null;
    }
    const planData = { name: name.trim(), description: description.trim(), days };
    if (isNew && !savedPlanId) {
      const newPlan = addWorkoutPlan(planData);
      setSavedPlanId(newPlan.id);
      return newPlan.id;
    } else {
      const pid = savedPlanId ?? existingPlan?.id;
      if (pid) updateWorkoutPlan(pid, planData);
      return pid ?? null;
    }
  }

  function handleSaveAndBack() {
    const pid = handleSave();
    if (pid !== null) router.back();
  }

  // ── Start day ─────────────────────────────────────────────────────────────────
  function handleStartDay(dayIdx: number) {
    if (!name.trim()) {
      Alert.alert("Save first", "Please enter a plan name before starting a workout.");
      return;
    }
    // Always persist first
    const pid = handleSave();
    if (!pid) return;

    const day = days[dayIdx];
    const exList: ActiveExercise[] = day.exercises.map((pe, i) => {
      const prev = getPreviousValues(pe.exerciseId);
      return {
        id: `${Date.now()}_${i}`,
        exerciseId: pe.exerciseId,
        sets: Array.from({ length: pe.sets }, (_, si) => ({
          id: `${Date.now()}_${i}_${si}`,
          weight: pe.weight > 0 ? String(pe.weight) : prev?.weight ? String(prev.weight) : "",
          reps: pe.reps > 0 ? String(pe.reps) : prev?.reps ? String(prev.reps) : "",
          duration: "",
          distance: "",
          isCompleted: false as const,
          previousWeight: prev?.weight,
          previousReps: prev?.reps,
        })),
        restTime: pe.restTime,
        notes: pe.notes,
      };
    });

    startWorkout(`${name} - ${day.name}`, exList, pid);
    router.push("/workout/active");
  }

  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isNew ? "New Plan" : "Edit Plan"}
        </Text>
        <TouchableOpacity
          onPress={handleSaveAndBack}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 80 + bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Plan name / description */}
        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PLAN NAME</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Push Pull Legs"
            placeholderTextColor={colors.mutedForeground}
            autoFocus={isNew}
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
            DESCRIPTION (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description..."
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Training days */}
        <View style={styles.daysSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Training Days</Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Tap the days you train each week
          </Text>

          {/* Day-of-week toggles */}
          <DayPicker days={days} onChange={setDays} />

          {days.length === 0 && (
            <View style={[styles.emptyDays, { borderColor: colors.border }]}>
              <Text style={[styles.emptyDaysText, { color: colors.mutedForeground }]}>
                No training days selected yet.
              </Text>
            </View>
          )}

          {/* Day cards with exercise lists */}
          {days.map((day, dayIdx) => (
            <View
              key={day.id}
              style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.dayHeader}>
                <Text style={[styles.dayName, { color: colors.foreground }]}>{day.name}</Text>
                <TouchableOpacity
                  style={[styles.dayActionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleStartDay(dayIdx)}
                >
                  <Feather name="play" size={14} color="#FFF" />
                  <Text style={styles.startDayText}>Start</Text>
                </TouchableOpacity>
              </View>

              {day.exercises.map((pe) => {
                const ex = exercises.find((e) => e.id === pe.exerciseId);
                return (
                  <View
                    key={pe.id}
                    style={[styles.planExRow, { borderTopColor: colors.border }]}
                  >
                    <View style={styles.planExLeft}>
                      <Text style={[styles.planExName, { color: colors.foreground }]}>
                        {ex?.name ?? "Unknown"}
                      </Text>
                      <View style={styles.planExInputs}>
                        <TextInput
                          style={[
                            styles.smallInput,
                            { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
                          ]}
                          value={String(pe.sets)}
                          onChangeText={(t) =>
                            updatePlanExercise(dayIdx, pe.id, { sets: parseInt(t) || 0 })
                          }
                          keyboardType="number-pad"
                          placeholder="Sets"
                          placeholderTextColor={colors.mutedForeground}
                        />
                        <Text style={[styles.inputSep, { color: colors.mutedForeground }]}>×</Text>
                        <TextInput
                          style={[
                            styles.smallInput,
                            { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
                          ]}
                          value={String(pe.reps)}
                          onChangeText={(t) =>
                            updatePlanExercise(dayIdx, pe.id, { reps: parseInt(t) || 0 })
                          }
                          keyboardType="number-pad"
                          placeholder="Reps"
                          placeholderTextColor={colors.mutedForeground}
                        />
                        <Text style={[styles.inputSep, { color: colors.mutedForeground }]}>reps</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeExerciseFromDay(dayIdx, pe.id)}>
                      <Feather name="x" size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity
                style={[styles.addExToDay, { borderColor: colors.primary }]}
                onPress={() => {
                  setSelectedDayIdx(dayIdx);
                  setShowExPicker(true);
                }}
              >
                <Feather name="plus" size={14} color={colors.primary} />
                <Text style={[styles.addExToDayText, { color: colors.primary }]}>
                  Add Exercise
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Exercise picker modal */}
      <Modal
        visible={showExPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExPicker(false)}
      >
        <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.pickerHeader,
              { borderBottomColor: colors.border, paddingTop: 20 },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
              Add Exercise
            </Text>
            <TouchableOpacity onPress={() => setShowExPicker(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={[styles.pickerSearch, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
            >
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search exercises..."
                placeholderTextColor={colors.mutedForeground}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoFocus
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        pickerCategory === cat ? colors.primary : colors.muted,
                    },
                  ]}
                  onPress={() => setPickerCategory(cat)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color:
                          pickerCategory === cat ? "#FFF" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExerciseCard
                exercise={item}
                showAdd
                onAdd={() => addExerciseToDay(item.id)}
                onPress={() => addExerciseToDay(item.id)}
                compact
              />
            )}
            contentContainerStyle={styles.pickerList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFF" },
  scroll: { paddingBottom: 40 },
  formSection: { padding: 20, gap: 8 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  daysSection: { paddingHorizontal: 20 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 4 },
  sectionHint: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 14 },
  // Day-of-week chip row
  dayPickerRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 44,
    alignItems: "center",
  },
  dayChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  emptyDays: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  emptyDaysText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  dayCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  dayActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  startDayText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#FFF" },
  planExRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  planExLeft: { flex: 1, gap: 6 },
  planExName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  planExInputs: { flexDirection: "row", alignItems: "center", gap: 6 },
  smallInput: {
    width: 48,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  inputSep: { fontFamily: "Inter_400Regular", fontSize: 14 },
  addExToDay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 12,
  },
  addExToDayText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  pickerContainer: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  pickerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  pickerSearch: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  pickerList: { paddingHorizontal: 20, paddingVertical: 12 },
});

// --- app/profile.tsx ---
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TierBadge } from "@/components/TierBadge";
import { TIERS } from "@/constants/tiers";
import { useAuth } from "@/context/AuthContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { getCurrentTier, getNextTier, getTierProgress } from "@/constants/tiers";

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function AvatarSection() {
  const colors = useColors();
  const { profile, uploadAvatar, updateProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.display_name ?? "");
  const [savingName, setSavingName] = useState(false);

  async function saveName() {
    setSavingName(true);
    try {
      await updateProfile({ display_name: nameInput.trim() || null });
    } catch {}
    setSavingName(false);
    setEditingName(false);
  }

  const initials = (profile?.display_name ?? profile?.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.avatarSection}>
      <TouchableOpacity onPress={uploadAvatar} activeOpacity={0.8}>
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={[styles.avatar, { borderColor: colors.border }]}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={[styles.avatar, styles.avatarPlaceholder]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
        )}
        <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
          <Feather name="camera" size={12} color="#FFF" />
        </View>
      </TouchableOpacity>

      {editingName ? (
        <View style={styles.nameEditRow}>
          <TextInput
            style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
            value={nameInput}
            onChangeText={setNameInput}
            autoFocus
            onSubmitEditing={saveName}
          />
          <TouchableOpacity onPress={saveName} disabled={savingName}>
            {savingName ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="check" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditingName(false)}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.nameRow}
          onPress={() => { setNameInput(profile?.display_name ?? ""); setEditingName(true); }}
        >
          <Text style={[styles.displayName, { color: colors.foreground }]}>
            {profile?.display_name ?? "Set your name"}
          </Text>
          <Feather name="edit-2" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      <Text style={[styles.emailText, { color: colors.mutedForeground }]}>
        {profile?.email ?? ""}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { workoutHistory, personalRecords, settings, updateSettings, streak, longestStreak } = useWorkout();

  const totalWorkouts = workoutHistory.length;
  const currentTier = getCurrentTier(totalWorkouts);
  const nextTier = getNextTier(totalWorkouts);
  const progress = getTierProgress(totalWorkouts);

  const totalVolume = workoutHistory.reduce((s, w) => s + w.totalVolume, 0);
  const totalSets = workoutHistory.reduce((s, w) => s + w.totalSets, 0);
  const totalReps = workoutHistory.reduce((s, w) => s + w.totalReps, 0);
  const totalTime = workoutHistory.reduce((s, w) => s + w.duration, 0);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.border }]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + name */}
      <AvatarSection />

      {/* Tier hero */}
      <LinearGradient
        colors={[currentTier.gradientStart + "33", colors.background]}
        style={styles.tierHero}
      >
        <TierBadge tier={currentTier} size="lg" showLabel />
        <View style={styles.progressSection}>
          <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: currentTier.color }]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {totalWorkouts} workouts
            {nextTier
              ? ` · ${nextTier.minWorkouts - totalWorkouts} more to ${nextTier.label}`
              : " · Maximum tier reached!"}
          </Text>
        </View>
        <View style={styles.streakRow}>
          <View style={[styles.streakBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="zap" size={14} color={colors.accent} />
            <Text style={[styles.streakText, { color: colors.foreground }]}>{streak} day streak</Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="star" size={14} color={colors.primary} />
            <Text style={[styles.streakText, { color: colors.foreground }]}>{longestStreak} best</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stats</Text>
        <View style={styles.statsGrid}>
          {[
            { label: "Workouts", value: String(totalWorkouts), color: colors.primary },
            { label: "Volume", value: totalVolume >= 1000 ? `${Math.round(totalVolume / 1000)}k kg` : `${totalVolume} kg`, color: colors.accent },
            { label: "Total Sets", value: String(totalSets), color: colors.success },
            { label: "Total Reps", value: String(totalReps), color: colors.info },
            { label: "Time", value: formatDuration(totalTime), color: colors.warning },
            { label: "PRs", value: String(Object.keys(personalRecords).length), color: colors.accent },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tiers */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Tiers</Text>
        <View style={[styles.tierList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {TIERS.map((tier, idx) => {
            const unlocked = totalWorkouts >= tier.minWorkouts;
            const isCurrentTier = tier.label === currentTier.label;
            return (
              <View
                key={tier.label}
                style={[styles.tierRow, { borderBottomColor: colors.border }, idx < TIERS.length - 1 && styles.tierRowBorder]}
              >
                <View style={styles.tierLeft}>
                  <LinearGradient
                    colors={unlocked ? [tier.gradientStart, tier.gradientEnd] : [colors.muted, colors.border]}
                    style={styles.tierDot}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {!unlocked && <Feather name="lock" size={10} color={colors.mutedForeground} />}
                  </LinearGradient>
                  <View>
                    <Text style={[styles.tierName, { color: unlocked ? (isCurrentTier ? tier.color : colors.foreground) : colors.mutedForeground }, isCurrentTier && styles.tierNameCurrent]}>
                      {tier.label}{isCurrentTier ? " ✓" : ""}
                    </Text>
                    <Text style={[styles.tierDesc, { color: colors.mutedForeground }]}>{tier.description}</Text>
                  </View>
                </View>
                <Text style={[styles.tierRequirement, { color: unlocked ? colors.success : colors.mutedForeground }]}>
                  {tier.minWorkouts}+ workouts
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Feather name="settings" size={18} color={colors.mutedForeground} />
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Imperial Units (lb)</Text>
            </View>
            <Switch
              value={settings.unit === "imperial"}
              onValueChange={(v) => updateSettings({ unit: v ? "imperial" : "metric" })}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Feather name="eye" size={18} color={colors.mutedForeground} />
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Show Previous Values</Text>
            </View>
            <Switch
              value={settings.showPreviousValues}
              onValueChange={(v) => updateSettings({ showPreviousValues: v })}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => router.push("/import")}>
            <View style={styles.settingLeft}>
              <Feather name="upload" size={18} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.primary }]}>Import Data</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
            <View style={styles.settingLeft}>
              <Feather name="log-out" size={18} color={colors.destructive} />
              <Text style={[styles.settingLabel, { color: colors.destructive }]}>Sign Out</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, { marginTop: 12 }]}>
        <Text style={[styles.appVersion, { color: colors.mutedForeground }]}>
          Pyra · Powered by Supabase
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  signOutBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  signOutText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  avatarSection: { alignItems: "center", paddingVertical: 24, gap: 10 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3 },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 32, color: "#FFF" },
  avatarBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: { height: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontFamily: "Inter_600SemiBold", fontSize: 16, minWidth: 180 },
  displayName: { fontFamily: "Inter_700Bold", fontSize: 20 },
  emailText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  tierHero: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 20, gap: 20 },
  progressSection: { width: "100%", gap: 8 },
  progressBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabel: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  streakRow: { flexDirection: "row", gap: 12 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  streakText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "30%", flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 4, minWidth: 90 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
  tierList: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  tierRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  tierRowBorder: { borderBottomWidth: 1 },
  tierLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  tierDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  tierName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  tierNameCurrent: { fontFamily: "Inter_700Bold" },
  tierDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  tierRequirement: { fontFamily: "Inter_500Medium", fontSize: 12 },
  settingsCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingLabel: { fontFamily: "Inter_500Medium", fontSize: 15 },
  appVersion: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
});

// --- app/progress.tsx ---
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function getWeekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return "This wk";
  if (weeksAgo === 1) return "Last wk";
  return `${weeksAgo}w ago`;
}

function getMonthCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workoutHistory, personalRecords, exercises, formatWeight } = useWorkout();

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const workoutDates = useMemo(
    () => new Set(workoutHistory.map((w) => new Date(w.startTime).toDateString())),
    [workoutHistory]
  );

  const volumeChart = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weeksAgo = 7 - i;
      const start = Date.now() - weeksAgo * 7 * 86400000;
      const end = start + 7 * 86400000;
      const vol = workoutHistory
        .filter((w) => w.startTime >= start && w.startTime < end)
        .reduce((s, w) => s + w.totalVolume, 0);
      return { label: getWeekLabel(weeksAgo), value: vol };
    });
  }, [workoutHistory]);

  const workoutsChart = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weeksAgo = 7 - i;
      const start = Date.now() - weeksAgo * 7 * 86400000;
      const end = start + 7 * 86400000;
      const count = workoutHistory.filter((w) => w.startTime >= start && w.startTime < end).length;
      return { label: getWeekLabel(weeksAgo), value: count };
    });
  }, [workoutHistory]);

  const sortedPRs = useMemo(
    () => Object.values(personalRecords).sort((a, b) => b.estimatedOneRM - a.estimatedOneRM),
    [personalRecords]
  );

  const { firstDay, daysInMonth } = getMonthCalendar(calYear, calMonth);
  const calDays = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  function calDateStr(day: number) {
    return new Date(calYear, calMonth, day).toDateString();
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  const totalVolume = workoutHistory.reduce((s, w) => s + w.totalVolume, 0);
  const totalSets = workoutHistory.reduce((s, w) => s + w.totalSets, 0);
  const totalTime = workoutHistory.reduce((s, w) => s + w.duration, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Progress</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="chevron-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {new Date(calYear, calMonth).toLocaleDateString("en", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="chevron-right" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.calCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.calWeekRow}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <Text key={d} style={[styles.calDayHeader, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {calDays.map((day, idx) => {
              if (!day) return <View key={`e${idx}`} style={styles.calCell} />;
              const dateStr = calDateStr(day);
              const hasWorkout = workoutDates.has(dateStr);
              const isToday = dateStr === now.toDateString();
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calCell,
                    hasWorkout && { backgroundColor: colors.primary },
                    isToday && !hasWorkout && { borderWidth: 1.5, borderColor: colors.primary },
                    { borderRadius: 20 },
                  ]}
                  onPress={() => {
                    const w = workoutHistory.find((w) => new Date(w.startTime).toDateString() === dateStr);
                    if (w) router.push(`/history/${w.id}`);
                  }}
                >
                  <Text
                    style={[
                      styles.calDayText,
                      { color: hasWorkout ? "#FFF" : isToday ? colors.primary : colors.foreground },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Time Stats</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.primary }]}>{workoutHistory.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Workouts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.accent }]}>
              {totalVolume >= 1000 ? `${Math.round(totalVolume / 1000)}k` : totalVolume}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>kg Volume</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.success }]}>{totalSets}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Sets</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.info }]}>{formatDuration(totalTime)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Time</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Weekly Volume</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {volumeChart.every((d) => d.value === 0) ? (
            <Text style={[styles.noData, { color: colors.mutedForeground }]}>No workout data yet</Text>
          ) : (
            <SimpleBarChart data={volumeChart} height={120} barColor={colors.primary} />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Workouts per Week</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {workoutsChart.every((d) => d.value === 0) ? (
            <Text style={[styles.noData, { color: colors.mutedForeground }]}>No workout data yet</Text>
          ) : (
            <SimpleBarChart data={workoutsChart} height={100} barColor={colors.accent} />
          )}
        </View>
      </View>

      {sortedPRs.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Personal Records</Text>
          {sortedPRs.slice(0, 10).map((pr) => {
            const ex = exercises.find((e) => e.id === pr.exerciseId);
            return (
              <TouchableOpacity
                key={pr.exerciseId}
                style={[styles.prRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/exercise/${pr.exerciseId}`)}
                activeOpacity={0.75}
              >
                <View style={[styles.prIcon, { backgroundColor: colors.accent + "22" }]}>
                  <Feather name="award" size={16} color={colors.accent} />
                </View>
                <View style={styles.prInfo}>
                  <Text style={[styles.prName, { color: colors.foreground }]}>{ex?.name ?? "Unknown"}</Text>
                  <Text style={[styles.prMeta, { color: colors.mutedForeground }]}>
                    {pr.weight}kg × {pr.reps} reps · 1RM ~{pr.estimatedOneRM}kg
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {workoutHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Workout History</Text>
          {workoutHistory.slice(0, 20).map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[styles.histRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/history/${w.id}`)}
              activeOpacity={0.75}
            >
              <View style={styles.histInfo}>
                <Text style={[styles.histName, { color: colors.foreground }]}>{w.name}</Text>
                <Text style={[styles.histMeta, { color: colors.mutedForeground }]}>
                  {new Date(w.startTime).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}{formatDuration(w.duration)} · {w.totalSets} sets · {Math.round(w.totalVolume)}kg
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  calCard: { borderRadius: 16, borderWidth: 1, padding: 12 },
  calWeekRow: { flexDirection: "row", marginBottom: 8 },
  calDayHeader: { flex: 1, textAlign: "center", fontFamily: "Inter_500Medium", fontSize: 12 },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  calDayText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: "45%", borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statVal: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  noData: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 20 },
  prRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  prIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  prInfo: { flex: 1 },
  prName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  prMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  histRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  histInfo: { flex: 1 },
  histName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  histMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
});

// --- app/sign-in.tsx ---
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // onAuthStateChange in AuthContext handles the redirect
    } catch (e: any) {
      setError(e.message ?? "Sign-in failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="zap" size={36} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>Pyra</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Your personal training tracker
          </Text>
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Welcome back
          </Text>

          {error && (
            <View
              style={[styles.errorBox, { backgroundColor: colors.destructive + "20" }]}
            >
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              EMAIL
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              PASSWORD
            </Text>
            <View style={styles.pwWrap}>
              <TextInput
                style={[
                  styles.input,
                  styles.pwInput,
                  { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPw((v) => !v)}
              >
                <Feather
                  name={showPw ? "eye-off" : "eye"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/auth/sign-up")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center", gap: 28 },
  logoWrap: { alignItems: "center", gap: 12 },
  logoGradient: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  appName: { fontFamily: "Inter_700Bold", fontSize: 34, letterSpacing: -0.5 },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 16 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  field: { gap: 6 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: "Inter_400Regular", fontSize: 15 },
  pwWrap: { position: "relative" },
  pwInput: { paddingRight: 48 },
  eyeBtn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
  primaryBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  footerLink: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});

// --- app/sign-up.tsx ---
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    setError(null);
    if (!displayName.trim()) { setError("Please enter your name."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      Alert.alert(
        "Account created!",
        "Check your email for a confirmation link, then sign in.",
        [{ text: "OK", onPress: () => router.replace("/auth/sign-in") }]
      );
    } catch (e: any) {
      setError(e.message ?? "Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="zap" size={36} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>Pyra</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Start your fitness journey
          </Text>
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Create account
          </Text>

          {error && (
            <View
              style={[styles.errorBox, { backgroundColor: colors.destructive + "20" }]}
            >
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
            <View style={styles.pwWrap}>
              <TextInput
                style={[styles.input, styles.pwInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((v) => !v)}>
                <Feather name={showPw ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>CONFIRM PASSWORD</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPw}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/auth/sign-in")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center", gap: 28 },
  logoWrap: { alignItems: "center", gap: 12 },
  logoGradient: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  appName: { fontFamily: "Inter_700Bold", fontSize: 34, letterSpacing: -0.5 },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 16 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  field: { gap: 6 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: "Inter_400Regular", fontSize: 15 },
  pwWrap: { position: "relative" },
  pwInput: { paddingRight: 48 },
  eyeBtn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
  primaryBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  footerLink: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});

// --- app/workouts.tsx ---
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutPlanCard } from "@/components/WorkoutPlanCard";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

export default function WorkoutsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workoutPlans, deleteWorkoutPlan, duplicateWorkoutPlan, startWorkout, settings } = useWorkout();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  function handleDelete(id: string, name: string) {
    Alert.alert("Delete Plan", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteWorkoutPlan(id) },
    ]);
  }

  function handleStart(planId: string) {
    const plan = workoutPlans.find((p) => p.id === planId);
    if (!plan || plan.days.length === 0) {
      router.push("/workout/active");
      return;
    }
    if (plan.days.length === 1) {
      const day = plan.days[0];
      const exercises = day.exercises.map((pe) => ({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        exerciseId: pe.exerciseId,
        sets: Array.from({ length: pe.sets }, (_, i) => ({
          id: `${Date.now()}_set${i}`,
          weight: pe.weight > 0 ? String(pe.weight) : "",
          reps: pe.reps > 0 ? String(pe.reps) : "",
          duration: "",
          distance: "",
          isCompleted: false as const,
        })),
        restTime: pe.restTime,
        notes: pe.notes,
      }));
      startWorkout(`${plan.name} - ${day.name}`, exercises, plan.id);
      router.push("/workout/active");
    } else {
      router.push(`/plan/${planId}`);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Plans</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/plan/new")}
        >
          <Feather name="plus" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>New Plan</Text>
        </TouchableOpacity>
      </View>

      {workoutPlans.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="list" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No plans yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Create a workout plan to organize your training by day.
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/plan/new")}
          >
            <Text style={styles.createBtnText}>Create Plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={workoutPlans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutPlanCard
              plan={item}
              onPress={() => router.push(`/plan/${item.id}`)}
              onStart={() => handleStart(item.id)}
              onDuplicate={() => duplicateWorkoutPlan(item.id)}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + bottomPad }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFF" },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22 },
  createBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 100, marginTop: 8 },
  createBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
});


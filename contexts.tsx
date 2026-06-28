// ============================================================
// FILE: contexts.tsx — storage, AuthContext, WorkoutContext
// ============================================================

// --- context/storage.ts (web fallback) ---
import React from "react";

export function StorageProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

export function useStorageDb(): null {
  return null;
}

// --- context/storage.native.ts (native) ---
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
import React from "react";

async function initDb(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export function StorageProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(SQLiteProvider, { databaseName: "pyra.db", onInit: initDb }, children);
}

export function useStorageDb(): SQLiteDatabase | null {
  return useSQLiteContext();
}

// --- context/AuthContext.tsx ---
import { Session, User } from "@supabase/supabase-js";
import * as ImagePicker from "expo-image-picker";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, Platform } from "react-native";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, "display_name">>) => Promise<void>;
  uploadAvatar: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load session on mount ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchProfile(data.session.user.id);
      else setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Fetch / create profile row ─────────────────────────────────────────────
  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("fetchProfile error:", error);
      }
      setProfile(data ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Insert profile row immediately so it exists before the onAuthStateChange
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          display_name: displayName || null,
          avatar_url: null,
        });
      }
    },
    []
  );

  // ── Sign In ────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  // ── Sign Out ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // ── Update display name ────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, "display_name">>) => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      if (error) throw error;
      setProfile((p) => (p ? { ...p, ...updates } : p));
    },
    [user]
  );

  // ── Upload avatar ──────────────────────────────────────────────────────────
  const uploadAvatar = useCallback(async () => {
    if (!user) return;

    // Ask for permission
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow photo library access to change your profile picture."
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    try {
      // Build a unique file path per user
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      // Upload to Supabase Storage bucket "avatars"
      let uploadBody: Blob | ArrayBuffer;
      if (Platform.OS === "web") {
        const res = await fetch(asset.uri);
        uploadBody = await res.blob();
      } else {
        // On native, use base64 → ArrayBuffer
        const b64 = asset.base64!;
        const binary = atob(b64);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
        uploadBody = buffer.buffer;
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, uploadBody, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatar_url = data.publicUrl;

      // Persist to profiles table
      await supabase.from("profiles").update({ avatar_url }).eq("id", user.id);
      setProfile((p) => (p ? { ...p, avatar_url } : p));
    } catch (e: any) {
      Alert.alert("Upload failed", e.message ?? "Could not upload photo.");
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// --- context/WorkoutContext.tsx ---
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BUILT_IN_EXERCISES, Exercise } from "@/constants/exercises";
import { useStorageDb } from "./storage";

export type { Exercise };

export interface ActiveSet {
  id: string;
  weight: string;
  reps: string;
  duration: string;
  distance: string;
  isCompleted: boolean;
  previousWeight?: number;
  previousReps?: number;
}

export interface ActiveExercise {
  id: string;
  exerciseId: string;
  sets: ActiveSet[];
  restTime: number;
  notes: string;
}

export interface ActiveWorkout {
  id: string;
  name: string;
  planId?: string;
  startTime: number;
  exercises: ActiveExercise[];
  notes: string;
}

export interface LoggedSet {
  id: string;
  weight: number | null;
  reps: number | null;
  duration: number | null;
  distance: number | null;
  isCompleted: boolean;
}

export interface LoggedExercise {
  id: string;
  exerciseId: string;
  sets: LoggedSet[];
  notes: string;
}

export interface CompletedWorkout {
  id: string;
  name: string;
  planId?: string;
  startTime: number;
  endTime: number;
  duration: number;
  exercises: LoggedExercise[];
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  notes: string;
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  estimatedOneRM: number;
  date: number;
  workoutId: string;
}

export interface PlanExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  restTime: number;
  notes: string;
}

export interface PlanDay {
  id: string;
  name: string;
  exercises: PlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  days: PlanDay[];
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
}

export interface Settings {
  unit: "metric" | "imperial";
  defaultRestTime: number;
  showPreviousValues: boolean;
}

interface AppData {
  customExercises: Exercise[];
  workoutPlans: WorkoutPlan[];
  workoutHistory: CompletedWorkout[];
  personalRecords: { [exerciseId: string]: PersonalRecord };
  settings: Settings;
  activeWorkout: ActiveWorkout | null;
  streak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}

const DEFAULT_DATA: AppData = {
  customExercises: [],
  workoutPlans: [],
  workoutHistory: [],
  personalRecords: {},
  settings: { unit: "metric", defaultRestTime: 90, showPreviousValues: true },
  activeWorkout: null,
  streak: 0,
  longestStreak: 0,
  lastWorkoutDate: null,
};

const STORAGE_KEY = "@pyra_v1";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function calcOneRM(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30));
}

interface WorkoutContextType {
  exercises: Exercise[];
  workoutPlans: WorkoutPlan[];
  workoutHistory: CompletedWorkout[];
  personalRecords: { [exerciseId: string]: PersonalRecord };
  settings: Settings;
  activeWorkout: ActiveWorkout | null;
  streak: number;
  longestStreak: number;
  isLoaded: boolean;
  addCustomExercise: (e: Omit<Exercise, "id" | "isCustom">) => void;
  updateCustomExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteCustomExercise: (id: string) => void;
  addWorkoutPlan: (plan: Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt">) => WorkoutPlan;
  updateWorkoutPlan: (id: string, updates: Partial<WorkoutPlan>) => void;
  deleteWorkoutPlan: (id: string) => void;
  duplicateWorkoutPlan: (id: string) => void;
  startWorkout: (name: string, exercises: ActiveExercise[], planId?: string) => void;
  cancelWorkout: () => void;
  addExerciseToWorkout: (exerciseId: string, previousWeight?: number, previousReps?: number) => void;
  removeExerciseFromWorkout: (activeExerciseId: string) => void;
  addSet: (activeExerciseId: string) => void;
  removeSet: (activeExerciseId: string, setId: string) => void;
  updateSet: (activeExerciseId: string, setId: string, updates: Partial<ActiveSet>) => void;
  finishWorkout: () => CompletedWorkout | null;
  updateSettings: (updates: Partial<Settings>) => void;
  getExerciseById: (id: string) => Exercise | undefined;
  getPreviousValues: (exerciseId: string) => { weight: number; reps: number } | null;
  formatWeight: (kg: number) => string;
  getUnitLabel: () => string;
  importWorkouts: (workouts: Omit<CompletedWorkout, "id">[]) => void;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

type AnyDb = { getAllAsync: Function; withTransactionAsync: Function; runAsync: Function } | null;

async function loadFromSQLite(db: AnyDb): Promise<Partial<AppData> | null> {
  if (!db) return null;
  try {
    const rows = await db.getAllAsync("SELECT key, value FROM app_state") as { key: string; value: string }[];
    if (!rows || rows.length === 0) return null;
    const kv: Record<string, string> = {};
    for (const row of rows) kv[row.key] = row.value;
    return {
      customExercises: kv.customExercises ? JSON.parse(kv.customExercises) : [],
      workoutPlans: kv.workoutPlans ? JSON.parse(kv.workoutPlans) : [],
      workoutHistory: kv.workoutHistory ? JSON.parse(kv.workoutHistory) : [],
      personalRecords: kv.personalRecords ? JSON.parse(kv.personalRecords) : {},
      settings: kv.settings ? JSON.parse(kv.settings) : DEFAULT_DATA.settings,
      activeWorkout: kv.activeWorkout ? JSON.parse(kv.activeWorkout) : null,
      streak: kv.streak ? Number(kv.streak) : 0,
      longestStreak: kv.longestStreak ? Number(kv.longestStreak) : 0,
      lastWorkoutDate: kv.lastWorkoutDate || null,
    };
  } catch (e) {
    console.error("SQLite load error:", e);
    return null;
  }
}

async function persistToSQLite(db: AnyDb, data: AppData): Promise<void> {
  if (!db) return;
  const pairs: [string, string][] = [
    ["customExercises", JSON.stringify(data.customExercises)],
    ["workoutPlans", JSON.stringify(data.workoutPlans)],
    ["workoutHistory", JSON.stringify(data.workoutHistory)],
    ["personalRecords", JSON.stringify(data.personalRecords)],
    ["settings", JSON.stringify(data.settings)],
    ["activeWorkout", JSON.stringify(data.activeWorkout)],
    ["streak", String(data.streak)],
    ["longestStreak", String(data.longestStreak)],
    ["lastWorkoutDate", data.lastWorkoutDate ?? ""],
  ];
  await db.withTransactionAsync(async () => {
    for (const [key, value] of pairs) {
      await db.runAsync(
        "INSERT OR REPLACE INTO app_state (key, value, updated_at) VALUES (?, ?, ?)",
        key, value, Date.now()
      );
    }
  });
}

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const db = useStorageDb() as AnyDb;
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    async function load() {
      try {
        // Try SQLite first (native), then AsyncStorage (web/fallback)
        const sqliteData = await loadFromSQLite(db);
        if (sqliteData && Object.keys(sqliteData).length > 0) {
          setData((p) => ({ ...p, ...sqliteData }));
          setIsLoaded(true);
          return;
        }
        // Fallback: AsyncStorage (web or first-time native)
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppData>;
          setData((p) => ({ ...p, ...parsed }));
          // Migrate to SQLite if available
          if (db) {
            await persistToSQLite(db, { ...DEFAULT_DATA, ...parsed });
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error("Load error:", e);
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const snapshot = data;
    if (db) {
      persistToSQLite(db, snapshot).catch(console.error);
    } else {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch(console.error);
    }
  }, [data, isLoaded]);

  const allExercises = [...BUILT_IN_EXERCISES, ...data.customExercises];

  const addCustomExercise = useCallback((e: Omit<Exercise, "id" | "isCustom">) => {
    const newEx: Exercise = { ...e, id: genId(), isCustom: true };
    setData((p) => ({ ...p, customExercises: [...p.customExercises, newEx] }));
  }, []);

  const updateCustomExercise = useCallback((id: string, updates: Partial<Exercise>) => {
    setData((p) => ({
      ...p,
      customExercises: p.customExercises.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const deleteCustomExercise = useCallback((id: string) => {
    setData((p) => ({ ...p, customExercises: p.customExercises.filter((e) => e.id !== id) }));
  }, []);

  const addWorkoutPlan = useCallback(
    (plan: Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt">): WorkoutPlan => {
      const newPlan: WorkoutPlan = { ...plan, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
      setData((p) => ({ ...p, workoutPlans: [...p.workoutPlans, newPlan] }));
      return newPlan;
    },
    []
  );

  const updateWorkoutPlan = useCallback((id: string, updates: Partial<WorkoutPlan>) => {
    setData((p) => ({
      ...p,
      workoutPlans: p.workoutPlans.map((pl) =>
        pl.id === id ? { ...pl, ...updates, updatedAt: Date.now() } : pl
      ),
    }));
  }, []);

  const deleteWorkoutPlan = useCallback((id: string) => {
    setData((p) => ({ ...p, workoutPlans: p.workoutPlans.filter((pl) => pl.id !== id) }));
  }, []);

  const duplicateWorkoutPlan = useCallback((id: string) => {
    setData((p) => {
      const plan = p.workoutPlans.find((pl) => pl.id === id);
      if (!plan) return p;
      const copy: WorkoutPlan = {
        ...plan,
        id: genId(),
        name: `${plan.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastUsed: undefined,
      };
      return { ...p, workoutPlans: [...p.workoutPlans, copy] };
    });
  }, []);

  const startWorkout = useCallback(
    (name: string, exercises: ActiveExercise[], planId?: string) => {
      setData((p) => ({
        ...p,
        activeWorkout: { id: genId(), name, planId, startTime: Date.now(), exercises, notes: "" },
      }));
    },
    []
  );

  const cancelWorkout = useCallback(() => {
    setData((p) => ({ ...p, activeWorkout: null }));
  }, []);

  const addExerciseToWorkout = useCallback(
    (exerciseId: string, previousWeight?: number, previousReps?: number) => {
      setData((p) => {
        if (!p.activeWorkout) return p;
        const newEx: ActiveExercise = {
          id: genId(),
          exerciseId,
          sets: [{
            id: genId(),
            weight: previousWeight ? String(previousWeight) : "",
            reps: previousReps ? String(previousReps) : "",
            duration: "", distance: "",
            isCompleted: false,
            previousWeight, previousReps,
          }],
          restTime: p.settings.defaultRestTime,
          notes: "",
        };
        return {
          ...p,
          activeWorkout: { ...p.activeWorkout, exercises: [...p.activeWorkout.exercises, newEx] },
        };
      });
    },
    []
  );

  const removeExerciseFromWorkout = useCallback((activeExerciseId: string) => {
    setData((p) => {
      if (!p.activeWorkout) return p;
      return {
        ...p,
        activeWorkout: {
          ...p.activeWorkout,
          exercises: p.activeWorkout.exercises.filter((e) => e.id !== activeExerciseId),
        },
      };
    });
  }, []);

  const addSet = useCallback((activeExerciseId: string) => {
    setData((p) => {
      if (!p.activeWorkout) return p;
      return {
        ...p,
        activeWorkout: {
          ...p.activeWorkout,
          exercises: p.activeWorkout.exercises.map((e) => {
            if (e.id !== activeExerciseId) return e;
            const last = e.sets[e.sets.length - 1];
            return {
              ...e,
              sets: [
                ...e.sets,
                {
                  id: genId(),
                  weight: last?.weight ?? "",
                  reps: last?.reps ?? "",
                  duration: "", distance: "",
                  isCompleted: false,
                  previousWeight: last?.previousWeight,
                  previousReps: last?.previousReps,
                },
              ],
            };
          }),
        },
      };
    });
  }, []);

  const removeSet = useCallback((activeExerciseId: string, setId: string) => {
    setData((p) => {
      if (!p.activeWorkout) return p;
      return {
        ...p,
        activeWorkout: {
          ...p.activeWorkout,
          exercises: p.activeWorkout.exercises.map((e) =>
            e.id !== activeExerciseId ? e : { ...e, sets: e.sets.filter((s) => s.id !== setId) }
          ),
        },
      };
    });
  }, []);

  const updateSet = useCallback(
    (activeExerciseId: string, setId: string, updates: Partial<ActiveSet>) => {
      setData((p) => {
        if (!p.activeWorkout) return p;
        return {
          ...p,
          activeWorkout: {
            ...p.activeWorkout,
            exercises: p.activeWorkout.exercises.map((e) =>
              e.id !== activeExerciseId
                ? e
                : { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)) }
            ),
          },
        };
      });
    },
    []
  );

  const finishWorkout = useCallback((): CompletedWorkout | null => {
    const currentData = dataRef.current;
    const w = currentData.activeWorkout;
    if (!w) return null;

    const endTime = Date.now();
    let totalVolume = 0, totalSets = 0, totalReps = 0;

    const loggedExercises: LoggedExercise[] = w.exercises.map((e) => {
      const loggedSets: LoggedSet[] = e.sets.map((s) => {
        const weight = parseFloat(s.weight) || null;
        const reps = parseInt(s.reps) || null;
        if (weight && reps && s.isCompleted) { totalVolume += weight * reps; totalReps += reps; }
        if (s.isCompleted) totalSets++;
        return {
          id: s.id, weight, reps,
          duration: parseFloat(s.duration) || null,
          distance: parseFloat(s.distance) || null,
          isCompleted: s.isCompleted,
        };
      });
      return { id: e.id, exerciseId: e.exerciseId, sets: loggedSets, notes: e.notes };
    });

    const completed: CompletedWorkout = {
      id: w.id, name: w.name, planId: w.planId,
      startTime: w.startTime, endTime,
      duration: Math.round((endTime - w.startTime) / 1000),
      exercises: loggedExercises,
      totalVolume: Math.round(totalVolume), totalSets, totalReps, notes: w.notes,
    };

    const newPRs = { ...currentData.personalRecords };
    w.exercises.forEach((e) => {
      e.sets.forEach((s) => {
        if (!s.isCompleted) return;
        const weight = parseFloat(s.weight);
        const reps = parseInt(s.reps);
        if (!weight || !reps) return;
        const oneRM = calcOneRM(weight, reps);
        const existing = newPRs[e.exerciseId];
        if (!existing || oneRM > existing.estimatedOneRM) {
          newPRs[e.exerciseId] = { exerciseId: e.exerciseId, weight, reps, estimatedOneRM: oneRM, date: endTime, workoutId: w.id };
        }
      });
    });

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newStreak = currentData.streak;
    if (currentData.lastWorkoutDate === yesterday) newStreak = currentData.streak + 1;
    else if (currentData.lastWorkoutDate !== today) newStreak = 1;
    const newLongest = Math.max(currentData.longestStreak, newStreak);

    const updatedPlans = w.planId
      ? currentData.workoutPlans.map((pl) => (pl.id === w.planId ? { ...pl, lastUsed: endTime } : pl))
      : currentData.workoutPlans;

    setData((p) => ({
      ...p,
      workoutHistory: [completed, ...p.workoutHistory],
      personalRecords: newPRs,
      activeWorkout: null,
      streak: newStreak,
      longestStreak: newLongest,
      lastWorkoutDate: today,
      workoutPlans: updatedPlans,
    }));

    return completed;
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setData((p) => ({ ...p, settings: { ...p.settings, ...updates } }));
  }, []);

  const getExerciseById = useCallback(
    (id: string) => allExercises.find((e) => e.id === id),
    [allExercises]
  );

  const getPreviousValues = useCallback(
    (exerciseId: string): { weight: number; reps: number } | null => {
      for (const workout of data.workoutHistory) {
        for (const ex of workout.exercises) {
          if (ex.exerciseId !== exerciseId) continue;
          const done = ex.sets.filter((s) => s.isCompleted && s.weight && s.reps);
          if (done.length > 0) {
            const last = done[done.length - 1];
            return { weight: last.weight!, reps: last.reps! };
          }
        }
      }
      return null;
    },
    [data.workoutHistory]
  );

  const formatWeight = useCallback(
    (kg: number): string => {
      if (data.settings.unit === "imperial") return `${(kg * 2.20462).toFixed(1)} lb`;
      return `${kg} kg`;
    },
    [data.settings.unit]
  );

  const getUnitLabel = useCallback(
    () => (data.settings.unit === "imperial" ? "lb" : "kg"),
    [data.settings.unit]
  );

  const importWorkouts = useCallback((workouts: Omit<CompletedWorkout, "id">[]) => {
    setData((p) => {
      const newWorkouts: CompletedWorkout[] = workouts.map((w) => ({ ...w, id: genId() }));
      const newPRs = { ...p.personalRecords };
      newWorkouts.forEach((w) => {
        w.exercises.forEach((e) => {
          e.sets.forEach((s) => {
            if (!s.isCompleted || !s.weight || !s.reps) return;
            const oneRM = calcOneRM(s.weight, s.reps);
            const existing = newPRs[e.exerciseId];
            if (!existing || oneRM > existing.estimatedOneRM) {
              newPRs[e.exerciseId] = { exerciseId: e.exerciseId, weight: s.weight, reps: s.reps, estimatedOneRM: oneRM, date: w.endTime, workoutId: w.id };
            }
          });
        });
      });
      const combined = [...newWorkouts, ...p.workoutHistory].sort((a, b) => b.startTime - a.startTime);
      return { ...p, workoutHistory: combined, personalRecords: newPRs };
    });
  }, []);

  const value: WorkoutContextType = {
    exercises: allExercises,
    workoutPlans: data.workoutPlans,
    workoutHistory: data.workoutHistory,
    personalRecords: data.personalRecords,
    settings: data.settings,
    activeWorkout: data.activeWorkout,
    streak: data.streak,
    longestStreak: data.longestStreak,
    isLoaded,
    addCustomExercise,
    updateCustomExercise,
    deleteCustomExercise,
    addWorkoutPlan,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    duplicateWorkoutPlan,
    startWorkout,
    cancelWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    addSet,
    removeSet,
    updateSet,
    finishWorkout,
    updateSettings,
    getExerciseById,
    getPreviousValues,
    formatWeight,
    getUnitLabel,
    importWorkouts,
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout(): WorkoutContextType {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkout must be used within WorkoutProvider");
  return ctx;
}

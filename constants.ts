// ============================================================
// FILE: constants.ts — colors, tiers, exercises
// ============================================================

// --- colors.ts ---
const colors = {
  light: {
    text: "#1C1C1E",
    tint: "#FF3B30",
    background: "#F2F2F7",
    foreground: "#1C1C1E",
    card: "#FFFFFF",
    cardForeground: "#1C1C1E",
    primary: "#FF3B30",
    primaryForeground: "#FFFFFF",
    secondary: "#E9E9EB",
    secondaryForeground: "#1C1C1E",
    muted: "#E9E9EB",
    mutedForeground: "#8E8E93",
    accent: "#FF9500",
    accentForeground: "#FFFFFF",
    destructive: "#FF3B30",
    destructiveForeground: "#FFFFFF",
    border: "#C6C6C8",
    input: "#E9E9EB",
    success: "#34C759",
    successForeground: "#FFFFFF",
    warning: "#FF9500",
    warningForeground: "#FFFFFF",
    info: "#007AFF",
  },
  dark: {
    text: "#FFFFFF",
    tint: "#FF453A",
    background: "#000000",
    foreground: "#FFFFFF",
    card: "#1C1C1E",
    cardForeground: "#FFFFFF",
    primary: "#FF453A",
    primaryForeground: "#FFFFFF",
    secondary: "#2C2C2E",
    secondaryForeground: "#FFFFFF",
    muted: "#2C2C2E",
    mutedForeground: "#8E8E93",
    accent: "#FF9F0A",
    accentForeground: "#FFFFFF",
    destructive: "#FF453A",
    destructiveForeground: "#FFFFFF",
    border: "#38383A",
    input: "#2C2C2E",
    success: "#30D158",
    successForeground: "#FFFFFF",
    warning: "#FF9F0A",
    warningForeground: "#FFFFFF",
    info: "#0A84FF",
  },
  radius: 12,
};

export default colors;

// --- tiers.ts ---
export type TierName = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
export type TierLevel = 1 | 2 | 3;

export interface TierInfo {
  tier: TierName;
  level: TierLevel;
  minWorkouts: number;
  maxWorkouts: number | null;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  label: string;
  description: string;
}

export const TIERS: TierInfo[] = [
  {
    tier: "Bronze", level: 1, minWorkouts: 0, maxWorkouts: 10,
    color: "#CD7F32", gradientStart: "#8B5E3C", gradientEnd: "#CD7F32",
    label: "Bronze I", description: "Just getting started",
  },
  {
    tier: "Bronze", level: 2, minWorkouts: 10, maxWorkouts: 25,
    color: "#CD7F32", gradientStart: "#A0652A", gradientEnd: "#E8A56A",
    label: "Bronze II", description: "Building the habit",
  },
  {
    tier: "Bronze", level: 3, minWorkouts: 25, maxWorkouts: 50,
    color: "#CD7F32", gradientStart: "#B87333", gradientEnd: "#F4C896",
    label: "Bronze III", description: "Consistency forming",
  },
  {
    tier: "Silver", level: 1, minWorkouts: 50, maxWorkouts: 75,
    color: "#A8A9AD", gradientStart: "#707070", gradientEnd: "#A8A9AD",
    label: "Silver I", description: "Solid foundation",
  },
  {
    tier: "Silver", level: 2, minWorkouts: 75, maxWorkouts: 100,
    color: "#A8A9AD", gradientStart: "#909090", gradientEnd: "#DCDCDC",
    label: "Silver II", description: "Serious athlete",
  },
  {
    tier: "Silver", level: 3, minWorkouts: 100, maxWorkouts: 150,
    color: "#A8A9AD", gradientStart: "#B0B0B0", gradientEnd: "#F0F0F0",
    label: "Silver III", description: "Dedicated lifter",
  },
  {
    tier: "Gold", level: 1, minWorkouts: 150, maxWorkouts: 200,
    color: "#FFD700", gradientStart: "#B8860B", gradientEnd: "#FFD700",
    label: "Gold I", description: "Elite commitment",
  },
  {
    tier: "Gold", level: 2, minWorkouts: 200, maxWorkouts: 300,
    color: "#FFD700", gradientStart: "#DAA520", gradientEnd: "#FFF176",
    label: "Gold II", description: "Unstoppable",
  },
  {
    tier: "Gold", level: 3, minWorkouts: 300, maxWorkouts: 400,
    color: "#FFD700", gradientStart: "#FFC200", gradientEnd: "#FFF9C4",
    label: "Gold III", description: "Legendary discipline",
  },
  {
    tier: "Platinum", level: 1, minWorkouts: 400, maxWorkouts: 500,
    color: "#9FA8B0", gradientStart: "#6E7F8A", gradientEnd: "#C5CDD4",
    label: "Platinum I", description: "Among the best",
  },
  {
    tier: "Platinum", level: 2, minWorkouts: 500, maxWorkouts: 750,
    color: "#9FA8B0", gradientStart: "#8E9EA8", gradientEnd: "#D8E4EA",
    label: "Platinum II", description: "True champion",
  },
  {
    tier: "Platinum", level: 3, minWorkouts: 750, maxWorkouts: 1000,
    color: "#9FA8B0", gradientStart: "#A8B8C2", gradientEnd: "#EBF4F8",
    label: "Platinum III", description: "World class",
  },
  {
    tier: "Diamond", level: 1, minWorkouts: 1000, maxWorkouts: 1250,
    color: "#67E8F9", gradientStart: "#06B6D4", gradientEnd: "#A5F3FC",
    label: "Diamond I", description: "Beyond elite",
  },
  {
    tier: "Diamond", level: 2, minWorkouts: 1250, maxWorkouts: 1500,
    color: "#67E8F9", gradientStart: "#22D3EE", gradientEnd: "#CFFAFE",
    label: "Diamond II", description: "Living legend",
  },
  {
    tier: "Diamond", level: 3, minWorkouts: 1500, maxWorkouts: null,
    color: "#67E8F9", gradientStart: "#00B4D8", gradientEnd: "#E0F7FA",
    label: "Diamond III", description: "The pinnacle",
  },
];

export function getCurrentTier(workoutCount: number): TierInfo {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (workoutCount >= t.minWorkouts) current = t;
  }
  return current;
}

export function getNextTier(workoutCount: number): TierInfo | null {
  const current = getCurrentTier(workoutCount);
  const idx = TIERS.findIndex(t => t.label === current.label);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export function getTierProgress(workoutCount: number): number {
  const current = getCurrentTier(workoutCount);
  const next = getNextTier(workoutCount);
  if (!next) return 1;
  const range = next.minWorkouts - current.minWorkouts;
  return Math.min((workoutCount - current.minWorkouts) / range, 1);
}

// --- exercises.ts ---
export type TrackingType = "weight_reps" | "bodyweight_reps" | "duration" | "distance_duration";
export type MuscleGroup =
  | "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Forearms"
  | "Quads" | "Hamstrings" | "Glutes" | "Calves" | "Core" | "Full Body" | "Cardio"
  | "Traps" | "Lats" | "Lower Back";

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  trackingType: TrackingType;
  notes?: string;
  isCustom: boolean;
  imageUri?: string;
}

export const BUILT_IN_EXERCISES: Exercise[] = [
  // CHEST
  { id: "ex_bench_press", name: "Barbell Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Shoulders"], equipment: "Barbell", difficulty: "Intermediate", category: "Chest", trackingType: "weight_reps", isCustom: false },
  { id: "ex_incline_bench", name: "Incline Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Shoulders"], equipment: "Barbell", difficulty: "Intermediate", category: "Chest", trackingType: "weight_reps", isCustom: false },
  { id: "ex_decline_bench", name: "Decline Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Barbell", difficulty: "Intermediate", category: "Chest", trackingType: "weight_reps", isCustom: false },
  { id: "ex_db_bench", name: "Dumbbell Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Shoulders"], equipment: "Dumbbell", difficulty: "Beginner", category: "Chest", trackingType: "weight_reps", isCustom: false },
  { id: "ex_db_fly", name: "Dumbbell Fly", primaryMuscle: "Chest", secondaryMuscles: ["Shoulders"], equipment: "Dumbbell", difficulty: "Beginner", category: "Chest", trackingType: "weight_reps", isCustom: false },
  { id: "ex_cable_fly", name: "Cable Fly", primaryMuscle: "Chest", secondaryMuscles: [], equipment: "Cable", difficulty: "Beginner", category: "Chest", trackingType: "weight_reps", isCustom: false },
  { id: "ex_pushup", name: "Push-Up", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Shoulders"], equipment: "Bodyweight", difficulty: "Beginner", category: "Chest", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_chest_dip", name: "Chest Dip", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Bodyweight", difficulty: "Intermediate", category: "Chest", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_cable_crossover", name: "Cable Crossover", primaryMuscle: "Chest", secondaryMuscles: [], equipment: "Cable", difficulty: "Intermediate", category: "Chest", trackingType: "weight_reps", isCustom: false },
  { id: "ex_pec_deck", name: "Pec Deck Fly", primaryMuscle: "Chest", secondaryMuscles: [], equipment: "Machine", difficulty: "Beginner", category: "Chest", trackingType: "weight_reps", isCustom: false },

  // BACK
  { id: "ex_pullup", name: "Pull-Up", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Back"], equipment: "Bodyweight", difficulty: "Intermediate", category: "Back", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_chinup", name: "Chin-Up", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Bodyweight", difficulty: "Intermediate", category: "Back", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_barbell_row", name: "Barbell Row", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Lats"], equipment: "Barbell", difficulty: "Intermediate", category: "Back", trackingType: "weight_reps", isCustom: false },
  { id: "ex_db_row", name: "Dumbbell Row", primaryMuscle: "Back", secondaryMuscles: ["Biceps"], equipment: "Dumbbell", difficulty: "Beginner", category: "Back", trackingType: "weight_reps", isCustom: false },
  { id: "ex_lat_pulldown", name: "Lat Pulldown", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Cable", difficulty: "Beginner", category: "Back", trackingType: "weight_reps", isCustom: false },
  { id: "ex_seated_cable_row", name: "Seated Cable Row", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Lats"], equipment: "Cable", difficulty: "Beginner", category: "Back", trackingType: "weight_reps", isCustom: false },
  { id: "ex_tbar_row", name: "T-Bar Row", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Lats"], equipment: "Barbell", difficulty: "Intermediate", category: "Back", trackingType: "weight_reps", isCustom: false },
  { id: "ex_deadlift", name: "Deadlift", primaryMuscle: "Lower Back", secondaryMuscles: ["Hamstrings", "Glutes", "Traps"], equipment: "Barbell", difficulty: "Advanced", category: "Back", trackingType: "weight_reps", isCustom: false },
  { id: "ex_rdl", name: "Romanian Deadlift", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Lower Back"], equipment: "Barbell", difficulty: "Intermediate", category: "Back", trackingType: "weight_reps", isCustom: false },
  { id: "ex_face_pull", name: "Face Pull", primaryMuscle: "Shoulders", secondaryMuscles: ["Traps", "Back"], equipment: "Cable", difficulty: "Beginner", category: "Back", trackingType: "weight_reps", isCustom: false },
  { id: "ex_hyperextension", name: "Hyperextension", primaryMuscle: "Lower Back", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Machine", difficulty: "Beginner", category: "Back", trackingType: "bodyweight_reps", isCustom: false },

  // SHOULDERS
  { id: "ex_ohp", name: "Overhead Press", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Traps"], equipment: "Barbell", difficulty: "Intermediate", category: "Shoulders", trackingType: "weight_reps", isCustom: false },
  { id: "ex_db_ohp", name: "Dumbbell Shoulder Press", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps"], equipment: "Dumbbell", difficulty: "Beginner", category: "Shoulders", trackingType: "weight_reps", isCustom: false },
  { id: "ex_arnold_press", name: "Arnold Press", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps"], equipment: "Dumbbell", difficulty: "Intermediate", category: "Shoulders", trackingType: "weight_reps", isCustom: false },
  { id: "ex_lateral_raise", name: "Lateral Raise", primaryMuscle: "Shoulders", secondaryMuscles: [], equipment: "Dumbbell", difficulty: "Beginner", category: "Shoulders", trackingType: "weight_reps", isCustom: false },
  { id: "ex_front_raise", name: "Front Raise", primaryMuscle: "Shoulders", secondaryMuscles: [], equipment: "Dumbbell", difficulty: "Beginner", category: "Shoulders", trackingType: "weight_reps", isCustom: false },
  { id: "ex_rear_delt_fly", name: "Rear Delt Fly", primaryMuscle: "Shoulders", secondaryMuscles: ["Back"], equipment: "Dumbbell", difficulty: "Beginner", category: "Shoulders", trackingType: "weight_reps", isCustom: false },
  { id: "ex_shrug", name: "Barbell Shrug", primaryMuscle: "Traps", secondaryMuscles: ["Shoulders"], equipment: "Barbell", difficulty: "Beginner", category: "Shoulders", trackingType: "weight_reps", isCustom: false },
  { id: "ex_upright_row", name: "Upright Row", primaryMuscle: "Shoulders", secondaryMuscles: ["Traps", "Biceps"], equipment: "Barbell", difficulty: "Intermediate", category: "Shoulders", trackingType: "weight_reps", isCustom: false },

  // BICEPS
  { id: "ex_barbell_curl", name: "Barbell Curl", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Barbell", difficulty: "Beginner", category: "Arms", trackingType: "weight_reps", isCustom: false },
  { id: "ex_db_curl", name: "Dumbbell Curl", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell", difficulty: "Beginner", category: "Arms", trackingType: "weight_reps", isCustom: false },
  { id: "ex_hammer_curl", name: "Hammer Curl", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell", difficulty: "Beginner", category: "Arms", trackingType: "weight_reps", isCustom: false },
  { id: "ex_concentration_curl", name: "Concentration Curl", primaryMuscle: "Biceps", secondaryMuscles: [], equipment: "Dumbbell", difficulty: "Beginner", category: "Arms", trackingType: "weight_reps", isCustom: false },
  { id: "ex_preacher_curl", name: "Preacher Curl", primaryMuscle: "Biceps", secondaryMuscles: [], equipment: "Barbell", difficulty: "Beginner", category: "Arms", trackingType: "weight_reps", isCustom: false },
  { id: "ex_cable_curl", name: "Cable Curl", primaryMuscle: "Biceps", secondaryMuscles: [], equipment: "Cable", difficulty: "Beginner", category: "Arms", trackingType: "weight_reps", isCustom: false },

  // TRICEPS
  { id: "ex_skull_crusher", name: "Skull Crusher", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Barbell", difficulty: "Intermediate", category: "Arms", trackingType: "weight_reps", isCustom: false },
  { id: "ex_tricep_dip", name: "Tricep Dip", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Shoulders"], equipment: "Bodyweight", difficulty: "Intermediate", category: "Arms", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_tricep_pushdown", name: "Tricep Pushdown", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable", difficulty: "Beginner", category: "Arms", trackingType: "weight_reps", isCustom: false },
  { id: "ex_overhead_tricep", name: "Overhead Tricep Extension", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Dumbbell", difficulty: "Beginner", category: "Arms", trackingType: "weight_reps", isCustom: false },
  { id: "ex_close_grip_bench", name: "Close-Grip Bench Press", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Shoulders"], equipment: "Barbell", difficulty: "Intermediate", category: "Arms", trackingType: "weight_reps", isCustom: false },
  { id: "ex_diamond_pushup", name: "Diamond Push-Up", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: "Bodyweight", difficulty: "Intermediate", category: "Arms", trackingType: "bodyweight_reps", isCustom: false },

  // LEGS
  { id: "ex_squat", name: "Barbell Squat", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings", "Core"], equipment: "Barbell", difficulty: "Intermediate", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_front_squat", name: "Front Squat", primaryMuscle: "Quads", secondaryMuscles: ["Core", "Glutes"], equipment: "Barbell", difficulty: "Advanced", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_leg_press", name: "Leg Press", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Machine", difficulty: "Beginner", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_leg_extension", name: "Leg Extension", primaryMuscle: "Quads", secondaryMuscles: [], equipment: "Machine", difficulty: "Beginner", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_leg_curl", name: "Leg Curl", primaryMuscle: "Hamstrings", secondaryMuscles: [], equipment: "Machine", difficulty: "Beginner", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_bulgarian_split", name: "Bulgarian Split Squat", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Dumbbell", difficulty: "Intermediate", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_lunges", name: "Lunges", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Dumbbell", difficulty: "Beginner", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_calf_raise", name: "Standing Calf Raise", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine", difficulty: "Beginner", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_hip_thrust", name: "Hip Thrust", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings", "Core"], equipment: "Barbell", difficulty: "Intermediate", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_goblet_squat", name: "Goblet Squat", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Core"], equipment: "Dumbbell", difficulty: "Beginner", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_sumo_squat", name: "Sumo Squat", primaryMuscle: "Glutes", secondaryMuscles: ["Quads", "Hamstrings"], equipment: "Dumbbell", difficulty: "Beginner", category: "Legs", trackingType: "weight_reps", isCustom: false },
  { id: "ex_step_up", name: "Step-Up", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Dumbbell", difficulty: "Beginner", category: "Legs", trackingType: "weight_reps", isCustom: false },

  // CORE
  { id: "ex_plank", name: "Plank", primaryMuscle: "Core", secondaryMuscles: ["Shoulders"], equipment: "Bodyweight", difficulty: "Beginner", category: "Core", trackingType: "duration", isCustom: false },
  { id: "ex_crunch", name: "Crunch", primaryMuscle: "Core", secondaryMuscles: [], equipment: "Bodyweight", difficulty: "Beginner", category: "Core", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_bicycle_crunch", name: "Bicycle Crunch", primaryMuscle: "Core", secondaryMuscles: [], equipment: "Bodyweight", difficulty: "Beginner", category: "Core", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_leg_raise", name: "Leg Raise", primaryMuscle: "Core", secondaryMuscles: [], equipment: "Bodyweight", difficulty: "Beginner", category: "Core", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_russian_twist", name: "Russian Twist", primaryMuscle: "Core", secondaryMuscles: [], equipment: "Bodyweight", difficulty: "Beginner", category: "Core", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_ab_wheel", name: "Ab Wheel Rollout", primaryMuscle: "Core", secondaryMuscles: ["Lats", "Shoulders"], equipment: "Ab Wheel", difficulty: "Intermediate", category: "Core", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_cable_crunch", name: "Cable Crunch", primaryMuscle: "Core", secondaryMuscles: [], equipment: "Cable", difficulty: "Beginner", category: "Core", trackingType: "weight_reps", isCustom: false },
  { id: "ex_hanging_leg_raise", name: "Hanging Leg Raise", primaryMuscle: "Core", secondaryMuscles: ["Hip Flexors" as MuscleGroup], equipment: "Bodyweight", difficulty: "Intermediate", category: "Core", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_side_plank", name: "Side Plank", primaryMuscle: "Core", secondaryMuscles: ["Shoulders"], equipment: "Bodyweight", difficulty: "Beginner", category: "Core", trackingType: "duration", isCustom: false },
  { id: "ex_mountain_climber", name: "Mountain Climber", primaryMuscle: "Core", secondaryMuscles: ["Cardio" as MuscleGroup], equipment: "Bodyweight", difficulty: "Beginner", category: "Core", trackingType: "bodyweight_reps", isCustom: false },

  // CARDIO
  { id: "ex_running", name: "Running", primaryMuscle: "Cardio", secondaryMuscles: ["Quads", "Calves"], equipment: "None", difficulty: "Beginner", category: "Cardio", trackingType: "distance_duration", isCustom: false },
  { id: "ex_cycling", name: "Cycling", primaryMuscle: "Cardio", secondaryMuscles: ["Quads", "Calves"], equipment: "Bike", difficulty: "Beginner", category: "Cardio", trackingType: "distance_duration", isCustom: false },
  { id: "ex_jump_rope", name: "Jump Rope", primaryMuscle: "Cardio", secondaryMuscles: ["Calves", "Shoulders"], equipment: "Jump Rope", difficulty: "Beginner", category: "Cardio", trackingType: "duration", isCustom: false },
  { id: "ex_rowing", name: "Rowing Machine", primaryMuscle: "Cardio", secondaryMuscles: ["Back", "Biceps"], equipment: "Machine", difficulty: "Beginner", category: "Cardio", trackingType: "distance_duration", isCustom: false },
  { id: "ex_burpees", name: "Burpees", primaryMuscle: "Full Body", secondaryMuscles: ["Cardio"], equipment: "Bodyweight", difficulty: "Intermediate", category: "Cardio", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_box_jump", name: "Box Jump", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Calves"], equipment: "Box", difficulty: "Intermediate", category: "Cardio", trackingType: "bodyweight_reps", isCustom: false },
  { id: "ex_elliptical", name: "Elliptical", primaryMuscle: "Cardio", secondaryMuscles: ["Quads", "Calves"], equipment: "Machine", difficulty: "Beginner", category: "Cardio", trackingType: "distance_duration", isCustom: false },
];

export const CATEGORIES = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];

export const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#FF6B6B",
  Back: "#4ECDC4",
  Lats: "#4ECDC4",
  "Lower Back": "#45B7D1",
  Shoulders: "#F7DC6F",
  Biceps: "#82E0AA",
  Triceps: "#F0B27A",
  Forearms: "#D7BDE2",
  Quads: "#AED6F1",
  Hamstrings: "#A9DFBF",
  Glutes: "#F9E79F",
  Calves: "#FDEBD0",
  Core: "#FDCB6E",
  Traps: "#74B9FF",
  "Full Body": "#A29BFE",
  Cardio: "#FF7675",
};

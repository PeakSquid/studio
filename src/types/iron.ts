
export type LiftData = {
  pr: number;
  reps: number;
  history?: { date: string; weight: number }[];
};

export type WorkoutPlan = {
  totalWeeks: number;
  blocks: { name: string; desc: string }[];
  schedule: Record<string, string>;
  workouts: {
    name: string;
    type: string;
    focus: string;
    duration: number;
    xp: number;
    exercises: { name: string; sets: number; reps: string; weight?: number }[];
  }[];
  goals: { lift: string; start: number; target: number }[];
};

export type IronState = {
  lifts: Record<string, LiftData>;
  streak: number;
  lastWorkout: string | null;
  activity: number[]; // 0: none, 1: half, 2: full
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  workoutsCompleted: number;
  plan: WorkoutPlan | null;
  unlockedAchievements: Record<string, string>; // id -> iso date
  settings: {
    unit: 'lb' | 'kg';
    name: string;
    bodyweight: number;
    theme: 'iron' | 'stealth';
  };
  muscleRecovery: Record<string, string>; // muscle -> ISO timestamp of expected full recovery
  totalVolume: number; // total pounds moved in last workout
  volumeHistory: { date: string; volume: number }[];
  onboardingComplete: boolean;
  weekStart: string | null;
};

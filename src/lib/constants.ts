export const THRESHOLDS = {
  'Bench Press':    [{r:'Bronze',min:0},{r:'Silver',min:185},{r:'Gold',min:275},{r:'Elite',min:350}],
  'Squat':          [{r:'Bronze',min:0},{r:'Silver',min:225},{r:'Gold',min:365},{r:'Elite',min:450}],
  'Deadlift':       [{r:'Bronze',min:0},{r:'Silver',min:275},{r:'Gold',min:405},{r:'Elite',min:500}],
  'Overhead Press': [{r:'Bronze',min:0},{r:'Silver',min:115},{r:'Gold',min:175},{r:'Elite',min:225}],
  'Barbell Row':    [{r:'Bronze',min:0},{r:'Silver',min:155},{r:'Gold',min:225},{r:'Elite',min:295}],
  'Pull-Up':        [{r:'Bronze',min:0},{r:'Silver',min:45}, {r:'Gold',min:90}, {r:'Elite',min:135}],
} as const;

export const MUSCLES = {
  Chest:     ['Bench Press'],
  Legs:      ['Squat'],
  Back:      ['Deadlift','Barbell Row'],
  Shoulders: ['Overhead Press'],
  Arms:      ['Pull-Up'],
} as const;

export const MUSCLE_ICONS = {
  Chest: '🛡️',
  Legs: '📈',
  Back: '🪨',
  Shoulders: '⬆️',
  Arms: '⚡'
} as const;

export const ACHIEVEMENTS = [
  {id:'first_workout',title:'First Sweat',desc:'Complete your first workout',icon:'🏋️',cat:'grind'},
  {id:'workouts_10',title:'Dedicated',desc:'Complete 10 workouts',icon:'🔁',cat:'grind'},
  {id:'workouts_25',title:'Iron Regular',desc:'Complete 25 workouts',icon:'⚡',cat:'grind'},
  {id:'workouts_50',title:'Obsessed',desc:'Complete 50 workouts',icon:'🛡️',cat:'grind'},
  {id:'plan_generated',title:'Game Plan',desc:'Generate your first AI training plan',icon:'🤖',cat:'grind'},
  {id:'streak_3',title:'On Fire',desc:'Reach a 3-day workout streak',icon:'🔥',cat:'streak'},
  {id:'streak_7',title:'Week Warrior',desc:'Reach a 7-day workout streak',icon:'⭐',cat:'streak'},
  {id:'streak_14',title:'Fortnight',desc:'Reach a 14-day workout streak',icon:'🏅',cat:'streak'},
  {id:'streak_30',title:'Iron Will',desc:'Reach a 30-day workout streak',icon:'⚓',cat:'streak'},
  {id:'first_pr',title:'First Iron',desc:'Log your first PR',icon:'➕',cat:'pr'},
  {id:'all_lifts',title:'Full Arsenal',desc:'Log a PR on all 6 lifts',icon:'📦',cat:'pr'},
  {id:'bench_225',title:'Two Plates',desc:'Bench press 225 lb',icon:'〰️',cat:'pr'},
  {id:'bench_315',title:'Three Plates',desc:'Bench press 315 lb',icon:'📊',cat:'pr'},
  {id:'squat_315',title:'Quad Destroyer',desc:'Squat 315 lb',icon:'⬇️',cat:'pr'},
  {id:'deadlift_405',title:'Four Wheels',desc:'Deadlift 405 lb',icon:'💪',cat:'pr'},
  {id:'silver_any',title:'Silver Standard',desc:'Reach Silver rank on any lift',icon:'🥈',cat:'rank'},
  {id:'gold_any',title:'Gold Rush',desc:'Reach Gold rank on any lift',icon:'🥇',cat:'rank'},
  {id:'elite_any',title:'Elite Club',desc:'Reach Elite rank on any lift',icon:'⚡',cat:'rank'},
] as const;

export const CAT_LABELS = {
  grind: 'Grind',
  streak: 'Streaks',
  pr: 'Personal Records',
  rank: 'Rank'
} as const;

export const CAT_COLORS = {
  grind: '#E8FF3A',
  streak: '#FF6B35',
  pr: '#4FC3F7',
  rank: '#CE93D8'
} as const;

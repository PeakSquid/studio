import { useState, useEffect } from 'react';
import { IronState } from '@/types/iron';

const STORAGE_KEY = 'ironrank_state_v3';

const DEFAULT_STATE: IronState = {
  lifts: {
    'Bench Press': { pr: 0, reps: 0, history: [] },
    'Squat': { pr: 0, reps: 0, history: [] },
    'Deadlift': { pr: 0, reps: 0, history: [] },
    'Overhead Press': { pr: 0, reps: 0, history: [] },
    'Barbell Row': { pr: 0, reps: 0, history: [] },
    'Pull-Up': { pr: 0, reps: 0, history: [] },
  },
  streak: 0,
  lastWorkout: null,
  activity: Array(21).fill(0),
  chatHistory: [],
  workoutsCompleted: 0,
  plan: null,
  unlockedAchievements: {},
  settings: { unit: 'lb', name: '', bodyweight: 0, theme: 'iron' },
  muscleRecovery: {},
  totalVolume: 0,
  weekStart: null,
};

export function useIronState() {
  const [state, setState] = useState<IronState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({ ...DEFAULT_STATE, ...parsed });
      } catch (e) {
        console.error('Failed to parse state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const updateState = (updater: (prev: IronState) => IronState) => {
    setState(updater);
  };

  return { state, updateState, isLoaded };
}

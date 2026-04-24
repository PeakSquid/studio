import { useState, useEffect } from 'react';
import { IronState } from '@/types/iron';

const STORAGE_KEY = 'ironrank_state_v2';

const DEFAULT_STATE: IronState = {
  lifts: {
    'Bench Press': { pr: 135, reps: 1, history: [] },
    'Squat': { pr: 185, reps: 1, history: [] },
    'Deadlift': { pr: 225, reps: 1, history: [] },
    'Overhead Press': { pr: 85, reps: 1, history: [] },
    'Barbell Row': { pr: 115, reps: 1, history: [] },
    'Pull-Up': { pr: 0, reps: 1, history: [] },
  },
  streak: 3,
  lastWorkout: null,
  activity: [0,0,0,1,2,0,2,2,0,1,2,2,0,0,0,1,2,2,0,2,2], // Mock data for visual appeal
  chatHistory: [],
  workoutsCompleted: 12,
  plan: null,
  unlockedAchievements: { 'first_workout': new Date().toISOString() },
  settings: { unit: 'lb', name: '', bodyweight: 185, theme: 'iron' },
  weeklyMuscles: {},
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

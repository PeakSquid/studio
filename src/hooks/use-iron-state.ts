'use client';

import { useState, useEffect } from 'react';
import { IronState } from '@/types/iron';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const DEFAULT_STATE: IronState = {
  id: '',
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
  workoutLogs: [],
  plan: null,
  unlockedAchievements: {},
  settings: { unit: 'lb', name: '', bodyweight: 0, weightHistory: [], theme: 'iron' },
  muscleRecovery: {},
  totalVolume: 0,
  volumeHistory: [],
  onboardingComplete: false,
  weekStart: null,
  xp: 0,
  level: 1,
};

const STORAGE_KEY = 'ironrank_state_v15';

/**
 * Manages the persistent IronRank athlete state with cloud synchronization.
 * Hardened with resilient merging logic to prevent telemetry corruption.
 */
export function useIronState() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: remoteData, isLoading: isRemoteLoading } = useDoc(userDocRef);
  
  const [state, setState] = useState<IronState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !isRemoteLoading) {
      if (remoteData) {
        setState((prev) => {
          const mergedLifts = { ...prev.lifts };
          if (remoteData.lifts && typeof remoteData.lifts === 'object') {
            Object.entries(remoteData.lifts).forEach(([key, val]) => {
              if (val) mergedLifts[key] = val as any;
            });
          }

          const mergedSettings = { ...prev.settings, ...(remoteData.settings || {}) };
          const mergedActivity = Array.isArray(remoteData.activity) ? [...remoteData.activity] : prev.activity;

          return { 
            ...prev, 
            ...remoteData,
            id: user?.uid || prev.id || '',
            lifts: mergedLifts,
            settings: mergedSettings,
            activity: mergedActivity,
            workoutLogs: Array.isArray(remoteData.workoutLogs) ? remoteData.workoutLogs : prev.workoutLogs,
            chatHistory: Array.isArray(remoteData.chatHistory) ? remoteData.chatHistory : prev.chatHistory,
          };
        });
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setState((prev) => ({ ...prev, ...parsed }));
          } catch (e) {
            console.error('Local state parse failed', e);
          }
        }
      }
      setIsLoaded(true);
    }
  }, [remoteData, isRemoteLoading, isUserLoading, user?.uid]);

  const updateState = (updater: (prev: IronState) => IronState) => {
    setState((prev) => {
      const next = updater(prev);
      if (user && next.id !== user.uid) next.id = user.uid;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (userDocRef) setDocumentNonBlocking(userDocRef, next, { merge: true });
      return next;
    });
  };

  return { 
    state, 
    updateState, 
    isLoaded: isLoaded && !isUserLoading,
    isSyncing: isRemoteLoading
  };
}
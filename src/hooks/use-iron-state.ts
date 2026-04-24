
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
};

// Key versioning ensures a clean reset for the user if necessary
const STORAGE_KEY = 'ironrank_state_v9';

export function useIronState() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  // Stabilize the document reference
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: remoteData, isLoading: isRemoteLoading } = useDoc(userDocRef);
  
  const [state, setState] = useState<IronState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load logic: Prioritize remote data, fallback to local storage
  useEffect(() => {
    if (!isUserLoading && !isRemoteLoading) {
      if (remoteData) {
        setState({ ...DEFAULT_STATE, ...remoteData });
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setState({ ...DEFAULT_STATE, ...JSON.parse(saved) });
          } catch (e) {
            console.error('Local state parse failed', e);
          }
        }
      }
      setIsLoaded(true);
    }
  }, [remoteData, isRemoteLoading, isUserLoading]);

  // Unified sync function
  const updateState = (updater: (prev: IronState) => IronState) => {
    setState((prev) => {
      let next = updater(prev);
      
      // Enforce security rule consistency: Ensure athlete ID is in the document
      if (user && next.id !== user.uid) {
        next = { ...next, id: user.uid };
      }
      
      // Persist locally
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      
      // Cloud synchronization
      if (userDocRef) {
        setDocumentNonBlocking(userDocRef, next, { merge: true });
      }
      
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

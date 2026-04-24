
'use client';

import { useState, useEffect, useMemo } from 'react';
import { IronState } from '@/types/iron';
import { useFirestore, useUser, useDoc } from '@/firebase';
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
  plan: null,
  unlockedAchievements: {},
  settings: { unit: 'lb', name: '', bodyweight: 0, theme: 'iron' },
  muscleRecovery: {},
  totalVolume: 0,
  volumeHistory: [],
  onboardingComplete: false,
  weekStart: null,
};

export function useIronState() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: remoteData, isLoading: isRemoteLoading } = useDoc(userDocRef);
  
  const [state, setState] = useState<IronState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load from remote or local fallback
  useEffect(() => {
    if (!isUserLoading && !isRemoteLoading) {
      if (remoteData) {
        setState({ ...DEFAULT_STATE, ...remoteData });
      } else {
        const saved = localStorage.getItem('ironrank_state_v7');
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

  // Sync updates to remote (non-blocking) and local
  const updateState = (updater: (prev: IronState) => IronState) => {
    setState((prev) => {
      let next = updater(prev);
      
      // Ensure ID is set for Firestore synchronization and rule compliance
      if (user && next.id !== user.uid) {
        next = { ...next, id: user.uid };
      }
      
      // Save local for offline
      localStorage.setItem('ironrank_state_v7', JSON.stringify(next));
      
      // Sync to Firestore if logged in
      if (userDocRef) {
        // Use setDocumentNonBlocking to allow initial creation (method: create) 
        // and ensure fields like 'id' are included in the merge.
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

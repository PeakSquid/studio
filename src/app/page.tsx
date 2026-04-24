
"use client";

import React, { useState, useEffect } from 'react';
import { useIronState } from '@/hooks/use-iron-state';
import HomeTab from '@/components/iron/HomeTab';
import LiftsTab from '@/components/iron/LiftsTab';
import CoachTab from '@/components/iron/CoachTab';
import AchievementsTab from '@/components/iron/AchievementsTab';
import PlanTab from '@/components/iron/PlanTab';
import TabNavigation from '@/components/iron/TabNavigation';
import WorkoutModal from '@/components/iron/WorkoutModal';
import PRLogModal from '@/components/iron/PRLogModal';
import Onboarding from '@/components/iron/Onboarding';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function IronRankApp() {
  const { state, updateState, isLoaded } = useIronState();
  const [activeTab, setActiveTab] = useState('home');
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);
  const [isPRLogOpen, setIsPRLogOpen] = useState(false);

  useEffect(() => {
    if (state.settings.theme === 'stealth') {
      document.body.classList.add('stealth');
    } else {
      document.body.classList.remove('stealth');
    }
  }, [state.settings.theme]);

  if (!isLoaded) return null;

  if (!state.onboardingComplete) {
    return <Onboarding state={state} updateState={updateState} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab state={state} onStartWorkout={() => setIsWorkoutOpen(true)} updateState={updateState} />;
      case 'lifts': return <LiftsTab state={state} updateState={updateState} />;
      case 'coach': return <CoachTab state={state} updateState={updateState} />;
      case 'achievements': return <AchievementsTab state={state} />;
      case 'plan': return <PlanTab state={state} />;
      default: return <HomeTab state={state} onStartWorkout={() => setIsWorkoutOpen(true)} updateState={updateState} />;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full w-full max-w-md mx-auto relative shadow-2xl bg-background overflow-hidden",
      state.settings.theme === 'stealth' && 'stealth'
    )}>
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {renderTab()}
      </main>

      {/* Floating Action Button (Only on Home and Lifts) */}
      {(activeTab === 'home' || activeTab === 'lifts') && (
        <button 
          onClick={() => setIsPRLogOpen(true)}
          className="fixed left-1/2 -translate-x-1/2 bottom-24 w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.4)] z-50 transition-all active:scale-90 hover:scale-105 border-4 border-background"
        >
          <Plus className="w-8 h-8 stroke-[3]" />
        </button>
      )}

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {state.plan && isWorkoutOpen && (
        <WorkoutModal 
          isOpen={isWorkoutOpen} 
          onClose={() => setIsWorkoutOpen(false)} 
          state={state}
          updateState={updateState}
        />
      )}

      <PRLogModal 
        isOpen={isPRLogOpen}
        onClose={() => setIsPRLogOpen(false)}
        state={state}
        updateState={updateState}
      />
    </div>
  );
}

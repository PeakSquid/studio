"use client";

import React, { useState } from 'react';
import { useIronState } from '@/hooks/use-iron-state';
import HomeTab from '@/components/iron/HomeTab';
import LiftsTab from '@/components/iron/LiftsTab';
import CoachTab from '@/components/iron/CoachTab';
import AchievementsTab from '@/components/iron/AchievementsTab';
import PlanTab from '@/components/iron/PlanTab';
import TabNavigation from '@/components/iron/TabNavigation';
import WorkoutModal from '@/components/iron/WorkoutModal';
import { Plus } from 'lucide-react';

export default function IronRankApp() {
  const { state, updateState, isLoaded } = useIronState();
  const [activeTab, setActiveTab] = useState('home');
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);

  if (!isLoaded) return null;

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab state={state} onStartWorkout={() => setIsWorkoutOpen(true)} />;
      case 'lifts': return <LiftsTab state={state} updateState={updateState} />;
      case 'coach': return <CoachTab state={state} updateState={updateState} />;
      case 'achievements': return <AchievementsTab state={state} />;
      case 'plan': return <PlanTab state={state} />;
      default: return <HomeTab state={state} onStartWorkout={() => setIsWorkoutOpen(true)} />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto relative shadow-2xl bg-background">
      {/* Toast would go here if needed as global fixed element */}
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-24">
        {renderTab()}
      </main>

      {/* Floating Action Button (Only on Home and Lifts) */}
      {(activeTab === 'home' || activeTab === 'lifts') && (
        <button 
          onClick={() => {/* Open PR Log Modal */}}
          className="fixed right-6 bottom-28 w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-[0_0_20px_rgba(232,255,58,0.4)] z-50 transition-transform active:scale-95"
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
    </div>
  );
}

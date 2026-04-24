
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useIronState } from '@/hooks/use-iron-state';
import TabNavigation from '@/components/iron/TabNavigation';
import AuthWrapper from '@/components/iron/AuthWrapper';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic imports with ssr: false to slash TBT by reducing hydration workload
const HomeTab = dynamic(() => import('@/components/iron/HomeTab'), { 
  loading: () => <TabLoading />,
  ssr: false 
});
const LiftsTab = dynamic(() => import('@/components/iron/LiftsTab'), { 
  loading: () => <TabLoading />,
  ssr: false 
});
const CoachTab = dynamic(() => import('@/components/iron/CoachTab'), { 
  loading: () => <TabLoading />,
  ssr: false 
});
const AchievementsTab = dynamic(() => import('@/components/iron/AchievementsTab'), { 
  loading: () => <TabLoading />,
  ssr: false 
});
const PlanTab = dynamic(() => import('@/components/iron/PlanTab'), { 
  loading: () => <TabLoading />,
  ssr: false 
});

const WorkoutModal = dynamic(() => import('@/components/iron/WorkoutModal'), { ssr: false });
const PRLogModal = dynamic(() => import('@/components/iron/PRLogModal'), { ssr: false });
const Onboarding = dynamic(() => import('@/components/iron/Onboarding'), { ssr: false });

function TabLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-12 space-y-4">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Calibrating HUD...</p>
    </div>
  );
}

function IronRankApp() {
  const { state, updateState, isLoaded, isSyncing } = useIronState();
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

  if (!isLoaded) return (
    <div className="flex flex-col h-screen w-full bg-background items-center justify-center p-8">
      <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
      <p className="eyebrow">Loading Athlete Data...</p>
    </div>
  );

  if (!state.onboardingComplete) {
    return <Onboarding state={state} updateState={updateState} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab state={state} onStartWorkout={() => setIsWorkoutOpen(true)} updateState={updateState} isSyncing={isSyncing} />;
      case 'lifts': return <LiftsTab state={state} updateState={updateState} />;
      case 'coach': return <CoachTab state={state} updateState={updateState} />;
      case 'achievements': return <AchievementsTab state={state} />;
      case 'plan': return <PlanTab state={state} />;
      default: return <HomeTab state={state} onStartWorkout={() => setIsWorkoutOpen(true)} updateState={updateState} isSyncing={isSyncing} />;
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

      {isPRLogOpen && (
        <PRLogModal 
          isOpen={isPRLogOpen}
          onClose={() => setIsPRLogOpen(false)}
          state={state}
          updateState={updateState}
        />
      )}
    </div>
  );
}

export default function RootPage() {
  return (
    <FirebaseClientProvider>
      <AuthWrapper>
        <IronRankApp />
      </AuthWrapper>
    </FirebaseClientProvider>
  );
}

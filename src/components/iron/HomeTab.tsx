
"use client";

import React, { useState, useMemo } from 'react';
import { IronState } from '@/types/iron';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Settings, Zap, Activity, TrendingUp } from 'lucide-react';
import { MUSCLES } from '@/lib/constants';
import { getOverallRank, getMuscleRank, getOverallRankProgress } from '@/lib/iron-utils';
import SettingsModal from './SettingsModal';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

type HomeTabProps = {
  state: IronState;
  onStartWorkout: () => void;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function HomeTab({ state, onStartWorkout, updateState }: HomeTabProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const rank = getOverallRank(state.lifts);
  const { nextRank, progress, remaining } = getOverallRankProgress(state.lifts);
  const name = state.settings.name || 'Athlete';
  
  const todaysWorkout = getTodaysWorkout(state);

  const getRecoveryStatus = (muscle: string) => {
    const recoveryTime = state.muscleRecovery[muscle];
    if (!recoveryTime) return 'Optimal';
    const now = new Date();
    const target = new Date(recoveryTime);
    if (now >= target) return 'Optimal';
    return 'Fatigued';
  };

  const volumeData = state.volumeHistory.slice(-7).map((v, i) => ({ val: v.volume }));

  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-40">
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow">{name} · {rank} Class</p>
          <h1 className="hero-title">Iron<span className="text-accent">Rank</span></h1>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground transition-all active:scale-95 hover:border-accent/50"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Rank Progress */}
      <Card className="p-5 mb-6 bg-secondary border-border overflow-hidden relative group">
        <div className="flex justify-between items-end mb-3">
          <div>
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Rank Progression</div>
            <div className="font-headline text-3xl leading-none">Chasing <span className="text-accent">{nextRank}</span></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Status</div>
            <div className="text-xs font-bold">{remaining} Lifts to Tier Up</div>
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-background mb-2" />
        <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
          <span>{rank}</span>
          <span>{nextRank}</span>
        </div>
      </Card>

      {/* Performance Briefing */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-secondary/30 border-border">
          <p className="eyebrow">Streak</p>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent fill-current" />
            <span className="font-headline text-3xl">{state.streak}</span>
          </div>
        </Card>
        <Card className="p-4 bg-secondary/30 border-border overflow-hidden">
          <p className="eyebrow">Trend</p>
          <div className="h-8 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData.length > 0 ? volumeData : [{val:0},{val:5},{val:3},{val:8}]}>
                <Line type="monotone" dataKey="val" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Today's Workout */}
      <section className="mb-10">
        <h3 className="section-header">Tactical Objective</h3>
        {todaysWorkout ? (
          <Card className="p-6 bg-secondary border-border relative overflow-hidden group transition-all hover:border-accent/40">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
            <h2 className="font-headline text-4xl leading-none mb-1 group-hover:text-accent transition-colors">{todaysWorkout.name}</h2>
            <p className="text-sm text-muted-foreground mb-6 font-bold uppercase tracking-tighter">{todaysWorkout.focus}</p>
            <button 
              onClick={onStartWorkout}
              className="w-full bg-accent text-accent-foreground font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-all active:scale-[0.98] shadow-[0_0_25px_rgba(var(--accent),0.2)]"
            >
              Initialize Session
            </button>
          </Card>
        ) : (
          <Card className="p-8 bg-secondary/20 border-dashed border-2 border-border flex flex-col items-center text-center">
            <h2 className="font-headline text-3xl leading-none mb-2">Passive Phase</h2>
            <p className="text-xs text-muted-foreground uppercase font-black">Rest Recommended</p>
          </Card>
        )}
      </section>

      {/* Visual Muscle Map */}
      <section>
        <h3 className="section-header">Biological Status</h3>
        <Card className="p-8 bg-secondary/30 border-border flex flex-col items-center">
          <div className="relative w-full max-w-[200px] mb-8">
            <svg viewBox="0 0 100 150" className="w-full h-auto">
              {/* Chest */}
              <path d="M30 40 Q50 35 70 40 L65 55 Q50 60 35 55 Z" className={`muscle-map-path ${getRecoveryStatus('Chest') === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              {/* Abs */}
              <path d="M40 60 L60 60 L58 90 L42 90 Z" className="muscle-map-path" />
              {/* Shoulders */}
              <circle cx="25" cy="45" r="8" className={`muscle-map-path ${getRecoveryStatus('Shoulders') === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <circle cx="75" cy="45" r="8" className={`muscle-map-path ${getRecoveryStatus('Shoulders') === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              {/* Arms */}
              <path d="M20 55 L15 90 L25 90 L28 55 Z" className={`muscle-map-path ${getRecoveryStatus('Arms') === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M80 55 L85 90 L75 90 L72 55 Z" className={`muscle-map-path ${getRecoveryStatus('Arms') === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              {/* Legs */}
              <path d="M35 95 L30 140 L45 140 L48 95 Z" className={`muscle-map-path ${getRecoveryStatus('Legs') === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M65 95 L70 140 L55 140 L52 95 Z" className={`muscle-map-path ${getRecoveryStatus('Legs') === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full text-[10px] font-black uppercase tracking-widest">
            {Object.keys(MUSCLES).map(m => (
              <div key={m} className="flex items-center justify-between border-b border-border/40 pb-1">
                <span className="text-muted-foreground">{m}</span>
                <span className={getRecoveryStatus(m) === 'Optimal' ? 'text-accent' : 'text-orange-500'}>
                  {getRecoveryStatus(m)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        state={state}
        updateState={updateState}
      />
    </div>
  );
}

function getTodaysWorkout(state: IronState) {
  if (!state.plan) return null;
  const dow = new Date().getDay().toString();
  const type = state.plan.schedule[dow];
  if (!type || type === 'rest') return null;
  return state.plan.workouts.find(w => w.type === type) || null;
}

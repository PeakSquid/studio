"use client";

import React, { useState } from 'react';
import { IronState } from '@/types/iron';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Settings, Zap, Target, TrendingUp, ChevronRight } from 'lucide-react';
import { MUSCLES, MUSCLE_ICONS } from '@/lib/constants';
import { getOverallRank, getMuscleRank, getOverallRankProgress } from '@/lib/iron-utils';
import SettingsModal from './SettingsModal';

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

  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
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

      {/* Streak & Activity */}
      <Card className="p-5 mb-6 bg-secondary/30 border-border overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Current Streak</div>
              <div className="font-headline text-3xl leading-none">{state.streak} Days</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Workouts</div>
            <div className="font-headline text-3xl leading-none">{state.workoutsCompleted}</div>
          </div>
        </div>
        <div className="dot-grid">
          {state.activity.map((v, i) => (
            <div key={i} className={`dot ${v === 2 ? 'dot-active' : v === 1 ? 'dot-half' : ''}`} />
          ))}
        </div>
      </Card>

      {/* Today's Workout */}
      <section className="mb-10">
        <h3 className="section-header">Next Training Session</h3>
        {todaysWorkout ? (
          <Card className="p-6 bg-secondary border-border relative overflow-hidden group transition-all hover:border-accent/40">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
            
            <div className="inline-block bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-[2px] px-2 py-1 rounded-sm mb-4">
              Tactical Program
            </div>
            
            <h2 className="font-headline text-4xl leading-none mb-1 group-hover:text-accent transition-colors">{todaysWorkout.name}</h2>
            <p className="text-sm text-muted-foreground mb-6">{todaysWorkout.focus}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-background/50 rounded-xl border border-border/50">
                <div className="font-headline text-2xl leading-none">{todaysWorkout.exercises.length}</div>
                <div className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Moves</div>
              </div>
              <div className="p-3 bg-background/50 rounded-xl border border-border/50">
                <div className="font-headline text-2xl leading-none">{todaysWorkout.duration}m</div>
                <div className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Time</div>
              </div>
              <div className="p-3 bg-background/50 rounded-xl border border-border/50">
                <div className="font-headline text-2xl leading-none text-accent">+{todaysWorkout.xp}</div>
                <div className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">XP</div>
              </div>
            </div>

            <button 
              onClick={onStartWorkout}
              className="w-full bg-accent text-accent-foreground font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-all active:scale-[0.98] shadow-[0_0_25px_rgba(232,255,58,0.2)] flex items-center justify-center gap-3"
            >
              Enter the Cage <Zap className="w-4 h-4 fill-current" />
            </button>
          </Card>
        ) : (
          <Card className="p-12 bg-secondary/50 border-dashed border-2 border-border flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl mb-4 animate-float">🧘</div>
            <h2 className="font-headline text-3xl leading-none mb-2">Rest Phase</h2>
            <p className="text-sm text-muted-foreground max-w-[200px]">Recovery is where tissue repairs. Check your Plan for tomorrow.</p>
          </Card>
        )}
      </section>

      {/* Muscles Section */}
      <section>
        <h3 className="section-header">Targeted Groups</h3>
        <div className="grid grid-cols-1 gap-3">
          {Object.keys(MUSCLES).map((muscle) => {
            const mRank = getMuscleRank(muscle, state.lifts);
            const liftNames = MUSCLES[muscle as keyof typeof MUSCLES];
            const liftStr = liftNames.map(l => `${state.lifts[l]?.pr || 0}lb ${l.split(' ')[0]}`).join(', ');
            
            return (
              <div key={muscle} className="p-4 bg-secondary/40 border border-border rounded-2xl flex items-center gap-4 group hover:bg-secondary/60 transition-all">
                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {MUSCLE_ICONS[muscle as keyof typeof MUSCLE_ICONS]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm tracking-tight">{muscle}</div>
                  <div className="text-[11px] text-muted-foreground font-medium">{liftStr}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider rank-${mRank.toLowerCase()}`}>
                  {mRank}
                </span>
              </div>
            );
          })}
        </div>
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

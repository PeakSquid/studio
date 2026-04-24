"use client";

import React from 'react';
import { IronState } from '@/types/iron';
import { Card } from '@/components/ui/card';
import { Settings, Zap } from 'lucide-react';
import { MUSCLES, MUSCLE_ICONS, THRESHOLDS } from '@/lib/constants';

type HomeTabProps = {
  state: IronState;
  onStartWorkout: () => void;
};

export default function HomeTab({ state, onStartWorkout }: HomeTabProps) {
  const rank = getOverallRank(state.lifts);
  const name = state.settings.name || 'Athlete';
  
  const todaysWorkout = getTodaysWorkout(state);

  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow">{name} · {rank} Lifter</p>
          <h1 className="hero-title">Iron<span className="text-accent">Rank</span></h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground transition-transform active:scale-95">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Streak Card */}
      <Card className="p-4 mb-4 bg-secondary/50 border-border">
        <div className="flex items-center gap-4">
          <div>
            <div className="font-headline text-5xl text-accent leading-none">{state.streak}</div>
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Day Streak</div>
          </div>
          <div className="flex-1 dot-grid">
            {state.activity.map((v, i) => (
              <div key={i} className={`dot ${v === 2 ? 'dot-active' : v === 1 ? 'dot-half' : ''}`} />
            ))}
          </div>
        </div>
      </Card>

      {/* Today's Workout */}
      <section className="mb-8">
        {todaysWorkout ? (
          <Card className="p-5 bg-secondary border-border relative overflow-hidden">
            <div className="inline-block bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-[1.5px] px-2 py-0.5 rounded-[4px] mb-3">
              Today · AI Generated
            </div>
            <h2 className="font-headline text-3xl leading-none mb-1">{todaysWorkout.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{todaysWorkout.focus}</p>
            
            <div className="flex gap-6 mb-5">
              <div>
                <div className="font-bold text-lg">{todaysWorkout.exercises.length}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Exercises</div>
              </div>
              <div>
                <div className="font-bold text-lg">{todaysWorkout.duration}m</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Est. Time</div>
              </div>
              <div>
                <div className="font-bold text-lg text-accent">+{todaysWorkout.xp} XP</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Rank Pts</div>
              </div>
            </div>

            <button 
              onClick={onStartWorkout}
              className="w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] active:opacity-90 flex items-center justify-center gap-2"
            >
              Start Workout <Zap className="w-4 h-4 fill-current" />
            </button>
          </Card>
        ) : (
          <Card className="p-10 bg-secondary border-border flex flex-col items-center text-center">
            <div className="text-4xl mb-4">🌙</div>
            <h2 className="font-headline text-2xl leading-none mb-1">Rest Day</h2>
            <p className="text-sm text-muted-foreground">Recovery is where the gains happen. Stay active with light movement.</p>
          </Card>
        )}
      </section>

      {/* Muscles Section */}
      <section>
        <h3 className="section-header">This Week&apos;s Muscles</h3>
        <Card className="divide-y divide-border border-border">
          {Object.keys(MUSCLES).map((muscle) => {
            const mRank = getMuscleRank(muscle, state.lifts);
            const liftNames = MUSCLES[muscle as keyof typeof MUSCLES];
            const liftStr = liftNames.map(l => `${state.lifts[l]?.pr || 0}lb ${l}`).join(', ');
            
            return (
              <div key={muscle} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">
                  {MUSCLE_ICONS[muscle as keyof typeof MUSCLE_ICONS]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{muscle}</div>
                  <div className="text-[11px] text-muted-foreground">{liftStr}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider rank-${mRank.toLowerCase()}`}>
                  {mRank}
                </span>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}

function getOverallRank(lifts: Record<string, { pr: number }>) {
  const getRank = (lift: string, pr: number) => {
    const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
    let rank = 'Bronze';
    for (const t of tiers) { if (pr >= t.min) rank = t.r; }
    return rank;
  };

  const all = Object.entries(lifts).map(([l, d]) => getRank(l, d.pr));
  const c: Record<string, number> = { Bronze: 0, Silver: 0, Gold: 0, Elite: 0 };
  all.forEach(r => c[r]++);
  if (c.Elite >= 4) return 'Elite';
  if (c.Gold >= 4) return 'Gold';
  if (c.Silver >= 3) return 'Silver';
  return 'Bronze';
}

function getMuscleRank(muscle: string, lifts: Record<string, { pr: number }>) {
  const liftNames = MUSCLES[muscle as keyof typeof MUSCLES] || [];
  const ranks = ['Bronze', 'Silver', 'Gold', 'Elite'];
  
  const getRank = (lift: string, pr: number) => {
    const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
    let rank = 'Bronze';
    for (const t of tiers) { if (pr >= t.min) rank = t.r; }
    return rank;
  };

  let minIdx = 3;
  for (const l of liftNames) {
    const r = getRank(l, lifts[l]?.pr || 0);
    const idx = ranks.indexOf(r);
    if (idx < minIdx) minIdx = idx;
  }
  return ranks[minIdx];
}

function getTodaysWorkout(state: IronState) {
  if (!state.plan) return null;
  const dow = new Date().getDay().toString();
  const type = state.plan.schedule[dow];
  if (!type || type === 'rest') return null;
  return state.plan.workouts.find(w => w.type === type) || null;
}

"use client";

import React from 'react';
import { IronState } from '@/types/iron';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

type PlanTabProps = {
  state: IronState;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PlanTab({ state }: PlanTabProps) {
  if (!state.plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-6xl">📅</div>
        <div>
          <h2 className="font-headline text-3xl mb-2">No active plan</h2>
          <p className="text-sm text-muted-foreground">Chat with your AI Coach to generate a customized 12-week program based on your current PRs.</p>
        </div>
        <button className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-2xl">
          Talk to AI Coach
        </button>
      </div>
    );
  }

  const p = state.plan;
  const weekNum = Math.min(Math.floor(state.workoutsCompleted / 3) + 1, p.totalWeeks);
  const blockIdx = Math.floor(((weekNum - 1) / p.totalWeeks) * p.blocks.length);
  const pct = Math.round((weekNum / p.totalWeeks) * 100);

  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6">
        <p className="eyebrow">AI Generated</p>
        <h1 className="hero-title">Your <span className="text-accent">Plan</span></h1>
      </header>

      <Card className="p-5 mb-8 bg-secondary border-border">
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <div className="font-headline text-5xl text-accent leading-none">{pct}%</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">complete</div>
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg mb-0.5">Week {weekNum} of {p.totalWeeks}</div>
            <div className="text-xs text-muted-foreground mb-2">{p.blocks[blockIdx]?.name}</div>
            <div className="flex items-center gap-1.5 text-accent font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> On Track
            </div>
          </div>
        </div>
        <Progress value={pct} className="h-2 bg-background" />
      </Card>

      <section className="mb-8">
        <h3 className="section-header">Program Blocks</h3>
        <div className="space-y-3">
          {p.blocks.map((block, i) => (
            <Card key={i} className={`p-4 bg-secondary border-border border-l-4 transition-all ${i === blockIdx ? 'border-l-accent' : 'border-l-transparent'}`}>
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm">{block.name}</h4>
                {i === blockIdx && (
                  <span className="bg-accent/10 text-accent text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest">CURRENT</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{block.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="section-header">Weekly Schedule</h3>
        <Card className="divide-y divide-border border-border">
          {DAYS.map((day, i) => {
            const type = p.schedule[i.toString()] || 'rest';
            const isRest = type === 'rest';
            return (
              <div key={day} className="flex items-center justify-between p-4">
                <div className="text-sm font-bold text-muted-foreground w-12">{day}</div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isRest ? 'bg-secondary text-muted-foreground' : 'bg-accent/10 text-accent'}`}>
                  {type}
                </span>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}

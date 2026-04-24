"use client";

import React from 'react';
import { IronState } from '@/types/iron';
import { THRESHOLDS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type LiftsTabProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function LiftsTab({ state }: LiftsTabProps) {
  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6">
        <p className="eyebrow">Personal Records</p>
        <h1 className="hero-title">Your <span className="text-accent">Lifts</span></h1>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {Object.entries(state.lifts).map(([name, data]) => {
          const thresholds = THRESHOLDS[name as keyof typeof THRESHOLDS];
          const rank = getRank(name, data.pr);
          const { pct, nextLabel, toNext } = getProgress(name, data.pr);
          
          return (
            <Card key={name} className="p-4 bg-secondary border-border flex flex-col relative transition-transform active:scale-[0.97]">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{name}</div>
              <div className="font-headline text-3xl leading-none mb-2">
                {data.pr || '—'} <span className="text-sm font-sans text-muted-foreground font-normal">{data.pr > 0 ? 'lb' : ''}</span>
              </div>
              
              <div className="mt-auto">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider rank-${rank.toLowerCase()} mb-2`}>
                  {rank}
                </span>
                
                {thresholds && (
                  <>
                    <Progress value={pct} className="h-1 bg-background" />
                    <div className="text-[10px] text-muted-foreground mt-2 font-medium">
                      {toNext > 0 ? `${toNext}lb to ${nextLabel}` : 'MAX RANK'}
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <section className="mb-8">
        <h3 className="section-header">Rank Tiers</h3>
        <Card className="p-4 bg-secondary border-border space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl">🥉</div>
            <div>
              <div className="font-bold text-sm text-[#CD7F32]">Bronze</div>
              <div className="text-xs text-muted-foreground">Starting level — building the foundation</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl">🥈</div>
            <div>
              <div className="font-bold text-sm text-[#A8A9AD]">Silver</div>
              <div className="text-xs text-muted-foreground">Intermediate — consistent progress</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl">🥇</div>
            <div>
              <div className="font-bold text-sm text-[#FFD700]">Gold</div>
              <div className="text-xs text-muted-foreground">Advanced — elite strength levels</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl">⚡</div>
            <div>
              <div className="font-bold text-sm text-[#C084FC]">Elite</div>
              <div className="text-xs text-muted-foreground">Top 1% — near competitive level</div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function getRank(lift: string, pr: number) {
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  let rank = 'Bronze';
  for (const t of tiers) { if (pr >= t.min) rank = t.r; }
  return rank;
}

function getProgress(lift: string, pr: number) {
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  if (tiers.length === 0) return { pct: 0, nextLabel: '', toNext: 0 };

  for (let i = tiers.length - 1; i >= 0; i--) {
    if (pr >= tiers[i].min) {
      const next = tiers[i + 1];
      if (!next) return { pct: 100, nextLabel: '', toNext: 0 };
      const pct = Math.round(((pr - tiers[i].min) / (next.min - tiers[i].min)) * 100);
      return { pct: Math.min(pct, 100), nextLabel: next.r, toNext: next.min - pr };
    }
  }
  return { pct: 0, nextLabel: tiers[0].r, toNext: tiers[0].min - pr };
}

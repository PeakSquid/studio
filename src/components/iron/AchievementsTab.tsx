"use client";

import React, { useState } from 'react';
import { IronState } from '@/types/iron';
import { ACHIEVEMENTS, CAT_COLORS, CAT_LABELS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AchievementsTabProps = {
  state: IronState;
};

export default function AchievementsTab({ state }: AchievementsTabProps) {
  const [activeCat, setActiveCat] = useState('grind');
  const unlocked = state.unlockedAchievements;
  const total = ACHIEVEMENTS.length;
  const totalUnlocked = Object.keys(unlocked).length;
  const pct = Math.round((totalUnlocked / total) * 100);

  const filtered = ACHIEVEMENTS.filter(a => a.cat === activeCat);

  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6">
        <p className="eyebrow">{totalUnlocked} of {total} Unlocked</p>
        <h1 className="hero-title">Achieve<span className="text-accent">ments</span></h1>
      </header>

      <Card className="p-4 mb-6 bg-secondary border-border">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ACHIEVEMENTS.map((a, i) => (
            <div 
              key={i} 
              className="w-2.5 h-2.5 rounded-[2px]" 
              style={{ background: unlocked[a.id] ? CAT_COLORS[a.cat as keyof typeof CAT_COLORS] : 'var(--border)' }}
            />
          ))}
        </div>
        <div className="h-2 w-full bg-background rounded-full overflow-hidden mb-2">
          <div className="h-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {pct}% complete · {totalUnlocked} unlocked
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
        {Object.keys(CAT_LABELS).map(cat => {
          const isActive = activeCat === cat;
          const color = CAT_COLORS[cat as keyof typeof CAT_COLORS];
          const count = ACHIEVEMENTS.filter(a => a.cat === cat).length;
          const userCount = ACHIEVEMENTS.filter(a => a.cat === cat && unlocked[a.id]).length;

          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap",
                isActive 
                  ? "bg-foreground text-background border-transparent" 
                  : "bg-secondary border-border text-muted-foreground"
              )}
              style={isActive ? { background: color, color: '#000' } : {}}
            >
              {CAT_LABELS[cat as keyof typeof CAT_LABELS]}
              <span className="bg-background/20 px-1.5 py-0.5 rounded-md text-[9px]">{userCount}/{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map(a => {
          const isUnlocked = !!unlocked[a.id];
          const color = CAT_COLORS[a.cat as keyof typeof CAT_COLORS];
          
          return (
            <Card 
              key={a.id} 
              className={cn(
                "p-4 bg-secondary border-border flex items-center gap-4 transition-opacity",
                !isUnlocked && "opacity-60 grayscale-[0.8]"
              )}
              style={isUnlocked ? { borderColor: `${color}33`, background: `linear-gradient(135deg, hsl(var(--secondary)) 80%, ${color}08)` } : {}}
            >
              <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center text-3xl relative">
                {a.icon}
                {isUnlocked && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent border-2 border-background flex items-center justify-center text-[10px] font-black text-accent-foreground">
                    ✓
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">{a.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">{a.desc}</p>
                {isUnlocked ? (
                  <div className="text-[9px] font-black uppercase tracking-wider mt-1.5" style={{ color }}>
                    Unlocked {new Date(unlocked[a.id]).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="text-[9px] font-black uppercase tracking-wider mt-1.5 text-muted-foreground">
                    Locked Milestone
                  </div>
                )}
              </div>
              <div className="bg-background/40 px-3 py-1.5 rounded-xl border border-border text-[11px] font-bold text-muted-foreground">
                {isUnlocked ? '✓' : '+'}150
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

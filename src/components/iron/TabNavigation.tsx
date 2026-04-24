"use client";

import React from 'react';
import { Home, Trophy, MessageSquare, Award, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabNavProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'lifts', icon: Trophy, label: 'HUD' },
  { id: 'coach', icon: MessageSquare, label: 'Coach' },
  { id: 'achievements', icon: Award, label: 'Awards' },
  { id: 'plan', icon: Calendar, label: 'Plan' },
];

const TabNavigation = React.memo(({ activeTab, setActiveTab }: TabNavProps) => {
  return (
    <nav className="fixed bottom-4 left-4 right-4 h-[72px] bg-secondary/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center px-2 z-[100] max-w-md mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-all outline-none group",
            activeTab === tab.id ? "text-accent scale-110" : "text-muted-foreground/60 hover:text-muted-foreground"
          )}
        >
          <div className={cn(
            "p-2 rounded-2xl transition-all",
            activeTab === tab.id ? "bg-accent/10 shadow-[0_0_20px_rgba(var(--accent),0.1)]" : "bg-transparent"
          )}>
            <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "stroke-[2.5]" : "stroke-[2]")} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[2px]">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
});

TabNavigation.displayName = 'TabNavigation';

export default TabNavigation;
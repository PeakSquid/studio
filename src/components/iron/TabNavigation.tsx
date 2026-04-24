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
  { id: 'lifts', icon: Trophy, label: 'Lifts' },
  { id: 'coach', icon: MessageSquare, label: 'Coach' },
  { id: 'achievements', icon: Award, label: 'Awards' },
  { id: 'plan', icon: Calendar, label: 'Plan' },
];

export default function TabNavigation({ activeTab, setActiveTab }: TabNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[80px] bg-secondary/80 backdrop-blur-md border-t border-border flex items-start px-2 pb-[env(safe-area-inset-bottom,0px)] z-[100] max-w-md mx-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center pt-3 gap-1 transition-colors",
            activeTab === tab.id ? "text-accent" : "text-muted-foreground"
          )}
        >
          <tab.icon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

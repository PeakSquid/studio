"use client";

import React, { useState, useRef, useEffect } from 'react';
import { IronState } from '@/types/iron';
import { aiCoachChat } from '@/ai/flows/ai-coach-chat';
import { Send, RefreshCcw, Loader2, Bot, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type CoachTabProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

const QUICK_PROMPTS = [
  'Generate my 12-week plan',
  'How do I reach Gold rank?',
  'Analyze my current PRs',
  'Give me a tip for deadlifts',
];

export default function CoachTab({ state, updateState }: CoachTabProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.chatHistory, isLoading]);

  const handleSend = async (msg?: string) => {
    const text = msg || input;
    if (!text.trim() || isLoading) return;

    const newUserMsg = { role: 'user' as const, content: text };
    
    updateState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, newUserMsg]
    }));
    
    setInput('');
    setIsLoading(true);

    try {
      const result = await aiCoachChat({
        query: text,
        lifts: state.lifts,
        overallRank: getOverallRank(state.lifts),
        streak: state.streak,
        workoutsCompleted: state.workoutsCompleted,
        bodyweight: state.settings.bodyweight,
        userName: state.settings.name,
        chatHistory: state.chatHistory.slice(-5), // Only send recent history for tokens
      });

      if (result.plan) {
        updateState(prev => ({
          ...prev,
          plan: result.plan!,
          chatHistory: [...prev.chatHistory, { role: 'assistant', content: result.reply || 'Affirmative. Your training plan has been tacticaly generated. View it in the Plan tab.' }]
        }));
      } else {
        updateState(prev => ({
          ...prev,
          chatHistory: [...prev.chatHistory, { role: 'assistant', content: result.reply || 'I am processing your data. Repeat your query.' }]
        }));
      }
    } catch (e) {
      console.error(e);
      updateState(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, { role: 'assistant', content: 'Link failed. Retrying CNS connection. (Error occurred)' }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Wipe tactical briefing history?')) {
      updateState(prev => ({ ...prev, chatHistory: [] }));
    }
  };

  return (
    <div className="h-full flex flex-col bg-background animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-4 border-b border-border flex items-end justify-between bg-background sticky top-0 z-20">
        <div>
          <p className="eyebrow">Iron Intelligence v2.1</p>
          <h1 className="hero-title">Iron <span className="text-accent">Coach</span></h1>
        </div>
        <button onClick={clearChat} className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground active:scale-90 transition-all hover:text-accent">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar pb-32">
        {state.chatHistory.length === 0 && (
          <div className="py-20 text-center space-y-6 px-10 max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto animate-float">
              <Bot className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-headline text-3xl leading-none mb-2">Tactical Command</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">I am your Elite Strength AI. Ask me about hypertrophy, powerlifting, or request a 12-week program.</p>
            </div>
            <Card className="p-4 bg-secondary/30 border-border text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-3">
              <Info className="w-4 h-4 text-accent" /> AI may generate inaccurate plans. Consult a doctor.
            </Card>
          </div>
        )}

        {state.chatHistory.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
              m.role === 'user' 
                ? 'bg-[#1C2500] border border-[#2E3D00] text-accent rounded-br-none' 
                : 'bg-secondary border border-border text-foreground rounded-bl-none'
            }`}>
              {m.role === 'assistant' && (
                <div className="text-[9px] font-black tracking-[2px] text-accent uppercase mb-2 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-accent animate-pulse" /> Iron Coach
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{m.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="max-w-[85%] p-4 rounded-2xl bg-secondary border border-border rounded-bl-none">
              <div className="flex gap-2 items-center">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calculating...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-background border-t border-border fixed bottom-[80px] left-0 right-0 max-w-md mx-auto z-40">
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {QUICK_PROMPTS.map(p => (
            <button 
              key={p} 
              onClick={() => handleSend(p)}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-secondary border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap active:bg-accent active:text-accent-foreground transition-all"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Awaiting athlete input..."
            className="flex-1 rounded-2xl bg-secondary border-border h-14 px-5 text-sm font-bold placeholder:text-muted-foreground/50 focus:ring-accent"
          />
          <button 
            disabled={!input.trim() || isLoading}
            onClick={() => handleSend()}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              input.trim() && !isLoading ? 'bg-accent text-accent-foreground shadow-[0_0_20px_rgba(232,255,58,0.3)] scale-100' : 'bg-secondary text-muted-foreground scale-95 opacity-50'
            }`}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getOverallRank(lifts: Record<string, { pr: number }>) {
  const THRESHOLDS = {
    'Bench Press':    [{r:'Bronze',min:0},{r:'Silver',min:185},{r:'Gold',min:275},{r:'Elite',min:350}],
    'Squat':          [{r:'Bronze',min:0},{r:'Silver',min:225},{r:'Gold',min:365},{r:'Elite',min:450}],
    'Deadlift':       [{r:'Bronze',min:0},{r:'Silver',min:275},{r:'Gold',min:405},{r:'Elite',min:500}],
    'Overhead Press': [{r:'Bronze',min:0},{r:'Silver',min:115},{r:'Gold',min:175},{r:'Elite',min:225}],
    'Barbell Row':    [{r:'Bronze',min:0},{r:'Silver',min:155},{r:'Gold',min:225},{r:'Elite',min:295}],
    'Pull-Up':        [{r:'Bronze',min:0},{r:'Silver',min:45}, {r:'Gold',min:90}, {r:'Elite',min:135}],
  };
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

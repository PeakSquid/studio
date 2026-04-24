"use client";

import React, { useState, useRef, useEffect } from 'react';
import { IronState } from '@/types/iron';
import { aiCoachChat } from '@/ai/flows/ai-coach-chat';
import { Send, RefreshCcw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type CoachTabProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

const QUICK_PROMPTS = [
  'Generate my 12-week plan',
  'How do I increase my bench press?',
  'What should I focus on next?',
  'Analyze my current ranks',
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
        chatHistory: state.chatHistory,
      });

      if (result.plan) {
        updateState(prev => ({
          ...prev,
          plan: result.plan!,
          chatHistory: [...prev.chatHistory, { role: 'assistant', content: result.reply || 'Your plan has been generated!' }]
        }));
      } else {
        updateState(prev => ({
          ...prev,
          chatHistory: [...prev.chatHistory, { role: 'assistant', content: result.reply || 'I am not sure how to respond to that.' }]
        }));
      }
    } catch (e) {
      console.error(e);
      updateState(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, { role: 'assistant', content: 'Sorry, I hit a snag. Please try again.' }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Clear chat history?')) {
      updateState(prev => ({ ...prev, chatHistory: [] }));
    }
  };

  return (
    <div className="h-full flex flex-col bg-background animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-4 border-b border-border flex items-end justify-between bg-background sticky top-0 z-20">
        <div>
          <p className="eyebrow">Powered by GenAI</p>
          <h1 className="hero-title">Your <span className="text-accent">Coach</span></h1>
        </div>
        <button onClick={clearChat} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground active:scale-90 transition-transform mb-1">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {state.chatHistory.length === 0 && (
          <div className="py-10 text-center space-y-4 px-10">
            <div className="text-4xl">🤖</div>
            <h3 className="font-headline text-2xl leading-tight">Welcome, Athlete.</h3>
            <p className="text-sm text-muted-foreground">I am your expert weightlifting coach. Ask me anything about your training, or generate a custom 12-week program.</p>
          </div>
        )}

        {state.chatHistory.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              m.role === 'user' 
                ? 'bg-[#1C2500] border border-[#2E3D00] text-accent rounded-br-none' 
                : 'bg-secondary border border-border text-foreground rounded-bl-none'
            }`}>
              {m.role === 'assistant' && (
                <div className="text-[10px] font-black tracking-widest text-accent uppercase mb-2">Iron Coach</div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="max-w-[85%] p-4 rounded-2xl bg-secondary border border-border rounded-bl-none">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-background border-t border-border">
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {QUICK_PROMPTS.map(p => (
            <button 
              key={p} 
              onClick={() => handleSend(p)}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-secondary border border-border text-xs font-bold text-muted-foreground whitespace-nowrap active:bg-secondary/50"
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
            placeholder="Ask your AI coach..."
            className="flex-1 rounded-full bg-secondary border-border h-12 px-5"
          />
          <button 
            disabled={!input.trim() || isLoading}
            onClick={() => handleSend()}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              input.trim() && !isLoading ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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

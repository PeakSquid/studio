
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { IronState } from '@/types/iron';
import { aiCoachChat } from '@/ai/flows/ai-coach-chat';
import { getTacticalVoice } from '@/ai/flows/ai-coach-voice-flow';
import { analyzeIronVision } from '@/ai/flows/iron-vision-flow';
import { Send, Loader2, Bot, User, Volume2, Square, Camera, Eye, Activity, Terminal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getOverallRank } from '@/lib/iron-utils';
import { cn } from '@/lib/utils';

type CoachTabProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

const QUICK_PROMPTS = [
  'Generate 12-week program',
  'Tactical Performance Review',
  'Analyze muscle recovery',
];

export default function CoachTab({ state, updateState }: CoachTabProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoicing, setIsVoicing] = useState(false);
  const [visionMode, setVisionMode] = useState<'equipment' | 'form'>('equipment');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.chatHistory, isLoading]);

  const handleVoiceBriefing = async () => {
    if (state.chatHistory.length === 0 || isVoicing) return;
    const lastAssistantMsg = [...state.chatHistory].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMsg) return;

    setIsVoicing(true);
    try {
      const result = await getTacticalVoice({ text: lastAssistantMsg.content });
      setAudioUrl(result.media);
      setTimeout(() => { if (audioRef.current) audioRef.current.play(); }, 100);
    } catch (e) {
      console.error(e);
      setIsVoicing(false);
    }
  };

  const handleVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setIsLoading(true);
      const transmissionMsg = visionMode === 'equipment' ? '[Transmitting Equipment Telemetry...]' : '[Transmitting Biomechanical Form Telemetry...]';
      updateState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'user', content: transmissionMsg }] }));

      try {
        const result = await analyzeIronVision({ photoDataUri: base64, mode: visionMode });
        let reply = '';
        if (result.equipment) {
          reply = `**Equipment Identified:** ${result.equipment.equipmentName}\n\n**Tactical Advice:** ${result.equipment.tacticalAdvice}\n\n**Primary Targets:** ${result.equipment.targetMuscles.join(', ')}`;
        } else if (result.form) {
          reply = `**Form Score:** ${result.form.score}/100\n\n**Feedback:** ${result.form.feedback}\n\n${result.form.safetyWarnings.length > 0 ? `**Safety Alerts:** ${result.form.safetyWarnings.join(', ')}` : '**Safety Status:** No critical alerts.'}`;
        }
        updateState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'assistant', content: reply || 'Analysis complete. Intel generated.' }] }));
      } catch (err) {
        updateState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'assistant', content: 'Vision downlink failed. Telemetry unrecognized.' }] }));
      } finally { setIsLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (msg?: string) => {
    const text = msg || input;
    if (!text.trim() || isLoading) return;
    const newUserMsg = { role: 'user' as const, content: text };
    updateState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, newUserMsg] }));
    setInput('');
    setIsLoading(true);

    try {
      const safeLifts = state.lifts || {};
      const result = await aiCoachChat({
        query: text,
        lifts: safeLifts,
        overallRank: getOverallRank(safeLifts),
        streak: state.streak || 0,
        workoutsCompleted: state.workoutsCompleted || 0,
        bodyweight: state.settings?.bodyweight || 180,
        userName: state.settings?.name || 'Athlete',
        chatHistory: (state.chatHistory || []).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })).slice(-6),
      });
      updateState(prev => ({
        ...prev,
        plan: result.plan || prev.plan,
        chatHistory: [...prev.chatHistory, { role: 'assistant', content: result.reply || 'Data processed. Proceeding with analysis.' }]
      }));
    } catch (e) {
      updateState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'assistant', content: 'Connection failure. Resetting CNS downlink.' }] }));
    } finally { setIsLoading(false); }
  };

  return (
    <div className="h-full flex flex-col bg-background animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-4 border-b border-border flex items-end justify-between bg-background sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <p className="eyebrow">Iron Intelligence v3.2</p>
          </div>
          <h1 className="hero-title">Tactical <span className="text-accent">Coach</span></h1>
        </div>
        <div className="flex gap-2">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleVisionUpload} />
          <div className="flex glass-card p-1 rounded-xl">
            <button onClick={() => setVisionMode('equipment')} className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", visionMode === 'equipment' ? "bg-accent text-accent-foreground shadow-[0_0_10px_rgba(var(--accent),0.2)]" : "text-muted-foreground")}><Eye className="w-3.5 h-3.5" /></button>
            <button onClick={() => setVisionMode('form')} className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", visionMode === 'form' ? "bg-accent text-accent-foreground shadow-[0_0_10px_rgba(var(--accent),0.2)]" : "text-muted-foreground")}><Activity className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-muted-foreground hover:text-accent transition-all active:scale-90"><Camera className="w-4 h-4" /></button>
          {state.chatHistory.length > 0 && (
            <button onClick={isVoicing ? () => setIsVoicing(false) : handleVoiceBriefing} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90", isVoicing ? 'bg-accent text-accent-foreground animate-pulse' : 'glass-card text-muted-foreground hover:text-accent')}>
              {isVoicing ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" onEnded={() => setIsVoicing(false)} />}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar pb-48">
        {(state.chatHistory || []).length === 0 && (
          <div className="py-20 text-center space-y-6 px-10 max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto animate-float">
              <Bot className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h3 className="hero-title text-3xl italic">Awaiting Telemetry</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium uppercase tracking-tight">I am your elite strength AI. Transmit query or scan equipment using **IronVision** protocol.</p>
            </div>
          </div>
        )}

        {(state.chatHistory || []).map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl shadow-2xl relative overflow-hidden",
              m.role === 'user' ? 'bg-[#1C2500] border border-[#2E3D00] text-accent rounded-br-none' : 'bg-secondary border border-border text-foreground rounded-bl-none'
            )}>
              {m.role === 'assistant' && <div className="scanline" />}
              <div className="text-[9px] font-black tracking-[3px] text-accent uppercase mb-2 flex items-center gap-2">
                {m.role === 'assistant' ? (
                  <><div className="w-1 h-1 rounded-full bg-accent animate-pulse" /> COMMAND SENSOR</>
                ) : (
                  <><User className="w-2.5 h-2.5" /> ATHLETE UNIT</>
                )}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-bold font-code">{m.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="max-w-[85%] p-4 rounded-2xl bg-secondary border border-border rounded-bl-none">
              <div className="flex gap-2 items-center">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Transmitting Intel...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-background/80 backdrop-blur-lg border-t border-border fixed bottom-[80px] left-0 right-0 max-w-md mx-auto z-40">
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => handleSend(p)} className="flex-shrink-0 px-4 py-2 rounded-xl glass-card text-[9px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap active:bg-accent active:text-accent-foreground transition-all">{p}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Awaiting athlete command..."
            className="flex-1 rounded-2xl glass-card border-border h-14 px-6 text-sm font-bold placeholder:text-muted-foreground/30 focus:ring-accent"
          />
          <button 
            disabled={!input.trim() || isLoading}
            onClick={() => handleSend()}
            className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all", input.trim() && !isLoading ? 'bg-accent text-accent-foreground shadow-[0_0_20px_rgba(232,255,58,0.3)]' : 'bg-secondary text-muted-foreground opacity-50')}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

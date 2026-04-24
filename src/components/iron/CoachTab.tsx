"use client";

import React, { useState, useRef, useEffect } from 'react';
import { IronState } from '@/types/iron';
import { aiCoachChat } from '@/ai/flows/ai-coach-chat';
import { getTacticalVoice } from '@/ai/flows/ai-coach-voice-flow';
import { analyzeEquipment } from '@/ai/flows/iron-vision-flow';
import { Send, RefreshCcw, Loader2, Bot, Info, User, Volume2, Square, Camera, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getOverallRank } from '@/lib/iron-utils';

type CoachTabProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

const QUICK_PROMPTS = [
  'Generate 12-week program',
  'Tactical Performance Review',
  'How do I reach next rank?',
  'Analyze muscle recovery',
];

export default function CoachTab({ state, updateState }: CoachTabProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoicing, setIsVoicing] = useState(false);
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
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
        }
      }, 100);
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
      
      updateState(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, { role: 'user', content: '[Transmitting Equipment Telemetry...]' }]
      }));

      try {
        const result = await analyzeEquipment({ photoDataUri: base64 });
        updateState(prev => ({
          ...prev,
          chatHistory: [...prev.chatHistory, { 
            role: 'assistant', 
            content: `**Equipment Identified:** ${result.equipmentName}\n\n**Tactical Advice:** ${result.tacticalAdvice}\n\n**Primary Targets:** ${result.targetMuscles.join(', ')}` 
          }]
        }));
      } catch (err) {
        updateState(prev => ({
          ...prev,
          chatHistory: [...prev.chatHistory, { role: 'assistant', content: 'Vision downlink failed. Equipment unrecognized.' }]
        }));
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const stopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsVoicing(false);
  };

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
        chatHistory: state.chatHistory.slice(-6),
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
          chatHistory: [...prev.chatHistory, { role: 'assistant', content: result.reply || 'Data processed. Proceeding with analysis.' }]
        }));
      }
    } catch (e) {
      updateState(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, { role: 'assistant', content: 'Connection failure. Resetting CNS downlink.' }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-4 border-b border-border flex items-end justify-between bg-background sticky top-0 z-20">
        <div>
          <p className="eyebrow">Iron Intelligence v3.0</p>
          <h1 className="hero-title">Iron <span className="text-accent">Coach</span></h1>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleVisionUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground transition-all active:scale-90 hover:text-accent"
          >
            <Camera className="w-4 h-4" />
          </button>
          {state.chatHistory.length > 0 && (
            <button 
              onClick={isVoicing ? stopVoice : handleVoiceBriefing} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isVoicing ? 'bg-accent text-accent-foreground animate-pulse' : 'bg-secondary border border-border text-muted-foreground hover:text-accent'}`}
            >
              {isVoicing ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          className="hidden" 
          onEnded={() => setIsVoicing(false)} 
        />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar pb-40">
        {state.chatHistory.length === 0 && (
          <div className="py-20 text-center space-y-6 px-10 max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto animate-float">
              <Bot className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-headline text-3xl leading-none mb-2">Tactical Command</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">I am your Elite Strength AI. Upload a photo of equipment for **IronVision** analysis or state your objective.</p>
            </div>
            <Card className="p-4 bg-secondary/30 border-border text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-3">
              <Eye className="w-4 h-4 text-accent" /> IronVision Enabled
            </Card>
          </div>
        )}

        {state.chatHistory.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl transition-all ${
              m.role === 'user' 
                ? 'bg-[#1C2500] border border-[#2E3D00] text-accent rounded-br-none' 
                : 'bg-secondary border border-border text-foreground rounded-bl-none'
            }`}>
              <div className="text-[9px] font-black tracking-[2px] text-accent uppercase mb-2 flex items-center gap-2">
                {m.role === 'assistant' ? (
                  <><div className="w-1 h-1 rounded-full bg-accent animate-pulse" /> Iron Coach</>
                ) : (
                  <><User className="w-2 h-2" /> Athlete</>
                )}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{m.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="max-w-[85%] p-4 rounded-2xl bg-secondary border border-border rounded-bl-none">
              <div className="flex gap-2 items-center">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synthesizing Intel...</span>
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
            placeholder="Awaiting athlete telemetry..."
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

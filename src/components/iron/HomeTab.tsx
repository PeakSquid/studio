"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { IronState } from '@/types/iron';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Settings, Zap, Clock, Cloud, Volume2, Square, Brain, Terminal, Shield, Activity } from 'lucide-react';
import { MUSCLES } from '@/lib/constants';
import { getOverallRank, getCNSFatigue, getAthleteLevel, getDailyObjective, getWeeklyTonnage } from '@/lib/iron-utils';
import { getTacticalVoice } from '@/ai/flows/ai-coach-voice-flow';
import { getDailyTacticalTip } from '@/ai/flows/tactical-tip-flow';
import SettingsModal from './SettingsModal';
import { cn } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

type HomeTabProps = {
  state: IronState;
  onStartWorkout: () => void;
  updateState: (updater: (prev: IronState) => IronState) => void;
  isSyncing?: boolean;
};

export default function HomeTab({ state, onStartWorkout, updateState, isSyncing }: HomeTabProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBriefing, setIsBriefing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [dailyTip, setDailyTip] = useState<{title: string, content: string, category: string} | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const rank = useMemo(() => getOverallRank(state.lifts), [state.lifts]);
  const cnsLoad = useMemo(() => getCNSFatigue(state.streak, state.activity), [state.streak, state.activity]);
  const athleteLevelData = useMemo(() => getAthleteLevel(state.xp || 0), [state.xp]);
  const objective = useMemo(() => getDailyObjective(state), [state]);
  const weeklyTonnage = useMemo(() => getWeeklyTonnage(state.workoutLogs), [state.workoutLogs]);

  const name = state.settings.name || 'Athlete';
  const { level, progress: levelProgress } = athleteLevelData;
  const weeklyGoal = objective.targetVolume * 4; 
  
  useEffect(() => {
    setIsHydrated(true);
    const timer = setInterval(() => setNow(new Date()), 60000);
    const fetchTip = async () => {
      try {
        const tip = await getDailyTacticalTip();
        setDailyTip(tip);
      } catch (e) {
        console.warn('Failed to fetch tactical intel.');
      }
    };
    fetchTip();
    return () => clearInterval(timer);
  }, []);

  const handleCombatBriefing = async () => {
    if (isBriefing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsBriefing(false);
      return;
    }

    setIsBriefing(true);
    try {
      const text = `Athlete ${name}, standing by for briefing. Current rank: ${rank}. Neural load is at ${cnsLoad} percent. Your primary objective for this cycle is to ${objective.label}. Initializing workout protocol. Good luck.`;
      const result = await getTacticalVoice({ text });
      setAudioUrl(result.media);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
        }
      }, 100);
    } catch (e) {
      console.error(e);
      setIsBriefing(false);
    }
  };

  const getRecoveryInfo = (muscle: string) => {
    const recoveryTime = state.muscleRecovery[muscle];
    if (!recoveryTime) return { status: 'Optimal', time: '' };
    
    const target = new Date(recoveryTime);
    if (now >= target) return { status: 'Optimal', time: '' };
    
    const diffMs = target.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    return { status: 'Fatigued', time: `READY IN ${diffHours}H` };
  };

  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-40">
      <header className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-accent animate-pulse-soft" />
            <p className="eyebrow">{name} · {rank} Class</p>
            {isSyncing && <Cloud className="w-3 h-3 text-accent animate-pulse" />}
          </div>
          <h1 className="hero-title text-6xl">Iron<span className="text-accent">Rank</span></h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCombatBriefing}
            aria-label={isBriefing ? "Stop Briefing" : "Start Tactical Briefing"}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 glass-card",
              isBriefing ? "bg-accent/20 text-accent animate-pulse" : "text-muted-foreground hover:text-accent"
            )}
          >
            {isBriefing ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open Settings"
            className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-muted-foreground transition-all active:scale-95 hover:text-accent"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          className="hidden" 
          onEnded={() => setIsBriefing(false)} 
        />
      )}

      <div className="grid grid-cols-1 gap-4 mb-6">
        <Card className="p-5 glass-card relative overflow-hidden group">
          <div className="scanline" />
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="hud-label mb-1">Weekly Tonnage Progress</div>
              <div className="font-headline text-4xl leading-none tracking-tighter italic text-accent">{weeklyTonnage.toLocaleString()} <span className="text-xs font-sans not-italic text-muted-foreground">LB</span></div>
            </div>
            <div className="text-right">
              <div className="hud-label mb-1">Target Mission</div>
              <div className="text-xs font-bold text-muted-foreground">{weeklyGoal.toLocaleString()} LB</div>
            </div>
          </div>
          <Progress value={Math.min((weeklyTonnage / weeklyGoal) * 100, 100)} className="h-2 bg-background/50 mb-1" />
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>Monday Reset</span>
            <span>{Math.round((weeklyTonnage / weeklyGoal) * 100)}% Synchronized</span>
          </div>
        </Card>
      </div>

      <Card className="p-5 mb-6 glass-card border-accent/20 relative overflow-hidden group">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="hud-label mb-1">Current Objective</div>
            <div className="font-headline text-3xl leading-none tracking-tighter italic text-accent">{objective.label}</div>
          </div>
          <div className="bg-accent/10 px-3 py-1 rounded-lg border border-accent/20">
            <span className="text-[9px] font-black uppercase text-accent tracking-widest">{objective.type}</span>
          </div>
        </div>
        <Progress value={Math.min((state.totalVolume / objective.targetVolume) * 100, 100)} className="h-1.5 bg-background/50" />
      </Card>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <Card className="p-5 glass-card relative overflow-hidden group">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="hud-label mb-1">Neural Capacity</div>
              <div className="font-headline text-5xl leading-none tracking-tighter italic">Level <span className="text-accent">{level}</span></div>
            </div>
            <div className="text-right">
              <div className="hud-label mb-1">Athlete XP</div>
              <div className="text-sm font-bold text-accent">{state.xp || 0}</div>
            </div>
          </div>
          <Progress value={levelProgress} className="h-2 bg-background/50 mb-1" />
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>SYNC NODE {level}</span>
            <span>NEXT CALIBRATION</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-5 glass-card group">
          <p className="eyebrow flex items-center gap-2 group-hover:text-accent transition-colors"><Zap className="w-3.5 h-3.5" /> Streak</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-headline text-4xl italic">{state.streak}</span>
            <span className="hud-label">Days</span>
          </div>
        </Card>
        <Card className="p-5 glass-card group">
          <p className="eyebrow flex items-center gap-2 group-hover:text-accent transition-colors"><Brain className="w-3.5 h-3.5" /> CNS Load</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-headline text-4xl italic">{cnsLoad}</span>
            <span className="hud-label">%</span>
          </div>
        </Card>
      </div>

      {dailyTip && (
        <section className="mb-6">
          <h3 className="section-header">Tactical Intel</h3>
          <Card className="p-5 bg-secondary border-accent/10 border-l-4 border-l-accent relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Terminal className="w-10 h-10 text-accent" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-accent/10 text-accent text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[2px] border border-accent/20">
                {dailyTip.category}
              </span>
            </div>
            <h4 className="font-bold text-sm mb-2 group-hover:text-accent transition-colors">{dailyTip.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed italic font-medium">"{dailyTip.content}"</p>
          </Card>
        </section>
      )}

      <section>
        <h3 className="section-header">Biological Status</h3>
        <Card className="p-8 glass-card flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative w-full max-w-[220px] mb-12 animate-float">
            <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full" />
            <svg viewBox="0 0 100 150" className="w-full h-auto relative z-10" role="img" aria-label="Muscle Recovery Map">
              <path d="M30 40 Q50 35 70 40 L65 55 Q50 60 35 55 Z" className={`muscle-map-path ${getRecoveryInfo('Chest').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <circle cx="25" cy="45" r="8" className={`muscle-map-path ${getRecoveryInfo('Shoulders').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <circle cx="75" cy="45" r="8" className={`muscle-map-path ${getRecoveryInfo('Shoulders').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M20 55 L15 90 L25 90 L28 55 Z" className={`muscle-map-path ${getRecoveryInfo('Arms').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M80 55 L85 90 L75 90 L72 55 Z" className={`muscle-map-path ${getRecoveryInfo('Arms').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M35 95 L30 140 L45 140 L48 95 Z" className={`muscle-map-path ${getRecoveryInfo('Legs').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M65 95 L70 140 L55 140 L52 95 Z" className={`muscle-map-path ${getRecoveryInfo('Legs').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-accent/5 rounded-full animate-pulse-soft pointer-events-none" />
          </div>
          <div className="grid grid-cols-1 gap-3 w-full relative z-10">
            {Object.keys(MUSCLES).map(m => {
              const info = getRecoveryInfo(m);
              return (
                <div key={m} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", info.status === 'Optimal' ? 'bg-accent shadow-[0_0_10px_rgba(var(--accent),0.6)]' : 'bg-orange-500 animate-pulse')} />
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground">{m}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    {info.status === 'Optimal' ? (
                      <span className="text-accent/80 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Ready</span>
                    ) : (
                      <span className="text-orange-500/80 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {info.time}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        state={state}
        updateState={updateState}
      />
    </div>
  );
}

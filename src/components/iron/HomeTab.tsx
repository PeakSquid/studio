
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { IronState } from '@/types/iron';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Settings, Zap, Clock, Cloud, Target, ChevronRight, Volume2, Loader2, Square, Brain, Terminal } from 'lucide-react';
import { MUSCLES } from '@/lib/constants';
import { getOverallRank, getOverallRankProgress, getNearestMilestone, getCNSFatigue, getAthleteLevel } from '@/lib/iron-utils';
import { getTacticalVoice } from '@/ai/flows/ai-coach-voice-flow';
import { getDailyTacticalTip } from '@/ai/flows/tactical-tip-flow';
import SettingsModal from './SettingsModal';
import { cn } from '@/lib/utils';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const rank = getOverallRank(state.lifts);
  const { nextRank, progress: rankProgress, remaining } = getOverallRankProgress(state.lifts);
  const milestone = getNearestMilestone(state.lifts);
  const name = state.settings.name || 'Athlete';
  const cnsLoad = getCNSFatigue(state.streak, state.activity);
  const { level, progress: levelProgress } = getAthleteLevel(state.xp || 0);
  
  useEffect(() => {
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
      const text = `Athlete ${name}, standing by for briefing. Current rank: ${rank}. Neural load is at ${cnsLoad} percent. You have completed ${state.workoutsCompleted} sessions. ${milestone ? `Primary tactical target: ${milestone.name}. You are ${milestone.toNext} pounds away from ${milestone.nextLabel} rank.` : 'All primary objectives secured.'} Initializing workout protocol. Good luck.`;
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
            <p className="eyebrow">{name} · {rank} Class</p>
            {isSyncing ? (
              <Cloud className="w-3 h-3 text-accent animate-pulse" />
            ) : (
              <Cloud className="w-3 h-3 text-accent/40" />
            )}
          </div>
          <h1 className="hero-title">Iron<span className="text-accent">Rank</span></h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCombatBriefing}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95",
              isBriefing ? "bg-accent text-accent-foreground animate-pulse" : "bg-secondary border border-border text-muted-foreground hover:border-accent/50"
            )}
          >
            {isBriefing ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground transition-all active:scale-95 hover:border-accent/50"
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

      {/* Level & XP HUD */}
      <Card className="p-4 mb-6 bg-[#121212] border-accent/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Terminal className="w-12 h-12 text-accent" />
        </div>
        <div className="flex justify-between items-end mb-3">
          <div>
            <div className="text-[10px] text-accent font-black uppercase tracking-widest mb-0.5">Neural Capacity</div>
            <div className="font-headline text-3xl leading-none">Level <span className="text-accent">{level}</span></div>
          </div>
          <div className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {state.xp || 0} Total XP
          </div>
        </div>
        <Progress value={levelProgress} className="h-1.5 bg-background mb-1" />
        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">
          <span>Lvl {level}</span>
          <span>Next Node</span>
        </div>
      </Card>

      {/* Daily Tactical Intel */}
      {dailyTip && (
        <section className="mb-6">
          <h3 className="section-header">Command Intel</h3>
          <Card className="p-4 bg-accent/5 border-accent/10 border-l-4 border-l-accent animate-in fade-in duration-1000">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-accent text-accent-foreground text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                {dailyTip.category}
              </span>
              <div className="h-px flex-1 bg-accent/10" />
            </div>
            <h4 className="font-bold text-sm mb-1">{dailyTip.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed italic">"{dailyTip.content}"</p>
          </Card>
        </section>
      )}

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-secondary/30 border-border">
          <p className="eyebrow flex items-center gap-2"><Zap className="w-3 h-3 text-accent" /> Streak</p>
          <div className="flex items-center gap-2">
            <span className="font-headline text-3xl">{state.streak}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Days</span>
          </div>
        </Card>
        <Card className="p-4 bg-secondary/30 border-border">
          <p className="eyebrow flex items-center gap-2"><Brain className="w-3 h-3 text-accent" /> Neural Load</p>
          <div className="flex items-center gap-2">
            <span className="font-headline text-3xl">{cnsLoad}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">%</span>
          </div>
        </Card>
      </div>

      {/* Rank Progression Card */}
      <Card className="p-5 mb-6 bg-secondary border-border overflow-hidden relative group">
        <div className="flex justify-between items-end mb-3">
          <div>
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Rank Progression</div>
            <div className="font-headline text-3xl leading-none">Chasing <span className="text-accent">{nextRank}</span></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Status</div>
            <div className="text-xs font-bold">{remaining} Objectives Remaining</div>
          </div>
        </div>
        <Progress value={rankProgress} className="h-2 bg-background mb-2" />
        <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
          <span>{rank}</span>
          <span>{nextRank}</span>
        </div>
      </Card>

      {/* Biological Recovery Status */}
      <section>
        <h3 className="section-header">Biological Status</h3>
        <Card className="p-8 bg-secondary/30 border-border flex flex-col items-center">
          <div className="relative w-full max-w-[200px] mb-10">
            <svg viewBox="0 0 100 150" className="w-full h-auto">
              <path d="M30 40 Q50 35 70 40 L65 55 Q50 60 35 55 Z" className={`muscle-map-path ${getRecoveryInfo('Chest').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <circle cx="25" cy="45" r="8" className={`muscle-map-path ${getRecoveryInfo('Shoulders').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <circle cx="75" cy="45" r="8" className={`muscle-map-path ${getRecoveryInfo('Shoulders').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M20 55 L15 90 L25 90 L28 55 Z" className={`muscle-map-path ${getRecoveryInfo('Arms').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M80 55 L85 90 L75 90 L72 55 Z" className={`muscle-map-path ${getRecoveryInfo('Arms').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M35 95 L30 140 L45 140 L48 95 Z" className={`muscle-map-path ${getRecoveryInfo('Legs').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
              <path d="M65 95 L70 140 L55 140 L52 95 Z" className={`muscle-map-path ${getRecoveryInfo('Legs').status === 'Optimal' ? 'muscle-map-optimal' : 'muscle-map-fatigued'}`} />
            </svg>
          </div>
          <div className="grid grid-cols-1 gap-2 w-full">
            {Object.keys(MUSCLES).map(m => {
              const info = getRecoveryInfo(m);
              return (
                <div key={m} className="flex items-center justify-between bg-background/40 p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", info.status === 'Optimal' ? 'bg-accent' : 'bg-orange-500')} />
                    <span className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground">{m}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    {info.status === 'Optimal' ? (
                      <span className="text-accent">Ready for Mission</span>
                    ) : (
                      <span className="text-orange-500 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {info.time}</span>
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

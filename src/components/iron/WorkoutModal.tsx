"use client";

import React, { useState, useEffect, useRef } from 'react';
import { IronState, WorkoutLogEntry } from '@/types/iron';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Check, ChevronLeft, ChevronRight, Zap, Calculator, Volume2, Square, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculatePlates } from '@/lib/iron-utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getTacticalVoice } from '@/ai/flows/ai-coach-voice-flow';

type WorkoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function WorkoutModal({ isOpen, onClose, state, updateState }: WorkoutModalProps) {
  const workout = state.plan?.workouts.find(w => w.type === state.plan?.schedule[new Date().getDay().toString()]);
  
  const [activeExIdx, setActiveExIdx] = useState(0);
  const [sets, setSets] = useState<any[][]>([]);
  const [phase, setPhase] = useState<'workout' | 'done'>('workout');
  const [restTime, setRestTime] = useState(0);
  const [totalRest, setTotalRest] = useState(90);
  const [isDebriefing, setIsDebriefing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [pingSet, setPingSet] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (workout) {
      const initialSets = workout.exercises.map(ex => 
        Array.from({ length: ex.sets }, () => ({
          weight: ex.weight || 45,
          reps: parseInt(ex.reps) || 8,
          done: false
        }))
      );
      setSets(initialSets);
    }
  }, [workout]);

  useEffect(() => {
    let timer: any;
    if (restTime > 0) {
      timer = setInterval(() => setRestTime(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [restTime]);

  if (!workout) return null;

  const currentEx = workout.exercises[activeExIdx];
  const totalSets = sets.flat().length;
  const doneSetsCount = sets.flat().filter(s => s.done).length;
  const progressPct = totalSets > 0 ? (doneSetsCount / totalSets) * 100 : 0;

  const toggleSet = (idx: number) => {
    const newSets = [...sets];
    const set = newSets[activeExIdx][idx];
    const isNowDone = !set.done;
    set.done = isNowDone;
    
    if (isNowDone) {
      setPingSet(idx);
      setTimeout(() => setPingSet(null), 800);
      const rTime = isCompound(currentEx.name) ? 120 : 60;
      setRestTime(rTime);
      setTotalRest(rTime);
    }
    
    setSets(newSets);
  };

  const handleFinish = async () => {
    const sessionVolume = sets.flat().reduce((acc, s) => acc + (s.done ? (s.weight * s.reps) : 0), 0);
    const affectedMuscles = getAffectedMuscles(workout.focus);
    const today = new Date().toISOString();
    
    const logEntry: WorkoutLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: today,
      name: workout.name,
      volume: sessionVolume,
      sets: doneSetsCount,
      type: workout.type
    };

    // XP calculation: 25 XP base per workout + 5 XP per set
    const xpEarned = 25 + (doneSetsCount * 5);

    updateState(prev => {
      const newActivity = [...prev.activity];
      newActivity.shift();
      newActivity.push(2);
      
      const newRecovery = { ...prev.muscleRecovery };
      affectedMuscles.forEach(m => {
        const recoveryDate = new Date();
        recoveryDate.setHours(recoveryDate.getHours() + 48);
        newRecovery[m] = recoveryDate.toISOString();
      });

      const newVolumeHistory = [
        ...prev.volumeHistory,
        { date: today, volume: sessionVolume }
      ].slice(-10);
      
      return {
        ...prev,
        workoutsCompleted: prev.workoutsCompleted + 1,
        workoutLogs: [logEntry, ...prev.workoutLogs].slice(0, 50),
        streak: prev.streak + 1,
        activity: newActivity,
        lastWorkout: today,
        totalVolume: sessionVolume,
        volumeHistory: newVolumeHistory,
        muscleRecovery: newRecovery,
        xp: (prev.xp || 0) + xpEarned
      };
    });
    
    setPhase('done');
    
    // Trigger AI Debriefing
    setIsDebriefing(true);
    try {
      const briefText = `Mission accomplished, athlete. ${workout.name} completed. Total tonnage moved: ${sessionVolume} pounds across ${doneSetsCount} successful sets. Neural adaptation gain: ${xpEarned} XP. Data logged to iron cloud. Well done.`;
      const result = await getTacticalVoice({ text: briefText });
      setAudioUrl(result.media);
      setTimeout(() => {
        if (audioRef.current) audioRef.current.play();
      }, 200);
    } catch (e) {
      console.error(e);
      setIsDebriefing(false);
    }
  };

  const isCompound = (name: string) => {
    const compounds = ['bench press', 'squat', 'deadlift', 'overhead press', 'barbell row'];
    return compounds.some(c => name.toLowerCase().includes(c));
  };

  const getAffectedMuscles = (focus: string) => {
    const muscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];
    return muscles.filter(m => focus.toLowerCase().includes(m.toLowerCase()));
  };

  if (phase === 'done') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md h-full p-0 bg-background border-none overflow-y-auto no-scrollbar">
          <div className="flex flex-col items-center justify-center p-10 text-center min-h-screen">
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center text-5xl mb-6 animate-pr-pop">⚡</div>
            <h1 className="hero-title text-6xl mb-2">Tactical<br/><span className="text-accent">Success</span></h1>
            
            <div className="grid grid-cols-2 gap-4 w-full my-10">
              <div className="bg-secondary p-4 rounded-2xl border border-border">
                <div className="font-headline text-3xl leading-none">{doneSetsCount}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Sets Executed</div>
              </div>
              <div className="bg-secondary p-4 rounded-2xl border border-border">
                <div className="font-headline text-3xl leading-none">{state.totalVolume}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Total Tonnage</div>
              </div>
            </div>

            <Card className="w-full p-4 mb-8 bg-secondary border-accent/20 flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                isDebriefing && !audioUrl ? "bg-accent/10" : "bg-accent text-accent-foreground"
              )}>
                {isDebriefing && !audioUrl ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="text-[10px] font-black uppercase text-accent tracking-widest">Post-Mission Debrief</p>
                <p className="text-xs font-bold text-muted-foreground">AI Intelligence synthesized</p>
              </div>
              {audioUrl && (
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsDebriefing(false)} />
              )}
            </Card>

            <button 
              onClick={onClose}
              className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-2xl text-lg transition-transform active:scale-95 shadow-[0_10px_30px_rgba(232,255,58,0.3)]"
            >
              Log Session & Exit
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-screen flex flex-col p-0 bg-background border-none shadow-none gap-0">
        <header className="px-6 pt-10 pb-4 border-b border-border flex items-start justify-between bg-background">
          <div>
            <h2 className="font-headline text-3xl leading-none">{workout.name}</h2>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-tighter">{workout.focus}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center transition-transform active:scale-90">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar bg-secondary/30 border-b border-border">
          {workout.exercises.map((ex, i) => (
            <button 
              key={i} 
              onClick={() => setActiveExIdx(i)}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all flex-shrink-0",
                i === activeExIdx ? "bg-accent text-accent-foreground scale-110" : "bg-secondary border border-border text-muted-foreground"
              )}
            >
              {i + 1}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center text-[11px] font-bold text-muted-foreground pr-2 uppercase">
            {doneSetsCount}/{totalSets} SETS
          </div>
        </div>

        <div className="h-1 bg-secondary w-full">
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <div className="eyebrow">Objective {activeExIdx + 1} of {workout.exercises.length}</div>
              <h3 className="font-headline text-4xl leading-tight uppercase tracking-tight">{currentEx.name}</h3>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground active:text-accent transition-colors">
                  <Calculator className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-popover border-border p-4 shadow-2xl rounded-2xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Plate Calculator</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs border-b border-border pb-1">
                    <span className="text-muted-foreground">Load</span>
                    <span className="font-bold">{currentEx.weight} lb</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {Object.entries(calculatePlates(currentEx.weight || 45)).map(([plate, count]) => (
                      <div key={plate} className="flex justify-between items-center bg-secondary/50 px-2 py-1.5 rounded-lg border border-border/50">
                        <span className="text-sm font-black text-accent">{plate} lb</span>
                        <span className="text-xs font-bold text-muted-foreground">x {count} (each side)</span>
                      </div>
                    ))}
                    {Object.keys(calculatePlates(currentEx.weight || 45)).length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-2">Bar Only</div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            {sets[activeExIdx]?.map((set: any, si: number) => (
              <Card 
                key={si} 
                className={cn(
                  "p-3 flex items-center gap-4 border transition-all relative overflow-hidden",
                  set.done ? "bg-accent/10 border-accent/30" : "bg-secondary border-border"
                )}
              >
                {pingSet === si && (
                  <div className="absolute inset-0 bg-accent/20 animate-xp-ping pointer-events-none" />
                )}
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs", set.done ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground")}>
                  {si + 1}
                </div>
                <div className="flex-1 flex gap-4">
                  <div>
                    <div className="font-black text-lg leading-none">{set.weight}<span className="text-[10px] font-sans text-muted-foreground ml-0.5">lb</span></div>
                    <div className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Load</div>
                  </div>
                  <div>
                    <div className="font-black text-lg leading-none">{set.reps}</div>
                    <div className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Reps</div>
                  </div>
                </div>
                <button 
                  onClick={() => toggleSet(si)}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                    set.done ? "bg-accent text-accent-foreground shadow-[0_0_15px_rgba(var(--accent),0.2)]" : "bg-background border-2 border-border"
                  )}
                >
                  {set.done ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Check className="w-6 h-6 opacity-0" />}
                </button>
              </Card>
            ))}
          </div>
        </div>

        {restTime > 0 && (
          <div className="p-4 bg-secondary border-t border-border animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-background" />
                  <circle 
                    cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" 
                    className="text-accent transition-all duration-1000"
                    strokeDasharray={150}
                    strokeDashoffset={150 * (1 - restTime / totalRest)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-headline text-lg">
                  {restTime}s
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Recovery Phase</div>
                <div className="text-sm font-bold">Resupply CNS for next set</div>
              </div>
              <button 
                onClick={() => setRestTime(0)}
                className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold active:bg-accent active:text-accent-foreground transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        <footer className="p-4 pt-2 pb-[env(safe-area-inset-bottom,16px)] bg-background border-t border-border flex gap-3">
          <button 
            disabled={activeExIdx === 0}
            onClick={() => setActiveExIdx(prev => prev - 1)}
            className="flex-1 bg-secondary text-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" /> Prev
          </button>
          
          {activeExIdx < workout.exercises.length - 1 ? (
            <button 
              onClick={() => setActiveExIdx(prev => prev + 1)}
              className="flex-[2] bg-accent text-accent-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(232,255,58,0.2)]"
            >
              Next Objective <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              className={cn(
                "flex-[2] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all",
                doneSetsCount === totalSets ? "bg-accent text-accent-foreground shadow-[0_4px_20px_rgba(232,255,58,0.3)]" : "bg-secondary text-muted-foreground"
              )}
            >
              Extract & Log <Zap className="w-5 h-5 fill-current" />
            </button>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}

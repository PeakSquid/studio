
"use client";

import React, { useState } from 'react';
import { IronState } from '@/types/iron';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trophy, Save, History } from 'lucide-react';
import { THRESHOLDS } from '@/lib/constants';

type PRLogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function PRLogModal({ isOpen, onClose, state, updateState }: PRLogModalProps) {
  const [selectedLift, setSelectedLift] = useState<string>('Bench Press');
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('1');

  const handleSave = () => {
    const w = parseInt(weight);
    const r = parseInt(reps);
    if (isNaN(w) || w <= 0) return;

    // Award 50 XP for a PR record
    const xpEarned = 50;

    updateState(prev => {
      const currentLift = prev.lifts[selectedLift];
      const isNewPR = w > currentLift.pr;
      
      const newHistory = [
        ...(currentLift.history || []),
        { date: new Date().toISOString(), weight: w }
      ].slice(-10);

      const newUnlocked = { ...prev.unlockedAchievements };
      if (isNewPR) {
        newUnlocked['first_pr'] = new Date().toISOString();
        // Check for specific achievement markers
        if (selectedLift === 'Bench Press' && w >= 225) newUnlocked['bench_225'] = new Date().toISOString();
        if (selectedLift === 'Bench Press' && w >= 315) newUnlocked['bench_315'] = new Date().toISOString();
        if (selectedLift === 'Squat' && w >= 315) newUnlocked['squat_315'] = new Date().toISOString();
        if (selectedLift === 'Deadlift' && w >= 405) newUnlocked['deadlift_405'] = new Date().toISOString();
      }

      return {
        ...prev,
        lifts: {
          ...prev.lifts,
          [selectedLift]: {
            ...currentLift,
            pr: isNewPR ? w : currentLift.pr,
            reps: isNewPR ? r : currentLift.reps,
            history: newHistory
          }
        },
        unlockedAchievements: newUnlocked,
        xp: (prev.xp || 0) + xpEarned
      };
    });

    setWeight('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="font-headline text-3xl leading-none uppercase">Log <span className="text-accent">PR</span></DialogTitle>
            <p className="text-xs text-muted-foreground mt-1 font-medium tracking-tight">Record your latest objective success.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-transform active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Lift</Label>
            <Select value={selectedLift} onValueChange={setSelectedLift}>
              <SelectTrigger className="h-14 bg-secondary border-border rounded-xl font-bold text-lg">
                <SelectValue placeholder="Select Lift" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {Object.keys(THRESHOLDS).map(lift => (
                  <SelectItem key={lift} value={lift} className="font-bold py-3">{lift}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Weight ({state.settings.unit})</Label>
              <div className="relative">
                <Input 
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="h-14 bg-secondary border-border rounded-xl text-2xl font-headline pl-4 focus:ring-accent"
                />
                <Trophy className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Reps</Label>
              <Input 
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="1"
                className="h-14 bg-secondary border-border rounded-xl text-2xl font-headline focus:ring-accent"
              />
            </div>
          </div>

          {state.lifts[selectedLift]?.pr > 0 && (
            <div className="p-4 bg-secondary/30 border border-border rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground">Previous Best</span>
              </div>
              <span className="font-headline text-2xl">{state.lifts[selectedLift].pr} {state.settings.unit}</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-secondary/20">
          <Button 
            onClick={handleSave}
            disabled={!weight || parseInt(weight) <= 0}
            className="w-full h-16 bg-accent text-accent-foreground font-black uppercase tracking-[2px] rounded-2xl shadow-[0_0_30px_rgba(232,255,58,0.2)] text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            Record Achievement <Save className="w-5 h-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

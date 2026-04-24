"use client";

import React from 'react';
import { IronState } from '@/types/iron';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { X, User, Ruler, Weight, ShieldCheck } from 'lucide-react';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function SettingsModal({ isOpen, onClose, state, updateState }: SettingsModalProps) {
  const handleNameChange = (val: string) => {
    updateState(prev => ({ ...prev, settings: { ...prev.settings, name: val } }));
  };

  const handleWeightChange = (val: string) => {
    updateState(prev => ({ ...prev, settings: { ...prev.settings, bodyweight: parseInt(val) || 0 } }));
  };

  const handleUnitChange = (val: 'lb' | 'kg') => {
    updateState(prev => ({ ...prev, settings: { ...prev.settings, unit: val } }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="font-headline text-3xl leading-none uppercase">Profile <span className="text-accent">Settings</span></DialogTitle>
            <p className="text-xs text-muted-foreground mt-1 font-medium tracking-tight">Configure your athlete profile for AI optimization.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-transform active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* Identity Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <User className="w-3 h-3" /> Identity
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-muted-foreground">Athlete Name</Label>
              <Input 
                id="name"
                value={state.settings.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Iron Beast"
                className="h-12 bg-secondary border-border rounded-xl focus:ring-accent"
              />
            </div>
          </div>

          {/* Vitals Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <Weight className="w-3 h-3" /> Vitals
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-xs font-bold text-muted-foreground">Bodyweight ({state.settings.unit})</Label>
                <Input 
                  id="weight"
                  type="number"
                  value={state.settings.bodyweight || ''}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  placeholder="0"
                  className="h-12 bg-secondary border-border rounded-xl focus:ring-accent"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Preferred Units</Label>
                <RadioGroup 
                  defaultValue={state.settings.unit} 
                  onValueChange={(v) => handleUnitChange(v as 'lb' | 'kg')}
                  className="flex h-12 bg-secondary border border-border rounded-xl p-1"
                >
                  <div className="flex-1 flex items-center justify-center">
                    <RadioGroupItem value="lb" id="lb" className="sr-only" />
                    <Label 
                      htmlFor="lb" 
                      className={`w-full h-full flex items-center justify-center rounded-lg cursor-pointer transition-all ${state.settings.unit === 'lb' ? 'bg-accent text-accent-foreground font-black' : 'text-muted-foreground font-bold'}`}
                    >
                      LB
                    </Label>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <RadioGroupItem value="kg" id="kg" className="sr-only" />
                    <Label 
                      htmlFor="kg" 
                      className={`w-full h-full flex items-center justify-center rounded-lg cursor-pointer transition-all ${state.settings.unit === 'kg' ? 'bg-accent text-accent-foreground font-black' : 'text-muted-foreground font-bold'}`}
                    >
                      KG
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <ShieldCheck className="w-3 h-3" /> System
            </div>
            <div className="p-4 bg-secondary/50 rounded-2xl border border-border border-dashed text-center">
              <div className="text-[10px] text-muted-foreground font-medium mb-2 italic">Local progression only</div>
              <Button variant="outline" className="w-full rounded-xl border-border hover:bg-destructive hover:text-white transition-colors" onClick={() => {
                if(confirm('Wipe all local IronRank data? This cannot be undone.')) {
                   localStorage.clear();
                   window.location.reload();
                }
              }}>
                Wipe Local Progress
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-secondary/20">
          <Button onClick={onClose} className="w-full h-14 bg-accent text-accent-foreground font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(232,255,58,0.2)]">
            Save & Sync Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

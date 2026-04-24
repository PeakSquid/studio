
"use client";

import React from 'react';
import { IronState } from '@/types/iron';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { X, User, Weight, ShieldCheck, Palette } from 'lucide-react';

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

  const handleThemeChange = (val: 'iron' | 'stealth') => {
    updateState(prev => ({ ...prev, settings: { ...prev.settings, theme: val } }));
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
              <Palette className="w-3 h-3" /> Appearance
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">System Theme</Label>
              <RadioGroup 
                defaultValue={state.settings.theme} 
                onValueChange={(v) => handleThemeChange(v as 'iron' | 'stealth')}
                className="grid grid-cols-2 gap-2"
              >
                <div className={`p-3 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${state.settings.theme === 'iron' ? 'bg-accent/10 border-accent text-accent' : 'bg-secondary border-border'}`}>
                  <RadioGroupItem value="iron" id="iron" className="sr-only" />
                  <Label htmlFor="iron" className="font-black text-[10px] uppercase tracking-widest cursor-pointer">Iron (Toxic)</Label>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${state.settings.theme === 'stealth' ? 'bg-accent/10 border-accent text-accent' : 'bg-secondary border-border'}`}>
                  <RadioGroupItem value="stealth" id="stealth" className="sr-only" />
                  <Label htmlFor="stealth" className="font-black text-[10px] uppercase tracking-widest cursor-pointer">Stealth (Red)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Account Security */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <ShieldCheck className="w-3 h-3" /> System
            </div>
            <div className="p-4 bg-secondary/50 rounded-2xl border border-border border-dashed text-center">
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
          <Button onClick={onClose} className="w-full h-14 bg-accent text-accent-foreground font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(var(--accent),0.2)]">
            Save & Sync Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

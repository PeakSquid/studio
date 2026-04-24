
"use client";

import React, { useState } from 'react';
import { IronState } from '@/types/iron';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Zap, ChevronRight, User, Trophy, Shield } from 'lucide-react';

type OnboardingProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function Onboarding({ state, updateState }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      updateState(prev => ({
        ...prev,
        onboardingComplete: true,
        settings: { ...prev.settings, name, bodyweight: parseInt(weight) || 0 }
      }));
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-background p-8 justify-center animate-in fade-in duration-700">
      <div className="mb-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center text-accent-foreground mx-auto mb-6 shadow-[0_0_30px_rgba(var(--accent),0.3)]">
          <Shield className="w-10 h-10 fill-current" />
        </div>
        <h1 className="hero-title text-5xl">Athlete <span className="text-accent">Protocol</span></h1>
        <p className="text-muted-foreground text-xs font-black uppercase tracking-[2px] mt-2">Initialize Physical Baseline</p>
      </div>

      <div className="space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="space-y-2">
              <Label className="eyebrow flex items-center gap-2"><User className="w-3 h-3" /> Identity Designation</Label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Callsign (e.g. Iron Ghost)"
                className="h-16 bg-secondary border-border rounded-2xl text-xl font-bold px-6 focus:ring-accent"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="space-y-2">
              <Label className="eyebrow flex items-center gap-2">Biometric Weight (LB)</Label>
              <Input 
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Current Mass"
                className="h-16 bg-secondary border-border rounded-2xl text-xl font-bold px-6 focus:ring-accent"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center animate-in slide-in-from-right-4">
            <div className="p-6 bg-secondary border border-border rounded-3xl">
              <Trophy className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="font-headline text-3xl uppercase">Baseline Ready</h3>
              <p className="text-sm text-muted-foreground mt-2">I am your Elite Strength AI. I will track your progression across 6 core metrics. Every log adapts the algorithm.</p>
            </div>
          </div>
        )}

        <Button 
          disabled={step === 1 ? !name.trim() : step === 2 ? !weight : false}
          onClick={handleNext}
          className="w-full h-16 bg-accent text-accent-foreground font-black uppercase tracking-widest text-lg rounded-2xl shadow-[0_10px_30px_rgba(var(--accent),0.2)]"
        >
          {step === 3 ? 'Initialize System' : 'Acknowledge'} <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="mt-12 flex justify-center gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${step === i ? 'w-8 bg-accent' : 'w-2 bg-secondary'}`} />
        ))}
      </div>
    </div>
  );
}

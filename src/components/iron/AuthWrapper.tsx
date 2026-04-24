
"use client";

import React, { useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, ChevronRight } from 'lucide-react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = () => {
    setIsSigningIn(true);
    initiateAnonymousSignIn(auth);
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col h-screen w-full bg-background items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
        <p className="eyebrow">Initializing Tactical HUD...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen w-full bg-background items-center justify-center p-8 text-center animate-in fade-in duration-1000">
        <div className="mb-12">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center text-accent-foreground mx-auto mb-6 shadow-[0_0_40px_rgba(var(--accent),0.3)]">
            <Shield className="w-12 h-12 fill-current" />
          </div>
          <h1 className="hero-title text-6xl">Iron<span className="text-accent">Rank</span></h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[4px] mt-2">Authenticated Strength Control</p>
        </div>

        <div className="space-y-6 w-full max-w-xs">
          <p className="text-xs text-muted-foreground leading-relaxed uppercase font-bold tracking-tight">
            Authorization required to access cloud-synced athlete telemetry and AI coaching.
          </p>
          
          <Button 
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full h-16 bg-accent text-accent-foreground font-black uppercase tracking-widest text-lg rounded-2xl shadow-[0_10px_30px_rgba(var(--accent),0.2)] active:scale-95 transition-all"
          >
            {isSigningIn ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>Enter Iron Protocol <ChevronRight className="w-5 h-5" /></>
            )}
          </Button>
          
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-50">
            Secure Anonymous Handshake v4.1
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

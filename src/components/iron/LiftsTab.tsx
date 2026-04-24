"use client";

import React, { useState, useMemo } from 'react';
import { IronState } from '@/types/iron';
import { THRESHOLDS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { getLiftRank, getLiftProgress, getOverallRank, getRadarData } from '@/lib/iron-utils';
import { generateSpiritTotem } from '@/ai/flows/generate-totem-flow';
import { Loader2, Sparkles, Image as ImageIcon, TrendingUp, Scale, History, Target } from 'lucide-react';
import Image from 'next/image';

type LiftsTabProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function LiftsTab({ state }: LiftsTabProps) {
  const [isGeneratingTotem, setIsGeneratingTotem] = useState(false);
  const [totem, setTotem] = useState<{ url: string; desc: string } | null>(null);

  const radarData = useMemo(() => getRadarData(state.lifts), [state.lifts]);
  const weightHistory = useMemo(() => state.settings.weightHistory || [], [state.settings.weightHistory]);

  const handleGenerateTotem = async () => {
    setIsGeneratingTotem(true);
    try {
      const result = await generateSpiritTotem({ rank: getOverallRank(state.lifts) });
      setTotem({ url: result.imageUrl, desc: result.description });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTotem(false);
    }
  };

  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="mb-8">
        <p className="eyebrow">Power Metrics</p>
        <h1 className="hero-title">Iron <span className="text-accent">HUD</span></h1>
      </header>

      <section className="mb-10">
        <h3 className="section-header">Athlete Spirit Totem</h3>
        <Card className="p-6 glass-card overflow-hidden relative">
          <div className="scanline" />
          {!totem ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent/40 mx-auto">
                <ImageIcon className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="font-headline text-2xl uppercase italic">Visual Identity Locked</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest max-w-[220px] mx-auto">Generate a unique AI spirit totem to anchor your athlete profile.</p>
              </div>
              <button 
                onClick={handleGenerateTotem}
                disabled={isGeneratingTotem}
                className="bg-accent text-accent-foreground px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-[2px] shadow-[0_0_30px_rgba(232,255,58,0.2)] flex items-center gap-2 mx-auto active:scale-95 transition-all"
              >
                {isGeneratingTotem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Invoke Identity
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-500">
              <div className="relative aspect-square w-full max-w-[220px] mx-auto rounded-3xl overflow-hidden border-2 border-accent/20 shadow-[0_0_40px_rgba(232,255,58,0.1)]">
                <Image src={totem.url} alt="Spirit Totem" fill className="object-cover" />
              </div>
              <div className="text-center space-y-2">
                <h4 className="font-headline text-3xl text-accent uppercase italic">Spirit Form Manifested</h4>
                <p className="text-xs italic text-muted-foreground font-medium px-4 leading-relaxed">{totem.desc}</p>
                <button 
                  onClick={handleGenerateTotem}
                  disabled={isGeneratingTotem}
                  className="mt-4 text-[9px] font-black uppercase tracking-[3px] text-muted-foreground hover:text-accent transition-colors"
                >
                  Regenerate Telemetry
                </button>
              </div>
            </div>
          )}
        </Card>
      </section>

      <section className="mb-10">
        <h3 className="section-header">Strength Balance HUD</h3>
        <Card className="p-4 glass-card h-[280px] flex items-center justify-center relative overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 9, fontWeight: '900', letterSpacing: '1px' }} />
              <Radar
                name="Athlete"
                dataKey="A"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent))"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <section className="mb-10">
        <h3 className="section-header">Mass Telemetry</h3>
        <Card className="p-5 glass-card">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Weight Trend</span>
            </div>
            <div className="font-headline text-2xl italic">{state.settings.bodyweight} {state.settings.unit}</div>
          </div>
          <div className="h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory.length > 0 ? weightHistory : [{weight: 180}, {weight: 182}, {weight: 181}, {weight: 184}]}>
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-2xl">
                          {payload[0].value} {state.settings.unit}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="mb-10">
        <h3 className="section-header">Tactical Records</h3>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(state.lifts).map(([name, data]) => {
            const thresholds = THRESHOLDS[name as keyof typeof THRESHOLDS];
            const rank = getLiftRank(name, data.pr);
            const { pct, nextLabel, toNext } = getLiftProgress(name, data.pr);
            const sparklineData = (data.history || []).map(h => ({ val: h.weight }));
            
            return (
              <Card key={name} className="p-5 glass-card hover:border-accent/40 transition-all group overflow-hidden relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">{name}</div>
                    <div className="font-headline text-4xl leading-none group-hover:text-accent transition-colors italic">
                      {data.pr || '—'} <span className="text-[10px] font-sans text-muted-foreground font-black uppercase tracking-widest">{data.pr > 0 ? 'lb' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest rank-${rank.toLowerCase()} shadow-xl`}>
                      {rank}
                    </span>
                    {sparklineData.length > 1 && (
                      <div className="h-6 w-16 opacity-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sparklineData}>
                            <Line type="monotone" dataKey="val" stroke="currentColor" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
                
                {thresholds && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground/60 flex items-center gap-1"><Target className="w-3 h-3" /> Chasing {nextLabel}</span>
                      <span className="text-accent">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-background/50" />
                    <div className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-widest flex justify-between">
                      {toNext > 0 ? (
                        <>
                          <span>Current: {rank}</span>
                          <span>{toNext} lb Deficit</span>
                        </>
                      ) : (
                        <span className="text-accent">MAX PROTOCOL ACHIEVED</span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <h3 className="section-header">Mission Log</h3>
        <div className="space-y-3">
          {state.workoutLogs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
              <History className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[3px]">Awaiting Deployment Data</p>
            </div>
          ) : (
            state.workoutLogs.map(log => (
              <Card key={log.id} className="p-4 bg-white/5 border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-accent uppercase tracking-[2px] mb-1">{log.name}</div>
                  <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{new Date(log.date).toLocaleDateString()} · {log.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-headline text-2xl italic leading-none">{log.volume} <span className="text-[9px] font-sans text-muted-foreground">LB</span></div>
                  <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">{log.sets} SETS RECORDED</div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
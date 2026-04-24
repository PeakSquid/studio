
"use client";

import React, { useState } from 'react';
import { IronState } from '@/types/iron';
import { THRESHOLDS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { getLiftRank, getLiftProgress, getOverallRank, getRadarData } from '@/lib/iron-utils';
import { generateSpiritTotem } from '@/ai/flows/generate-totem-flow';
import { Loader2, Sparkles, Image as ImageIcon, TrendingUp, Scale, History } from 'lucide-react';
import Image from 'next/image';

type LiftsTabProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function LiftsTab({ state }: LiftsTabProps) {
  const [isGeneratingTotem, setIsGeneratingTotem] = useState(false);
  const [totem, setTotem] = useState<{ url: string; desc: string } | null>(null);

  const radarData = getRadarData(state.lifts);
  const weightHistory = state.settings.weightHistory || [];

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
        <h1 className="hero-title">Iron <span className="text-accent">Profile</span></h1>
      </header>

      {/* Spirit Totem Section */}
      <section className="mb-10">
        <h3 className="section-header">Athlete Spirit Totem</h3>
        <Card className="p-6 bg-secondary/30 border-border overflow-hidden relative">
          {!totem ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto">
                <ImageIcon className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-headline text-2xl uppercase">Identity Unidentified</h4>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Generate a unique AI spirit totem based on your current strength rank.</p>
              </div>
              <button 
                onClick={handleGenerateTotem}
                disabled={isGeneratingTotem}
                className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(232,255,58,0.2)] flex items-center gap-2 mx-auto"
              >
                {isGeneratingTotem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Invoke Totem
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-500">
              <div className="relative aspect-square w-full max-w-[240px] mx-auto rounded-3xl overflow-hidden border-2 border-accent/30 shadow-[0_0_40px_rgba(232,255,58,0.1)]">
                <Image src={totem.url} alt="Spirit Totem" fill className="object-cover" />
              </div>
              <div className="text-center">
                <h4 className="font-headline text-2xl text-accent mb-1 uppercase">Spirit Identity Formed</h4>
                <p className="text-sm italic text-muted-foreground">{totem.desc}</p>
                <button 
                  onClick={handleGenerateTotem}
                  disabled={isGeneratingTotem}
                  className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
                >
                  Regenerate Telemetry
                </button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Radar Chart Section */}
      <section className="mb-10">
        <h3 className="section-header">Strength Balance HUD</h3>
        <Card className="p-4 bg-secondary/30 border-border h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
              <Radar
                name="Athlete"
                dataKey="A"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent))"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Bodyweight Trend */}
      <section className="mb-10">
        <h3 className="section-header">Mass Telemetry</h3>
        <Card className="p-5 bg-secondary/40 border-border">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-accent" />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Weight Trend</span>
            </div>
            <div className="text-lg font-headline">{state.settings.bodyweight} {state.settings.unit}</div>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory.length > 0 ? weightHistory : [{weight: 180}, {weight: 182}, {weight: 181}, {weight: 184}]}>
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border p-2 rounded-lg text-[10px] font-black uppercase">
                          {payload[0].value} lb
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
        <h3 className="section-header">Personal Records</h3>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(state.lifts).map(([name, data]) => {
            const thresholds = THRESHOLDS[name as keyof typeof THRESHOLDS];
            const rank = getLiftRank(name, data.pr);
            const { pct, nextLabel, toNext } = getLiftProgress(name, data.pr);
            const sparklineData = (data.history || []).map(h => ({ val: h.weight }));
            
            return (
              <Card key={name} className="p-5 bg-secondary/40 border-border hover:border-accent/30 transition-all group overflow-hidden relative">
                <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">{name}</div>
                    <div className="font-headline text-4xl leading-none group-hover:text-accent transition-colors">
                      {data.pr || '—'} <span className="text-sm font-sans text-muted-foreground font-medium uppercase">{data.pr > 0 ? 'lb' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest rank-${rank.toLowerCase()}`}>
                      {rank}
                    </span>
                    {sparklineData.length > 1 && (
                      <div className="h-6 w-16 mt-2 ml-auto opacity-50">
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
                    <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-tighter">
                      <span className="text-muted-foreground">To {nextLabel}</span>
                      <span className="text-accent">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-background" />
                    <div className="text-[10px] text-muted-foreground font-medium flex justify-between">
                      {toNext > 0 ? (
                        <>
                          <span>Current: {rank}</span>
                          <span>{toNext} lb deficit</span>
                        </>
                      ) : (
                        <span className="text-accent">MAX TIER ACHIEVED</span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Mission History */}
      <section className="mb-10">
        <h3 className="section-header">Mission History</h3>
        <div className="space-y-3">
          {state.workoutLogs.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
              <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No deployments logged</p>
            </div>
          ) : (
            state.workoutLogs.map(log => (
              <Card key={log.id} className="p-4 bg-secondary/30 border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-accent uppercase tracking-widest mb-0.5">{log.name}</div>
                  <div className="text-[9px] text-muted-foreground font-bold">{new Date(log.date).toLocaleDateString()} · {log.type.toUpperCase()}</div>
                </div>
                <div className="text-right">
                  <div className="font-headline text-2xl">{log.volume} <span className="text-[9px] font-sans text-muted-foreground">LB</span></div>
                  <div className="text-[9px] font-black text-muted-foreground uppercase">{log.sets} SETS</div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

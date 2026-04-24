"use client";

import React, { useState, useMemo } from 'react';
import { IronState } from '@/types/iron';
import { THRESHOLDS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { getLiftRank, getLiftProgress, getOverallRank, getRadarData } from '@/lib/iron-utils';
import { generateSpiritTotem } from '@/ai/flows/generate-totem-flow';
import { generateHypeVideo } from '@/ai/flows/generate-hype-video-flow';
import { Loader2, Sparkles, Image as ImageIcon, Scale, History, Target, Zap, Play, Film } from 'lucide-react';
import Image from 'next/image';

type LiftsTabProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function LiftsTab({ state }: LiftsTabProps) {
  const [isGeneratingTotem, setIsGeneratingTotem] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [totem, setTotem] = useState<{ url: string; desc: string } | null>(null);
  const [hypeVideo, setHypeVideo] = useState<string | null>(null);

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

  const handleGenerateHypeVideo = async () => {
    if (!totem) return;
    setIsGeneratingVideo(true);
    try {
      const result = await generateHypeVideo({ 
        rank: getOverallRank(state.lifts),
        totemDescription: totem.desc
      });
      setHypeVideo(result.videoUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="mb-8">
        <p className="eyebrow">Power Metrics</p>
        <h1 className="hero-title text-6xl">Iron <span className="text-accent">HUD</span></h1>
      </header>

      <section className="mb-12">
        <h3 className="section-header">Athlete Identity Matrix</h3>
        <Card className="p-8 glass-card overflow-hidden relative group">
          <div className="scanline" />
          {!totem ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-24 h-24 rounded-[32px] bg-accent/5 border border-accent/10 flex items-center justify-center text-accent/20 mx-auto group-hover:bg-accent/10 transition-colors">
                <ImageIcon className="w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h4 className="font-headline text-3xl uppercase italic tracking-tighter">Manifest Identity</h4>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[2px] max-w-[240px] mx-auto leading-relaxed">Invoke a unique AI spirit totem to anchor your biomechanical profile.</p>
              </div>
              <button 
                onClick={handleGenerateTotem}
                disabled={isGeneratingTotem}
                className="bg-accent text-accent-foreground px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[3px] shadow-[0_0_40px_rgba(232,255,58,0.2)] flex items-center gap-3 mx-auto active:scale-95 transition-all hover:shadow-[0_0_50px_rgba(232,255,58,0.4)]"
              >
                {isGeneratingTotem ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Invoke Identity
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in-95 duration-700">
              <div className="relative aspect-square w-full max-w-[260px] mx-auto rounded-[40px] overflow-hidden border-2 border-accent/20 shadow-[0_0_60px_rgba(232,255,58,0.15)] bg-black/40">
                {hypeVideo ? (
                  <video src={hypeVideo} autoPlay loop muted className="w-full h-full object-cover" />
                ) : (
                  <Image src={totem.url} alt="Spirit Totem" fill className="object-cover" />
                )}
                {isGeneratingVideo && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 className="w-10 h-10 text-accent animate-spin mb-3" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-accent">Generating Cinematic Hype Reel (Veo 3.0)...</p>
                  </div>
                )}
              </div>
              <div className="text-center space-y-4">
                <h4 className="font-headline text-4xl text-accent uppercase italic tracking-tighter">Form Manifested</h4>
                <p className="text-xs italic text-muted-foreground font-medium px-6 leading-relaxed max-w-sm mx-auto">"{totem.desc}"</p>
                
                <div className="flex flex-col gap-2 pt-4">
                  {!hypeVideo ? (
                    <button 
                      onClick={handleGenerateHypeVideo}
                      disabled={isGeneratingVideo}
                      className="bg-secondary text-foreground border border-border px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[2px] flex items-center gap-3 mx-auto active:scale-95 transition-all"
                    >
                      {isGeneratingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                      Generate Hype Reel
                    </button>
                  ) : (
                    <button 
                      onClick={() => setHypeVideo(null)}
                      className="text-[9px] font-black uppercase tracking-[2px] text-muted-foreground hover:text-accent"
                    >
                      Back to Static Totem
                    </button>
                  )}
                  
                  <button 
                    onClick={handleGenerateTotem}
                    disabled={isGeneratingTotem || isGeneratingVideo}
                    className="text-[9px] font-black uppercase tracking-[4px] text-muted-foreground/30 hover:text-accent transition-colors mt-2"
                  >
                    Reset Identity Telemetry
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      <section className="mb-12">
        <h3 className="section-header">Strength Balance Radar</h3>
        <Card className="p-6 glass-card h-[320px] flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-accent/[0.02] pointer-events-none" />
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: '900', letterSpacing: '2px' }} />
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

      <section className="mb-12">
        <h3 className="section-header">Mass Telemetry</h3>
        <Card className="p-6 glass-card group">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="hud-label">Weight Trend</span>
                <p className="text-[10px] font-bold text-muted-foreground">LAST 30 DAYS</p>
              </div>
            </div>
            <div className="font-headline text-4xl italic tracking-tighter">{state.settings.bodyweight} <span className="text-xs font-sans not-italic text-muted-foreground">{state.settings.unit}</span></div>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory.length > 0 ? weightHistory : [{weight: 180}, {weight: 182}, {weight: 181}, {weight: 184}]}>
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--accent))" strokeWidth={4} dot={false} strokeDasharray="6 6" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[2px] shadow-2xl">
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

      <section className="mb-12">
        <h3 className="section-header">Tactical Records</h3>
        <div className="grid grid-cols-1 gap-5">
          {Object.entries(state.lifts).map(([name, data]) => {
            const thresholds = THRESHOLDS[name as keyof typeof THRESHOLDS];
            const rank = getLiftRank(name, data.pr);
            const { pct, nextLabel, toNext } = getLiftProgress(name, data.pr);
            const sparklineData = (data.history || []).map(h => ({ val: h.weight }));
            
            return (
              <Card key={name} className="p-6 glass-card hover:border-accent/50 transition-all group overflow-hidden relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="hud-label mb-2">{name}</div>
                    <div className="font-headline text-5xl leading-none group-hover:text-accent transition-colors italic tracking-tighter">
                      {data.pr || '—'} <span className="text-[11px] font-sans text-muted-foreground font-black uppercase tracking-widest">{data.pr > 0 ? 'lb' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-3">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[3px] rank-${rank.toLowerCase()} shadow-xl border border-white/10`}>
                      {rank}
                    </span>
                    {sparklineData.length > 1 && (
                      <div className="h-8 w-20 opacity-30 group-hover:opacity-60 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sparklineData}>
                            <Line type="monotone" dataKey="val" stroke="currentColor" strokeWidth={3} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
                
                {thresholds && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-[2px]">
                      <span className="text-muted-foreground/60 flex items-center gap-2 group-hover:text-accent/60 transition-colors">
                        <Target className="w-3.5 h-3.5" /> Chasing {nextLabel}
                      </span>
                      <span className="text-accent">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2 bg-background/50" />
                    <div className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[3px] flex justify-between">
                      {toNext > 0 ? (
                        <>
                          <span>Current Tier: {rank}</span>
                          <span className="text-accent/50">{toNext} lb DEFICIT</span>
                        </>
                      ) : (
                        <span className="text-accent flex items-center gap-2"><Zap className="w-3 h-3" /> MAX PROTOCOL ACHIEVED</span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="section-header">Mission Log</h3>
        <div className="space-y-4">
          {state.workoutLogs.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
              <History className="w-10 h-10 text-muted-foreground/10 mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-[4px]">Awaiting Deployment Data</p>
            </div>
          ) : (
            state.workoutLogs.map(log => (
              <Card key={log.id} className="p-5 bg-white/5 border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors group">
                <div>
                  <div className="text-[11px] font-black text-accent uppercase tracking-[3px] mb-1.5 group-hover:tracking-[4px] transition-all">{log.name}</div>
                  <div className="text-[9px] text-muted-foreground font-black uppercase tracking-[2px]">{new Date(log.date).toLocaleDateString()} · {log.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-headline text-3xl italic leading-none">{log.volume} <span className="text-[10px] font-sans text-muted-foreground not-italic tracking-normal">LB</span></div>
                  <div className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[2px] mt-1.5">{log.sets} SETS RECORDED</div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

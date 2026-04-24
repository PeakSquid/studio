"use client";

import React, { useState } from 'react';
import { IronState } from '@/types/iron';
import { THRESHOLDS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { getLiftRank, getLiftProgress, getOverallRank } from '@/lib/iron-utils';
import { generateSpiritTotem } from '@/ai/flows/generate-totem-flow';
import { Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

type LiftsTabProps = {
  state: IronState;
  updateState: (updater: (prev: IronState) => IronState) => void;
};

export default function LiftsTab({ state }: LiftsTabProps) {
  const [isGeneratingTotem, setIsGeneratingTotem] = useState(false);
  const [totem, setTotem] = useState<{ url: string; desc: string } | null>(null);

  const chartData = Object.entries(state.lifts).map(([name, data]) => ({
    name: name.split(' ')[0],
    fullName: name,
    weight: data.pr,
    rank: getLiftRank(name, data.pr)
  }));

  const rankColors: Record<string, string> = {
    Bronze: '#CD7F32',
    Silver: '#C0C0C0',
    Gold: '#FFD700',
    Elite: '#A855F7'
  };

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

      {/* Distribution Chart */}
      <section className="mb-10">
        <h3 className="section-header">Max Capacity Profile</h3>
        <Card className="p-4 bg-secondary/30 border-border h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 800, fill: '#666' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#666' }} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border p-3 rounded-xl shadow-2xl">
                        <div className="text-[10px] font-black uppercase text-muted-foreground">{data.fullName}</div>
                        <div className="font-headline text-2xl leading-none text-accent">{data.weight} lb</div>
                        <div className="text-[9px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded inline-block" style={{ backgroundColor: rankColors[data.rank], color: data.rank === 'Silver' || data.rank === 'Gold' ? '#000' : '#fff' }}>
                          {data.rank} Rank
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={rankColors[entry.rank]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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

      <section className="mb-10">
        <h3 className="section-header">Rank Standards</h3>
        <Card className="p-6 bg-secondary/30 border-border space-y-6">
          <RankTier icon="🥉" name="Bronze" color="#CD7F32" desc="Base Tier. Focus on structural integrity and fundamental movement mechanics." />
          <RankTier icon="🥈" name="Silver" color="#C0C0C0" desc="Intermediate Tier. Consistent linear progression and metabolic adaptation." />
          <RankTier icon="🥇" name="Gold" color="#FFD700" desc="Advanced Tier. Significant neurological efficiency and force production." />
          <RankTier icon="⚡" name="Elite" color="#A855F7" desc="Supreme Tier. Peak human strength standards for non-competitive lifters." />
        </Card>
      </section>
    </div>
  );
}

function RankTier({ icon, name, color, desc }: { icon: string; name: string; color: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-headline text-xl leading-none mb-1" style={{ color }}>{name}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

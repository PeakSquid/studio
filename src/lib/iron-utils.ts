import { THRESHOLDS } from './constants';
import { IronState, LiftData } from '@/types/iron';

export function getLiftRank(lift: string, weight: number): string {
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  let rank = 'Bronze';
  for (const t of tiers) {
    if (weight >= t.min) rank = t.r;
  }
  return rank;
}

export function getOverallRank(lifts: Record<string, LiftData>): string {
  if (!lifts || typeof lifts !== 'object') return 'Bronze';
  const ranks = ['Bronze', 'Silver', 'Gold', 'Elite'];
  const all = Object.entries(lifts).map(([l, d]) => getLiftRank(l, d?.pr || 0));
  const c: Record<string, number> = { Bronze: 0, Silver: 0, Gold: 0, Elite: 0 };
  all.forEach(r => { if (c[r] !== undefined) c[r]++; });
  
  if (c.Elite >= 4) return 'Elite';
  if (c.Gold >= 4) return 'Gold';
  if (c.Silver >= 3) return 'Silver';
  return 'Bronze';
}

export function getOverallRankProgress(lifts: Record<string, LiftData>) {
  const currentRank = getOverallRank(lifts);
  const ranks = ['Bronze', 'Silver', 'Gold', 'Elite'];
  const nextRank = ranks[ranks.indexOf(currentRank) + 1];
  
  if (!nextRank || !lifts) return { currentRank, nextRank: 'MAX', progress: 100, remaining: 0 };

  let totalRequired = 0;
  let currentCount = 0;

  if (nextRank === 'Silver') {
    totalRequired = 3;
    currentCount = Object.values(lifts).filter(l => ranks.indexOf(getLiftRank('Bench Press', l?.pr || 0)) >= 1).length;
  } else if (nextRank === 'Gold') {
    totalRequired = 4;
    currentCount = Object.values(lifts).filter(l => ranks.indexOf(getLiftRank('Bench Press', l?.pr || 0)) >= 2).length;
  } else if (nextRank === 'Elite') {
    totalRequired = 4;
    currentCount = Object.values(lifts).filter(l => ranks.indexOf(getLiftRank('Bench Press', l?.pr || 0)) >= 3).length;
  }

  return {
    currentRank,
    nextRank,
    progress: Math.min(Math.round((currentCount / Math.max(totalRequired, 1)) * 100), 99),
    remaining: Math.max(totalRequired - currentCount, 0)
  };
}

export function getNearestMilestone(lifts: Record<string, LiftData>) {
  if (!lifts) return null;
  let nearest = null;
  let minDiff = Infinity;

  for (const [name, data] of Object.entries(lifts)) {
    const { toNext, nextLabel } = getLiftProgress(name, data?.pr || 0);
    if (toNext > 0 && toNext < minDiff) {
      minDiff = toNext;
      nearest = { name, toNext, nextLabel };
    }
  }
  return nearest;
}

export function getLiftProgress(lift: string, weight: number) {
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  if (tiers.length === 0) return { pct: 0, nextLabel: '', toNext: 0 };

  for (let i = tiers.length - 1; i >= 0; i--) {
    if (weight >= tiers[i].min) {
      const next = tiers[i + 1];
      if (!next) return { pct: 100, nextLabel: '', toNext: 0 };
      const range = next.min - tiers[i].min;
      const pct = range > 0 ? Math.round(((weight - tiers[i].min) / range) * 100) : 100;
      return { pct: Math.min(pct, 100), nextLabel: next.r, toNext: next.min - weight };
    }
  }
  return { pct: 0, nextLabel: tiers[0].r, toNext: tiers[0].min - weight };
}

export function calculatePlates(targetWeight: number, barWeight: number = 45) {
  const availablePlates = [45, 25, 10, 5, 2.5];
  let remainingWeight = (targetWeight - barWeight) / 2;
  const result: Record<number, number> = {};

  if (remainingWeight <= 0) return {};

  for (const plate of availablePlates) {
    const count = Math.floor(remainingWeight / plate);
    if (count > 0) {
      result[plate] = count;
      remainingWeight = Number((remainingWeight - count * plate).toFixed(2));
    }
  }

  return result;
}

export function getRadarData(lifts: Record<string, LiftData>) {
  if (!lifts || typeof lifts !== 'object') return [];
  return Object.entries(lifts).map(([name, data]) => {
    const tiers = THRESHOLDS[name as keyof typeof THRESHOLDS] || [];
    const eliteMax = tiers[tiers.length - 1]?.min || 500;
    return {
      subject: name.split(' ')[0],
      A: eliteMax > 0 ? Math.min(Math.round(((data?.pr || 0) / eliteMax) * 100), 100) : 0,
      fullMark: 100,
    };
  });
}

export function getCNSFatigue(streak: number, activity: number[]) {
  const safeActivity = activity || [];
  const recentWorkouts = safeActivity.slice(-7).filter(a => a === 2).length;
  let load = recentWorkouts * 15 + (streak || 0) * 5;
  return Math.min(load, 100);
}

export function getAthleteLevel(xp: number) {
  const safeXp = Math.max(xp || 0, 0);
  const level = Math.floor(Math.sqrt(safeXp / 100)) + 1;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const range = nextLevelXp - currentLevelXp;
  const progress = range > 0 ? Math.round(((safeXp - currentLevelXp) / range) * 100) : 100;
  
  return { level, progress, nextLevelXp };
}

export function getDailyObjective(state: IronState) {
  const safeLifts = state.lifts || {};
  const rank = getOverallRank(safeLifts);
  const baseVolume = rank === 'Elite' ? 8000 : rank === 'Gold' ? 6000 : rank === 'Silver' ? 4000 : 2500;
  const multiplier = 1 + ((state.streak || 0) * 0.05);
  const targetVolume = Math.round(baseVolume * multiplier);
  
  return {
    targetVolume,
    label: `Move ${targetVolume.toLocaleString()}lb Iron`,
    type: 'Volume Mission'
  };
}

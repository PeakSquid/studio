import { THRESHOLDS } from './constants';
import { IronState, LiftData } from '@/types/iron';

/**
 * Determines the rank of a specific lift based on weight.
 * Hardened with full null-checking and defensive baselines.
 */
export function getLiftRank(lift: string, weight: number): string {
  if (!lift || typeof weight !== 'number') return 'Bronze';
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  let rank = 'Bronze';
  for (const t of tiers) {
    if (weight >= t.min) rank = t.r;
  }
  return rank;
}

/**
 * Calculates the overall athlete rank based on all lifts.
 */
export function getOverallRank(lifts: Record<string, LiftData>): string {
  if (!lifts || typeof lifts !== 'object') return 'Bronze';
  
  const allRanks = Object.entries(lifts).map(([name, data]) => {
    const weight = typeof data === 'number' ? data : data?.pr || 0;
    return getLiftRank(name, weight);
  });
  
  const counts: Record<string, number> = { Bronze: 0, Silver: 0, Gold: 0, Elite: 0 };
  allRanks.forEach(r => { if (counts[r] !== undefined) counts[r]++; });
  
  if (counts.Elite >= 4) return 'Elite';
  if (counts.Gold >= 4) return 'Gold';
  if (counts.Silver >= 3) return 'Silver';
  return 'Bronze';
}

/**
 * Calculates percentage progress for a specific lift.
 */
export function getLiftProgress(lift: string, weight: number) {
  if (!lift || typeof weight !== 'number') return { pct: 0, nextLabel: 'Bronze', toNext: 0 };
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  if (tiers.length === 0) return { pct: 0, nextLabel: 'Bronze', toNext: 0 };

  for (let i = tiers.length - 1; i >= 0; i--) {
    if (weight >= tiers[i].min) {
      const next = tiers[i + 1];
      if (!next) return { pct: 100, nextLabel: 'MAX', toNext: 0 };
      const range = next.min - tiers[i].min;
      const pct = range > 0 ? Math.round(((weight - tiers[i].min) / range) * 100) : 100;
      return { pct: Math.min(pct, 100), nextLabel: next.r, toNext: next.min - weight };
    }
  }
  return { pct: 0, nextLabel: tiers[0]?.r || 'Bronze', toNext: (tiers[0]?.min || 0) - weight };
}

/**
 * Calculates weight plate requirements.
 */
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

/**
 * Formats lift data for the radar HUD.
 */
export function getRadarData(lifts: Record<string, LiftData>) {
  if (!lifts || typeof lifts !== 'object') return [];
  return Object.entries(lifts).map(([name, data]) => {
    const tiers = THRESHOLDS[name as keyof typeof THRESHOLDS] || [];
    const eliteMax = tiers[tiers.length - 1]?.min || 500;
    const weight = typeof data === 'number' ? data : data?.pr || 0;
    return {
      subject: name.split(' ')[0],
      A: eliteMax > 0 ? Math.min(Math.round((weight / eliteMax) * 100), 100) : 0,
      fullMark: 100,
    };
  });
}

/**
 * Calculates CNS fatigue levels.
 */
export function getCNSFatigue(streak: number, activity: number[]) {
  const safeActivity = Array.isArray(activity) ? activity : [];
  const recentWorkouts = safeActivity.slice(-7).filter(a => a === 2).length;
  let load = (recentWorkouts * 15) + ((streak || 0) * 5);
  return Math.min(load, 100);
}

/**
 * Calculates athlete experience levels.
 */
export function getAthleteLevel(xp: number) {
  const safeXp = Math.max(xp || 0, 0);
  const level = Math.floor(Math.sqrt(safeXp / 100)) + 1;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const range = nextLevelXp - currentLevelXp;
  const progress = range > 0 ? Math.round(((safeXp - currentLevelXp) / range) * 100) : 100;
  
  return { level, progress, nextLevelXp };
}

/**
 * Generates a daily training objective.
 */
export function getDailyObjective(state: IronState) {
  if (!state) return { targetVolume: 2500, label: 'Initialize Mission', type: 'Calibration' };
  
  const rank = getOverallRank(state.lifts || {});
  const baseVolume = rank === 'Elite' ? 8000 : rank === 'Gold' ? 6000 : rank === 'Silver' ? 4000 : 2500;
  const multiplier = 1 + ((state.streak || 0) * 0.05);
  const targetVolume = Math.round(baseVolume * multiplier);
  
  return {
    targetVolume,
    label: `Move ${targetVolume.toLocaleString()}lb Iron`,
    type: 'Volume Mission'
  };
}

/**
 * Calculates weekly tonnage progress.
 */
export function getWeeklyTonnage(workoutLogs: any[]) {
  if (!workoutLogs || !Array.isArray(workoutLogs)) return 0;
  
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  return workoutLogs
    .filter(log => log && log.date && new Date(log.date) >= monday)
    .reduce((sum, log) => sum + (log.volume || 0), 0);
}

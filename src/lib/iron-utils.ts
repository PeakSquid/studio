import { THRESHOLDS } from './constants';
import { IronState, LiftData } from '@/types/iron';

/**
 * Determines the rank of a specific lift based on weight.
 * Hardened with defensive checks for lift name and weight.
 */
export function getLiftRank(lift: string, weight: number): string {
  if (!lift) return 'Bronze';
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  let rank = 'Bronze';
  const safeWeight = weight || 0;
  for (const t of tiers) {
    if (safeWeight >= t.min) rank = t.r;
  }
  return rank;
}

/**
 * Calculates the overall athlete rank based on all lifts.
 * Hardened with deep null/type checking for telemetry record.
 */
export function getOverallRank(lifts: Record<string, LiftData>): string {
  if (!lifts || typeof lifts !== 'object') return 'Bronze';
  
  const ranks = ['Bronze', 'Silver', 'Gold', 'Elite'];
  const allRanks = Object.entries(lifts).map(([name, data]) => getLiftRank(name, data?.pr || 0));
  
  const counts: Record<string, number> = { Bronze: 0, Silver: 0, Gold: 0, Elite: 0 };
  allRanks.forEach(r => { if (counts[r] !== undefined) counts[r]++; });
  
  if (counts.Elite >= 4) return 'Elite';
  if (counts.Gold >= 4) return 'Gold';
  if (counts.Silver >= 3) return 'Silver';
  return 'Bronze';
}

/**
 * Calculates progress toward the next overall rank.
 * Fixed logic bug: Now correctly checks specific lift ranks during progress evaluation.
 */
export function getOverallRankProgress(lifts: Record<string, LiftData>) {
  const currentRank = getOverallRank(lifts);
  const ranks = ['Bronze', 'Silver', 'Gold', 'Elite'];
  const nextRank = ranks[ranks.indexOf(currentRank) + 1];
  
  if (!nextRank || !lifts || typeof lifts !== 'object') {
    return { currentRank, nextRank: 'MAX', progress: 100, remaining: 0 };
  }

  let totalRequired = 0;
  let currentCount = 0;

  // Next rank criteria:
  // Silver: 3 lifts at Silver or higher
  // Gold: 4 lifts at Gold or higher
  // Elite: 4 lifts at Elite or higher
  if (nextRank === 'Silver') {
    totalRequired = 3;
    currentCount = Object.entries(lifts).filter(([name, data]) => {
      const rank = getLiftRank(name, data?.pr || 0);
      return ranks.indexOf(rank) >= 1;
    }).length;
  } else if (nextRank === 'Gold') {
    totalRequired = 4;
    currentCount = Object.entries(lifts).filter(([name, data]) => {
      const rank = getLiftRank(name, data?.pr || 0);
      return ranks.indexOf(rank) >= 2;
    }).length;
  } else if (nextRank === 'Elite') {
    totalRequired = 4;
    currentCount = Object.entries(lifts).filter(([name, data]) => {
      const rank = getLiftRank(name, data?.pr || 0);
      return ranks.indexOf(rank) >= 3;
    }).length;
  }

  return {
    currentRank,
    nextRank,
    progress: Math.min(Math.round((currentCount / Math.max(totalRequired, 1)) * 100), 99),
    remaining: Math.max(totalRequired - currentCount, 0)
  };
}

/**
 * Identifies the lift nearest to its next biometric tier.
 */
export function getNearestMilestone(lifts: Record<string, LiftData>) {
  if (!lifts || typeof lifts !== 'object') return null;
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

/**
 * Calculates percentage progress for a specific lift.
 */
export function getLiftProgress(lift: string, weight: number) {
  if (!lift) return { pct: 0, nextLabel: '', toNext: 0 };
  const tiers = THRESHOLDS[lift as keyof typeof THRESHOLDS] || [];
  if (tiers.length === 0) return { pct: 0, nextLabel: '', toNext: 0 };

  const safeWeight = weight || 0;

  for (let i = tiers.length - 1; i >= 0; i--) {
    if (safeWeight >= tiers[i].min) {
      const next = tiers[i + 1];
      if (!next) return { pct: 100, nextLabel: '', toNext: 0 };
      const range = next.min - tiers[i].min;
      const pct = range > 0 ? Math.round(((safeWeight - tiers[i].min) / range) * 100) : 100;
      return { pct: Math.min(pct, 100), nextLabel: next.r, toNext: next.min - safeWeight };
    }
  }
  return { pct: 0, nextLabel: tiers[0].r, toNext: tiers[0].min - safeWeight };
}

/**
 * Calculates weight plate requirements for a given load.
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
    return {
      subject: name.split(' ')[0],
      A: eliteMax > 0 ? Math.min(Math.round(((data?.pr || 0) / eliteMax) * 100), 100) : 0,
      fullMark: 100,
    };
  });
}

/**
 * Calculates CNS fatigue levels.
 */
export function getCNSFatigue(streak: number, activity: number[]) {
  const safeActivity = activity || [];
  const recentWorkouts = safeActivity.slice(-7).filter(a => a === 2).length;
  let load = recentWorkouts * 15 + (streak || 0) * 5;
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
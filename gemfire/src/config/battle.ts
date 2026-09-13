import type { Approach } from '@/core/domain/BattleUnit';
import type { RangePattern } from '@/core/domain/Unit';

export const DEPLOYMENT_TROOPS_PER_GOLD = 8;
export const DEPLOYMENT_BASE_GOLD = 10;

export const DAILY_FOOD_PER_STRENGTH = 10;
export const DAILY_FOOD_BASE = 1;

export const BATTLE_DAY_LIMIT = 5;

export const WAR_LEVERAGE = 0.5;
export const MAX_WAR = 100;

export const GEM_REST_MONTHS = 3;
export const GEM_REST_MONTHS_DEFEATED = 5;

export const FENCE_ODDS_BASE = 0.4;
export const FENCE_ODDS_PER_STRENGTH = 0.005;
export const FENCE_ODDS_FLOOR = 0.3;
export const FENCE_ODDS_CEILING = 0.9;

export const BLOW_RATE = 0.25;
export const BACKLASH_RATE = 0.2;

export const BLOW_WEIGHT: Readonly<Record<Approach, number>> = {
  front: 1,
  flank: 1.4,
  rear: 2,
};

export const RETALIATION: Readonly<Record<Approach, number>> = {
  front: 1,
  flank: 0.6,
  rear: 0.3,
};

export const RANGE_WEIGHT: Readonly<Record<RangePattern, number>> = {
  short: 1,
  long: 0.6,
  circular: 1,
  largest: 1,
};

import type { BattleSide } from '@/core/domain/BattleOutcome';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import type { Facing } from '@/core/domain/Facing';
import { compact } from '@/lib/array/compact';

const LIVERIES: Readonly<Record<BattleSide, string>> = {
  attacker: 'red',
  defender: 'blue',
};

export function unitPiece(
  unit: BattleUnit,
  facing: Facing = unit.facing,
): string {
  const parts = [
    unit.name.toLowerCase(),
    unit.hasLivery ? LIVERIES[unit.side] : undefined,
    facing.aspect,
  ];
  const name = compact(parts).join('-');

  return `/battle-unit/${name}.webp`;
}

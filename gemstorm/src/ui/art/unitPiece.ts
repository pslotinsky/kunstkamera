import { BattleSide } from '@/core/domain/BattleSide';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import type { Facing } from '@/core/domain/Facing';
import { compact } from '@/lib/array/compact';
import { getPublicAssetUrl } from '@/ui/art/getPublicAssetUrl';

const LIVERIES = new Map<BattleSide, string>([
  [BattleSide.attacker, 'red'],
  [BattleSide.defender, 'blue'],
]);

export function unitPiece(
  unit: BattleUnit,
  facing: Facing = unit.facing,
): string {
  const parts = [
    unit.name.toLowerCase(),
    unit.hasLivery ? LIVERIES.get(unit.side) : undefined,
    facing.aspect,
  ];
  const name = compact(parts).join('-');

  return getPublicAssetUrl(`battle-unit/${name}.webp`);
}

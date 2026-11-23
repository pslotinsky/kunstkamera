import { describe, expect, it } from 'vitest';

import { BattleSide } from '@/core/domain/BattleSide';
import { Facing } from '@/core/domain/Facing';

import { makeBattle } from './factories';

function setup() {
  const battle = makeBattle();
  const rider = battle.getUnits(BattleSide.attacker)[0]!;
  const start = rider.cell;
  const facing = rider.facing;
  const north = battle.field.getCell(start.column, start.row - 1)!;
  const further = battle.field.getCell(start.column + 1, start.row - 1)!;

  return { rider, start, facing, north, further };
}

describe('BattleUnit taking a move back', () => {
  it('returns to where and how it stood before the move', () => {
    const { rider, start, facing, north, further } = setup();

    rider.moveAlong([north]);
    rider.moveAlong([further]);
    rider.takeBackMove();

    expect(rider.cell).toBe(start);
    expect(rider.facing).toBe(facing);
    expect(rider.stepsTaken).toBe(0);
    expect(rider.hasActed).toBe(false);
  });

  it('cannot take back a move it has committed', () => {
    const { rider, north } = setup();

    rider.moveAlong([north]);
    rider.commitMove();
    rider.takeBackMove();

    expect(rider.cell).toBe(north);
    expect(rider.facing).toBe(Facing.north);
    expect(rider.stepsTaken).toBe(1);
  });

  it('forgets the move once its turn is over', () => {
    const { rider, north } = setup();

    rider.moveAlong([north]);
    rider.finishTurn();
    rider.refresh();
    rider.takeBackMove();

    expect(rider.cell).toBe(north);
  });

  it('does not carry a move it never finished into the next turn', () => {
    const { rider, north } = setup();

    rider.moveAlong([north]);
    rider.refresh();
    rider.takeBackMove();

    expect(rider.cell).toBe(north);
    expect(rider.canTakeBackMove).toBe(false);
  });
});

describe('BattleUnit identity', () => {
  it('is the same unit in another cell, as the AI sees it when looking ahead', () => {
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;
    const elsewhere = battle.field.getCell(4, 4)!;

    expect(rider.clone(elsewhere).isEqual(rider)).toBe(true);
  });

  it('tells apart units of the same kind and the two sides', () => {
    const battle = makeBattle();
    const [, knights, otherKnights] = battle.getUnits(BattleSide.attacker);
    const [defendingRider] = battle.getUnits(BattleSide.defender);
    const [rider] = battle.getUnits(BattleSide.attacker);

    expect(knights!.isEqual(otherKnights!)).toBe(false);
    expect(rider!.isEqual(defendingRider!)).toBe(false);
  });
});

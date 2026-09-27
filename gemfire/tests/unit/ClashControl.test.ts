// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { BattleSide } from '@/core/domain/BattleSide';
import { BattleUnit } from '@/core/domain/BattleUnit';
import { Cell } from '@/core/domain/Cell';
import { Clash } from '@/core/domain/Clash';
import { Facing } from '@/core/domain/Facing';
import { FifthUnit } from '@/core/domain/FifthUnit';
import { StandardUnit } from '@/core/domain/StandardUnit';
import type { Unit } from '@/core/domain/Unit';
import styles from '@/ui/BattleScreen/Clash/Clash.module.scss';
import { ClashControl } from '@/ui/BattleScreen/Clash/ClashControl';

import { makeGeneral } from './factories';

function muster(unit: Unit, strength: number, side: BattleSide) {
  return new BattleUnit({
    unit,
    side,
    commander: makeGeneral(),
    strength,
    cell: new Cell(side.isAttacker ? 0 : 1, 0, 'plains'),
    facing: Facing.east,
  });
}

function play(striker: BattleUnit, target: BattleUnit) {
  const container = document.createElement('div');
  const control = new ClashControl();

  control.mount(container);
  control.play(
    new Clash({ striker, target, approach: 'front', losses: 0, backlash: 0 }),
    () => {},
  );

  const figures = (corner: string) =>
    container.querySelectorAll(`[data-rank="${corner}"] .${styles.figure}`)
      .length;

  return { striker: figures('striker'), target: figures('target') };
}

describe('ClashControl', () => {
  const knights = StandardUnit.ofName('Knights')!;

  it('never draws more figures than the unit has troops', () => {
    expect(
      play(
        muster(knights, 5, BattleSide.attacker),
        muster(knights, 1, BattleSide.defender),
      ),
    ).toEqual({
      striker: 5,
      target: 1,
    });
  });

  it('draws a full block for a body of troops that can fill one', () => {
    expect(
      play(
        muster(knights, 48, BattleSide.attacker),
        muster(knights, 48, BattleSide.defender),
      ),
    ).toEqual({
      striker: 12,
      target: 12,
    });
  });

  it('draws a Guardian alone however strong it is', () => {
    const zendor = new FifthUnit({
      name: 'Zendor',
      move: 3,
      range: 'circular',
      description: 'the guardian of the Blanche gem',
      strength: 150,
    });

    expect(
      play(
        muster(knights, 48, BattleSide.attacker),
        muster(zendor, 150, BattleSide.defender),
      ),
    ).toEqual({
      striker: 12,
      target: 1,
    });
  });
});

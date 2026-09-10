// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { Battlefield } from '@/core/domain/Battlefield';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import styles from '@/ui/BattleScreen/BattleScreen.module.scss';
import { BattleScreenControl } from '@/ui/BattleScreen/BattleScreenControl';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

const LONDRE = 22;

function makeArmies() {
  const attacker = new Army({
    commander: makeGeneral({ name: 'Erin' }),
    troops: 156,
    food: 400,
  });
  const defender = new Army({
    commander: makeGeneral({ name: 'Eselred' }),
    troops: 200,
    food: 400,
  });

  return { attacker, defender };
}

function mountScreen() {
  const erin = makeGeneral({ name: 'Erin' });
  const mine = makeFamily({ name: 'Blanche', ruler: erin });
  const home = makeProvince({ number: 1, name: 'Rodale', family: mine });
  const { world, events } = makeWorld([home], mine);
  const control = new BattleScreenControl({ world, events });
  const container = document.createElement('div');

  control.mount(container);

  const root = container.querySelector<HTMLElement>(`.${styles.root}`)!;

  return { control, events, root };
}

describe('BattleScreenControl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays out of the way until a battle starts, then takes over', () => {
    const { control, root } = mountScreen();
    const { attacker, defender } = makeArmies();

    expect(root.classList.contains(styles.hidden!)).toBe(true);

    control.play(
      new Battle({
        attacker,
        defender,
        field: Battlefield.ofProvince(LONDRE),
      }),
    );

    expect(root.classList.contains(styles.hidden!)).toBe(false);
    expect(root.querySelectorAll('[data-column]')).toHaveLength(80);
    expect(root.querySelectorAll('[data-board] img')).toHaveLength(8);

    control.close();

    expect(root.classList.contains(styles.hidden!)).toBe(true);
  });

  it('reports the outcome when a unit reaches the enemy flag', () => {
    const { control, events, root } = mountScreen();
    const { attacker, defender } = makeArmies();
    const field = Battlefield.ofProvince(LONDRE);
    const battle = new Battle({ attacker, defender, field });

    let ended: BattleEndedEvent | undefined;
    events.subscribe(BattleEndedEvent, (event) => {
      ended = event;
    });

    const flag = field.defenderFlag;
    const doorstep = field.getCell(flag.column + 1, flag.row)!;
    const rider = battle.getUnits('attacker')[0]!;

    rider.moveAlong([doorstep]);
    rider.refresh();

    control.play(battle);

    const getCell = (column: number, row: number) =>
      root.querySelector<HTMLElement>(
        `[data-column="${column}"][data-row="${row}"]`,
      )!;

    getCell(doorstep.column, doorstep.row).click();
    getCell(flag.column, flag.row).click();

    // the piece walks the route before the battle settles
    vi.runAllTimers();

    expect(ended?.outcome.reason).toBe('flag');
    expect(ended?.outcome.isWonBy('attacker')).toBe(true);
  });

  it('holds the acting province turn open while the battle runs', () => {
    const erin = makeGeneral({ name: 'Erin' });
    const mine = makeFamily({ name: 'Blanche', ruler: erin });
    const seth = makeGeneral({ name: 'Seth' });
    const rival = makeFamily({ name: 'Lyle', ruler: seth });
    const source = makeProvince({
      number: 1,
      name: 'Rodale',
      neighbors: [LONDRE],
      family: mine,
      governor: erin,
      gold: 200,
      troops: 156,
      food: 300,
    });
    const target = makeProvince({
      number: LONDRE,
      name: 'Londre',
      neighbors: [1],
      family: rival,
      governor: seth,
      troops: 200,
      food: 300,
    });
    const { world, events } = makeWorld([source, target], mine);
    const command = new AttackCommand({ world, events });

    advanceTo(world, source);

    let started: BattleStartedEvent | undefined;
    events.subscribe(BattleStartedEvent, (event) => {
      started = event;
    });

    expect(command.suspendsTurn()).toBe(false);

    command.attackAt(
      target,
      new Army({ commander: erin, troops: 100, food: 120 }),
    );
    command.execute();

    expect(started).toBeDefined();
    expect(command.suspendsTurn()).toBe(true);
  });
});

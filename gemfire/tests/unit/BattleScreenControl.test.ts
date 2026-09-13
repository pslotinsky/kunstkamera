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

function orderButton(root: HTMLElement, order: string): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>(`[data-order="${order}"]`)!;
}

function isOffered(root: HTMLElement, order: string): boolean {
  return !orderButton(root, order).classList.contains(styles.gone!);
}

function cellAt(root: HTMLElement, column: number, row: number): HTMLElement {
  return root.querySelector<HTMLElement>(
    `[data-column="${column}"][data-row="${row}"]`,
  )!;
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
  it('strikes what it can reach without a command in between', () => {
    const { control, root } = mountScreen();
    const { attacker, defender } = makeArmies();
    const field = Battlefield.ofProvince(LONDRE);
    const battle = new Battle({ attacker, defender, field });
    const rider = battle.getUnits('attacker')[0]!;
    const knight = battle.getUnits('defender')[0]!;

    rider.cell = field.getCell(6, 1)!;
    knight.cell = field.getCell(7, 1)!;

    control.play(battle);

    const whole = knight.strength;

    cellAt(root, 6, 1).click();
    cellAt(root, 7, 1).click();

    vi.runAllTimers();

    expect(knight.strength).toBeLessThan(whole);
    expect(rider.hasActed).toBe(true);
    expect(defender.troops).toBeLessThan(200);
  });

  it('finishes a unit that walks somewhere with nothing to strike', () => {
    const { control, root } = mountScreen();
    const { attacker, defender } = makeArmies();
    const field = Battlefield.ofProvince(LONDRE);
    const battle = new Battle({ attacker, defender, field });
    const rider = battle.getUnits('attacker')[0]!;

    rider.cell = field.getCell(0, 1)!;

    control.play(battle);

    cellAt(root, 0, 1).click();
    cellAt(root, 1, 1).click();

    vi.runAllTimers();

    expect(rider.cell.name).toBe('B2');
    expect(rider.hasActed).toBe(true);
    expect(isOffered(root, 'wait')).toBe(false);
  });

  it('lets another unit be picked up after the first has moved', () => {
    const { control, root } = mountScreen();
    const { attacker, defender } = makeArmies();
    const field = Battlefield.ofProvince(LONDRE);
    const battle = new Battle({ attacker, defender, field });
    const [rider, knight] = battle.getUnits('attacker');
    const enemy = battle.getUnits('defender')[0]!;

    rider!.cell = field.getCell(5, 1)!;
    knight!.cell = field.getCell(0, 1)!;
    enemy.cell = field.getCell(7, 1)!;

    control.play(battle);

    cellAt(root, 5, 1).click();
    cellAt(root, 6, 1).click();

    vi.runAllTimers();

    expect(rider!.hasMoved).toBe(true);
    expect(rider!.hasActed).toBe(false);

    cellAt(root, 0, 1).click();

    expect(rider!.hasActed).toBe(true);
    expect(isOffered(root, 'wait')).toBe(true);
  });

  it('asks before it abandons the field, and stays when told to', () => {
    const { control, events, root } = mountScreen();
    const { attacker, defender } = makeArmies();
    const battle = new Battle({
      attacker,
      defender,
      field: Battlefield.ofProvince(LONDRE),
    });

    let ended: BattleEndedEvent | undefined;
    events.subscribe(BattleEndedEvent, (event) => {
      ended = event;
    });

    control.play(battle);

    orderButton(root, 'retreat').click();

    expect(isOffered(root, 'confirm')).toBe(true);

    orderButton(root, 'stay').click();

    expect(ended).toBeUndefined();

    orderButton(root, 'retreat').click();
    orderButton(root, 'confirm').click();

    expect(ended?.outcome.reason).toBe('retreat');
    expect(ended?.outcome.isWonBy('defender')).toBe(true);
  });
  it('hands the turn over and lets the enemy take its own orders', () => {
    const { control, root } = mountScreen();
    const { attacker, defender } = makeArmies();
    const field = Battlefield.ofProvince(LONDRE);
    const battle = new Battle({ attacker, defender, field });

    control.play(battle);

    const before = battle
      .getUnits('defender')
      .map((unit) => `${unit.name}${unit.cell.name}`)
      .join('|');

    orderButton(root, 'done').click();

    vi.runAllTimers();

    const after = battle
      .getUnits('defender')
      .map((unit) => `${unit.name}${unit.cell.name}`)
      .join('|');

    expect(after).not.toBe(before);
    expect(battle.turn).toBe('attacker');
    expect(battle.getUnits('attacker').every((unit) => !unit.hasActed)).toBe(
      true,
    );
  });

  it('has the enemy strike when its order names a target', () => {
    const { control, root } = mountScreen();
    const { attacker, defender } = makeArmies();
    const field = Battlefield.ofProvince(LONDRE);
    const battle = new Battle({ attacker, defender, field });
    const rider = battle.getUnits('attacker')[0]!;
    const guard = battle.getUnits('defender')[0]!;

    rider.cell = field.getCell(6, 1)!;
    guard.cell = field.getCell(7, 1)!;

    control.play(battle);

    const whole = rider.strength;

    orderButton(root, 'done').click();

    vi.runAllTimers();

    expect(rider.strength).toBeLessThan(whole);
    expect(attacker.troops).toBeLessThan(156);
  });
});

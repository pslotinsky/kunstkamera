// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { BATTLE_DAY_LIMIT, BattleClock } from '@/core/domain/BattleClock';
import { BattleSide } from '@/core/domain/BattleSide';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import styles from '@/ui/BattleScreen/BattleScreen.module.scss';
import { BattleScreenControl } from '@/ui/BattleScreen/BattleScreenControl';

import {
  advanceTo,
  makeArmy,
  makeFamily,
  makeGeneral,
  makeInvasion,
  makeProvince,
  makeBattle as makeShared,
  makeWorld,
} from './factories';

const LONDRE = 22;

function makeBattle(attacker = makeArmy({ troops: 156 })): Battle {
  return makeShared({
    province: LONDRE,
    attacker,
    defender: makeArmy(),
  });
}

function orderButton(root: HTMLElement, order: string): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>(`[data-order="${order}"]`)!;
}

function isOffered(root: HTMLElement, order: string): boolean {
  return !orderButton(root, order).classList.contains(styles.gone!);
}

function parkDefenders(battle: Battle): void {
  for (const guard of battle.getUnits(BattleSide.defender)) {
    guard.cell = battle.field.getCell(9, 7)!;
  }
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

    expect(root.classList.contains(styles.hidden!)).toBe(true);

    control.play(makeBattle());

    expect(root.classList.contains(styles.hidden!)).toBe(false);
    expect(root.querySelectorAll('[data-column]')).toHaveLength(80);
    expect(root.querySelectorAll('[data-board] img')).toHaveLength(8);

    control.close();

    expect(root.classList.contains(styles.hidden!)).toBe(true);
  });

  it('reports the outcome when a unit reaches the enemy flag', () => {
    const { control, events, root } = mountScreen();
    const battle = makeBattle();

    let ended: BattleEndedEvent | undefined;
    events.subscribe(BattleEndedEvent, (event) => {
      ended = event;
    });

    const flag = battle.field.defenderFlag;
    const doorstep = battle.field.getCell(flag.column + 1, flag.row)!;
    const rider = battle.getUnits(BattleSide.attacker)[0]!;

    rider.moveAlong([doorstep]);
    rider.refresh();

    control.play(battle);

    const getCell = (column: number, row: number) =>
      root.querySelector<HTMLElement>(
        `[data-column="${column}"][data-row="${row}"]`,
      )!;

    getCell(doorstep.column, doorstep.row).click();
    getCell(flag.column, flag.row).click();

    vi.runAllTimers();

    expect(ended?.outcome.reason).toBe('flag');
    expect(ended?.outcome.isWonBy(BattleSide.attacker)).toBe(true);
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
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;
    const knight = battle.getUnits(BattleSide.defender)[0]!;

    rider.cell = battle.field.getCell(6, 1)!;
    knight.cell = battle.field.getCell(7, 1)!;

    control.play(battle);

    const whole = knight.strength;

    cellAt(root, 6, 1).click();
    cellAt(root, 7, 1).click();

    vi.runAllTimers();

    expect(knight.strength).toBeLessThan(whole);
    expect(rider.hasActed).toBe(true);
    expect(battle.getArmy(BattleSide.defender).troops).toBeLessThan(200);
  });

  it('finishes a unit that walks somewhere with nothing to strike', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;

    rider.cell = battle.field.getCell(0, 1)!;

    control.play(battle);

    cellAt(root, 0, 1).click();
    cellAt(root, 3, 1).click();

    vi.runAllTimers();

    expect(rider.cell.name).toBe('D2');
    expect(rider.hasActed).toBe(true);
    expect(isOffered(root, 'wait')).toBe(false);
  });

  it('lets another unit be picked up after the first has moved', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();
    const [rider, knight] = battle.getUnits(BattleSide.attacker);
    const enemy = battle.getUnits(BattleSide.defender)[0]!;

    rider!.cell = battle.field.getCell(5, 1)!;
    knight!.cell = battle.field.getCell(0, 1)!;
    enemy.cell = battle.field.getCell(7, 1)!;

    control.play(battle);

    cellAt(root, 5, 1).click();
    cellAt(root, 6, 1).click();

    vi.runAllTimers();

    expect(rider!.hasMoved).toBe(true);
    expect(rider!.hasActed).toBe(false);

    cellAt(root, 0, 1).click();

    expect(rider!.hasActed).toBe(false);
    expect(rider!.stepsLeft).toBeGreaterThan(0);
    expect(isOffered(root, 'wait')).toBe(true);
  });

  it('walks the rest of the way after a short first move', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;

    parkDefenders(battle);
    rider.cell = battle.field.getCell(0, 1)!;

    control.play(battle);

    cellAt(root, 0, 1).click();
    cellAt(root, 1, 1).click();
    vi.runAllTimers();

    expect(rider.hasActed).toBe(false);
    expect(rider.stepsLeft).toBe(2);

    cellAt(root, 3, 1).click();
    vi.runAllTimers();

    expect(rider.cell.name).toBe('D2');
    expect(rider.stepsLeft).toBe(0);
    expect(rider.hasActed).toBe(true);
  });

  it('breaks a fence it has walked up to', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;
    const fence = battle.field.getCell(8, 3)!;

    parkDefenders(battle);
    rider.cell = battle.field.getCell(9, 1)!;

    control.play(battle);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    cellAt(root, 9, 1).click();
    cellAt(root, 9, 3).click();
    vi.runAllTimers();

    expect(rider.cell.name).toBe('J4');
    expect(rider.hasActed).toBe(false);

    cellAt(root, 8, 3).click();

    expect(fence.terrain).toBe('plains');
    expect(rider.hasActed).toBe(true);
  });

  it('builds a fence after walking, when the unit is a Knights', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();
    const knights = battle.getUnits(BattleSide.attacker)[1]!;

    parkDefenders(battle);
    knights.cell = battle.field.getCell(6, 0)!;

    control.play(battle);

    cellAt(root, 6, 0).click();
    cellAt(root, 6, 1).click();
    vi.runAllTimers();

    expect(knights.cell.name).toBe('G2');
    expect(knights.hasActed).toBe(false);
    expect(isOffered(root, 'fence')).toBe(true);

    orderButton(root, 'fence').click();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    cellAt(root, 5, 1).click();

    expect(battle.field.getCell(5, 1)!.terrain).toBe('fence');
    expect(knights.hasActed).toBe(true);
  });

  it('asks before it abandons the field, and stays when told to', () => {
    const { control, events, root } = mountScreen();
    const battle = makeBattle();

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
    expect(ended?.outcome.isWonBy(BattleSide.defender)).toBe(true);
  });
  it('hands the turn over and lets the enemy take its own orders', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();

    control.play(battle);

    const before = battle
      .getUnits(BattleSide.defender)
      .map((unit) => `${unit.name}${unit.cell.name}`)
      .join('|');

    orderButton(root, 'done').click();

    vi.runAllTimers();

    const after = battle
      .getUnits(BattleSide.defender)
      .map((unit) => `${unit.name}${unit.cell.name}`)
      .join('|');

    expect(after).not.toBe(before);
    expect(battle.turn).toBe(BattleSide.attacker);
    expect(
      battle.getUnits(BattleSide.attacker).every((unit) => !unit.hasActed),
    ).toBe(true);
  });

  it('has the enemy strike when its order names a target', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;
    const guard = battle.getUnits(BattleSide.defender)[0]!;

    rider.cell = battle.field.getCell(6, 1)!;
    guard.cell = battle.field.getCell(7, 1)!;

    control.play(battle);

    const whole = rider.strength;

    orderButton(root, 'done').click();

    vi.runAllTimers();

    expect(rider.strength).toBeLessThan(whole);
    expect(battle.getArmy(BattleSide.attacker).troops).toBeLessThan(156);
  });
  it('reports a battle that runs out exactly once, and as endurance', () => {
    const { control, events, root } = mountScreen();
    const battle = makeBattle();
    const endings: BattleEndedEvent[] = [];

    battle.clock = new BattleClock(BATTLE_DAY_LIMIT, 'midnight');

    events.subscribe(BattleEndedEvent, (event) => {
      endings.push(event);
    });
    control.play(battle);
    orderButton(root, 'auto').click();
    orderButton(root, 'hand-over').click();
    orderButton(root, 'skip').click();

    vi.runAllTimers();

    expect(endings).toHaveLength(1);
    expect(endings[0]?.outcome.reason).toBe('endurance');
  });

  it('offers Auto beside Retreat, and asks before it fires', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();

    control.play(battle);

    expect(isOffered(root, 'auto')).toBe(true);
    expect(isOffered(root, 'hand-over')).toBe(false);

    orderButton(root, 'auto').click();

    expect(isOffered(root, 'hand-over')).toBe(true);
    expect(isOffered(root, 'stay')).toBe(true);

    orderButton(root, 'stay').click();

    expect(isOffered(root, 'hand-over')).toBe(false);
  });

  it("plays the player's own side once it is handed over", () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();

    control.play(battle);

    expect(
      battle.getUnits(BattleSide.attacker).some((unit) => unit.hasActed),
    ).toBe(false);

    orderButton(root, 'auto').click();
    orderButton(root, 'hand-over').click();

    expect(isOffered(root, 'skip')).toBe(true);
    expect(isOffered(root, 'auto')).toBe(false);

    vi.advanceTimersByTime(2000);

    expect(
      battle.getUnits(BattleSide.attacker).some((unit) => unit.hasActed),
    ).toBe(true);
  });

  it('finishes a handed-over battle by itself and settles it', () => {
    const { control, events, root } = mountScreen();
    const battle = makeShared({
      province: LONDRE,
      attacker: makeArmy({ troops: 3, food: 1 }),
      defender: makeArmy({ troops: 3 }),
    });
    let ended: BattleEndedEvent | undefined;

    battle.clock = new BattleClock(1, 'midnight');

    events.subscribe(BattleEndedEvent, (event) => {
      ended = event;
    });
    control.play(battle);

    orderButton(root, 'auto').click();
    orderButton(root, 'hand-over').click();
    orderButton(root, 'skip').click();

    vi.runAllTimers();

    expect(ended).toBeDefined();
    expect(ended?.outcome.winner).toBe(BattleSide.defender);
    expect(['retreat', 'starvation', 'rout', 'flag']).toContain(
      ended?.outcome.reason,
    );
  });

  it('breaks a fence beside a unit with one click, no command between', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;
    const fence = battle.field.getCell(8, 3)!;

    rider.cell = battle.field.getCell(9, 3)!;
    expect(fence.terrain).toBe('fence');

    control.play(battle);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    cellAt(root, 9, 3).click();
    cellAt(root, 8, 3).click();

    expect(fence.terrain).toBe('plains');
    expect(rider.hasActed).toBe(true);
  });

  it('offers Fence only to a Knights, and sites it behind the button', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;
    const knights = battle.getUnits(BattleSide.attacker)[1]!;

    rider.cell = battle.field.getCell(6, 0)!;
    knights.cell = battle.field.getCell(6, 1)!;

    control.play(battle);

    cellAt(root, 6, 0).click();
    expect(isOffered(root, 'fence')).toBe(false);

    cellAt(root, 6, 1).click();
    expect(isOffered(root, 'fence')).toBe(true);

    orderButton(root, 'fence').click();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    cellAt(root, 5, 1).click();

    expect(battle.field.getCell(5, 1)!.terrain).toBe('fence');
    expect(knights.hasActed).toBe(true);
  });

  it('leaves siting without spending the turn', () => {
    const { control, root } = mountScreen();
    const battle = makeBattle();
    const knights = battle.getUnits(BattleSide.attacker)[1]!;

    knights.cell = battle.field.getCell(6, 1)!;

    control.play(battle);

    cellAt(root, 6, 1).click();
    orderButton(root, 'fence').click();

    expect(isOffered(root, 'cancel')).toBe(true);

    orderButton(root, 'cancel').click();

    expect(knights.hasActed).toBe(false);
    expect(isOffered(root, 'fence')).toBe(true);
  });

  it('lets the attacker move first when the player defends', () => {
    const { control, root } = mountScreen();
    const invasion = makeInvasion();

    invasion.muster();

    const battle = invasion.answer({ answer: 'fight' }) as Battle;

    control.play(battle, invasion);

    expect(battle.turn.isAttacker).toBe(true);
    expect(root.querySelector('[data-prompt]')!.textContent).toBe(
      'The enemy is moving…',
    );
    expect(isOffered(root, 'retreat')).toBe(false);
  });
});

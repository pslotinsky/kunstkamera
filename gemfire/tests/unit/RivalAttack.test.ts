import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefendCommand } from '@/core/commands/DefendCommand';
import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { Battle } from '@/core/domain/Battle';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { DefenseRequestedEvent } from '@/core/events/DefenseRequestedEvent';
import { WarReportedEvent } from '@/core/events/WarReportedEvent';

import {
  advanceTo,
  makeArmy,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup() {
  const ander = makeGeneral({ name: 'Ander' });
  const rival = makeFamily({ name: 'Lyle', ruler: ander });
  const lars = makeGeneral({ name: 'Lars' });
  const other = makeFamily({ name: 'Coryll', ruler: lars });
  const erin = makeGeneral({ name: 'Erin' });
  const pender = makeGeneral({ name: 'Pender' });
  const player = makeFamily({
    name: 'Blanche',
    ruler: erin,
    members: [erin, pender],
  });

  const source = makeProvince({
    number: 1,
    neighbors: [2, 3, 4],
    family: rival,
    governor: ander,
    gold: 200,
    troops: 600,
    food: 600,
  });
  const mine = makeProvince({
    number: 2,
    neighbors: [1],
    family: player,
    governor: erin,
    troops: 40,
    food: 50,
  });
  const theirs = makeProvince({
    number: 3,
    neighbors: [1],
    family: other,
    governor: lars,
    troops: 20,
    food: 50,
  });
  const entrusted = makeProvince({
    number: 4,
    neighbors: [1],
    family: player,
    governor: pender,
    troops: 20,
    food: 50,
  });

  player.homeProvince = mine;
  entrusted.entrust();

  const { world, events } = makeWorld(
    [source, mine, theirs, entrusted],
    player,
  );
  const published: object[] = [];

  for (const kind of [
    DefenseRequestedEvent,
    WarReportedEvent,
    BattleStartedEvent,
    BattleReportedEvent,
  ]) {
    events.subscribe(kind, (event: object) => published.push(event));
  }

  advanceTo(world, source);

  const attack = (target: typeof mine) => {
    const command = new AttackCommand({ world, events });

    command.attackAt(
      target,
      makeArmy({ commander: ander, troops: 500, food: 500 }),
    );
    command.execute();

    return command;
  };

  return { world, events, mine, theirs, entrusted, rival, published, attack };
}

describe('A rival attack', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks the player before anything is settled on their own land', () => {
    const { mine, published, attack } = setup();
    const command = attack(mine);

    expect(published[0]).toBeInstanceOf(DefenseRequestedEvent);
    expect(command.suspendsTurn()).toBe(true);
    expect(mine.resources.troops).toBe(40);
  });

  it('is fought out on the map between two rival houses', () => {
    const { theirs, rival, published, attack } = setup();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const command = attack(theirs);

    expect(published[0]).toBeInstanceOf(WarReportedEvent);
    expect(command.suspendsTurn()).toBe(true);
    expect(theirs.belongsTo(rival)).toBe(true);
  });

  it('is answered by the lord of an entrusted province without asking', () => {
    const { entrusted, published, attack } = setup();

    attack(entrusted);

    expect(published[0]).toBeInstanceOf(WarReportedEvent);
  });
});

describe('DefendCommand', () => {
  function request() {
    const context = setup();

    context.attack(context.mine);

    const { invasion } = context.published[0] as DefenseRequestedEvent;

    return { ...context, invasion, defend: new DefendCommand(context) };
  }

  it('opens the battle when the player fights', () => {
    const { invasion, defend, published } = request();

    defend.defend(invasion, { answer: 'fight' });
    defend.execute();

    expect(defend.suspendsTurn()).toBe(true);
    expect((published[1] as BattleStartedEvent).battle).toBeInstanceOf(Battle);
  });

  it('refuses to surrender a province that still has troops to fight with', () => {
    const { invasion, defend, published, mine, rival } = request();

    defend.defend(invasion, { answer: 'surrender' });
    defend.execute();

    expect(published[1]).toBeInstanceOf(BattleStartedEvent);
    expect(mine.belongsTo(rival)).toBe(false);
  });

  it('settles at once when the player surrenders an empty province', () => {
    const { invasion, defend, published, mine, rival } = request();

    mine.addResources({ troops: -40 });
    defend.defend(invasion, { answer: 'surrender' });
    defend.execute();

    expect(defend.suspendsTurn()).toBe(false);
    expect(published[1]).toBeInstanceOf(BattleReportedEvent);
    expect(mine.belongsTo(rival)).toBe(true);
  });
});

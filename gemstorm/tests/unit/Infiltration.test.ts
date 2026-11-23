import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlunderCommand } from '@/core/commands/province/PlunderCommand';
import { SabotageCommand } from '@/core/commands/province/SabotageCommand';
import { Infiltration } from '@/core/domain/Infiltration';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup(attackWar = 50, defenseWar = 50) {
  const alderwyn = makeFamily({ name: 'Alderwyn', fame: 9 });
  const stormmere = makeFamily({ name: 'Stormmere', fame: 9 });
  const agent = makeGeneral({ war: attackWar });
  const defender = makeGeneral({ war: defenseWar });
  const source = makeProvince({
    number: 1,
    family: alderwyn,
    governor: agent,
    gold: 10,
    food: 10,
  });
  const target = makeProvince({
    number: 2,
    family: stormmere,
    governor: defender,
    gold: 136,
    food: 145,
    troops: 100,
    loyalty: 50,
    cultivation: 80,
    protection: 40,
  });

  return {
    source,
    target,
    alderwyn,
    stormmere,
    agent,
    defender,
    infiltration: new Infiltration({ source, target }),
  };
}

function roll(...values: number[]) {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);

  for (const value of values) {
    random.mockReturnValueOnce(value);
  }

  return random;
}

describe('Infiltration', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses both stats and requires the sabotage score to exceed adjusted defense', () => {
    roll(0.5, 0.99, 0.5, 0);

    expect(setup(50, 50).infiltration.sabotage()).toBeUndefined();
    expect(setup(51, 50).infiltration.sabotage()).toBe('troops');
  });

  it.each([
    [0, 'troops', 80],
    [0.25, 'loyalty', 40],
    [0.5, 'cultivation', 64],
    [0.75, 'protection', 32],
  ] as const)(
    'destroys one fifth on damage roll %s (%s)',
    (damageRoll, stat, remainder) => {
      roll(0, damageRoll);
      const { target, infiltration } = setup();

      expect(infiltration.sabotage()).toBe(stat);
      const value =
        stat === 'troops' ? target.resources.troops : target.development[stat];
      expect(value).toBe(remainder);
    },
  );

  it('adds alliance support to defense before halving it for an absent governor', () => {
    const { target, stormmere, infiltration } = setup(5);
    target.assignGovernor(undefined);
    roll(0.5, 0, 0.5, 0.99);

    expect(infiltration.sabotage()).toBe('troops');
    stormmere.formAlliance(makeFamily());
    expect(infiltration.sabotage()).toBeUndefined();
  });

  it.each([
    [0, 'intelligence'],
    [0.5, 'war'],
  ] as const)(
    'can train the acting lord after a failed sabotage',
    (statRoll, stat) => {
      const { agent, target, infiltration } = setup();
      roll(0.99, 0.89, statRoll);

      expect(infiltration.sabotage()).toBeUndefined();
      expect(target.resources.troops).toBe(100);
      expect(agent.stats[stat]).toBe(51);
    },
  );

  it('skips training on the 90% boundary or when the ruler governs remotely', () => {
    const { source, alderwyn, agent, infiltration } = setup();
    const random = roll(0.99, 0.9, 0.5);

    expect(infiltration.sabotage()).toBeUndefined();
    expect(agent.stats.total).toBe(150);

    source.assignGovernor(alderwyn.ruler);
    expect(infiltration.sabotage()).toBeUndefined();
    expect(alderwyn.ruler.stats.total).toBe(150);
    expect(random).toHaveBeenCalledTimes(3);
  });

  it.each([
    [0, 0],
    [0.5, 1],
    [0.99, 2],
  ])(
    'trains the defending lord by %s’s roll after plunder fails',
    (value, gain) => {
      const { defender, target, alderwyn, infiltration } = setup(50, 51);
      roll(value);

      expect(infiltration.plunder()).toBeUndefined();
      expect(defender.stats.war).toBe(51 + gain);
      expect(target.resources.gold).toBe(136);
      expect(alderwyn.fame).toBe(9);
    },
  );

  it('keeps the acting ruler’s Fame when there is nothing to plunder', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { target, alderwyn, infiltration } = setup();
    target.reduceResources({ gold: 136, food: 145 });

    expect(infiltration.plunder()).toBeUndefined();
    expect(alderwyn.fame).toBe(9);
  });

  it.each([
    [0, 0],
    [0.5, 1],
    [0.99, 2],
  ])(
    'plunders a fifth of the resources and charges the acting ruler (%s)',
    (roll, loss) => {
      vi.spyOn(Math, 'random').mockReturnValue(roll);
      const { source, target, alderwyn, stormmere, infiltration } = setup();

      const loot = infiltration.plunder();

      expect(loot?.gold).toBe(27);
      expect(loot?.food).toBe(29);
      expect(target.resources.gold).toBe(109);
      expect(target.resources.food).toBe(116);
      expect(source.resources.gold).toBe(37);
      expect(source.resources.food).toBe(39);
      expect(alderwyn.fame).toBe(9 - loss);
      expect(stormmere.fame).toBe(9);
    },
  );
});

function setupCommands() {
  const player = makeFamily();
  const attacker = makeFamily();
  const rival = makeFamily();
  const source = makeProvince({
    number: 1,
    neighbors: [2, 3],
    family: attacker,
  });
  const entrusted = makeProvince({
    number: 2,
    family: player,
    governor: makeGeneral(),
  });
  const adjacent = makeProvince({ number: 3, family: rival, gold: 100 });
  const distant = makeProvince({ number: 4, family: rival });
  attacker.moveHome(source);
  entrusted.entrust();
  const context = makeWorld([source, entrusted, adjacent, distant], player);
  advanceTo(context.world, source);

  return { source, entrusted, adjacent, distant, context };
}

describe('Infiltration commands', () => {
  afterEach(() => vi.restoreAllMocks());

  it('can sabotage distant enemy provinces while Plunder requires adjacent computer land', () => {
    const { context, entrusted, adjacent, distant } = setupCommands();
    const sabotage = new SabotageCommand(context);
    const plunder = new PlunderCommand(context);

    expect(entrusted.isEntrusted).toBe(true);
    expect(sabotage.selectableTargets).toEqual([
      entrusted.number,
      adjacent.number,
      distant.number,
    ]);
    expect(plunder.selectableTargets).toEqual([adjacent.number]);
  });

  it('refuses a direct Plunder order against entrusted player land', () => {
    const { context, source, entrusted, adjacent } = setupCommands();
    const plunder = new PlunderCommand(context);
    const reports: MissionReportedEvent[] = [];
    context.events.subscribe(MissionReportedEvent, (event) =>
      reports.push(event),
    );

    plunder.aimAt(entrusted);
    plunder.execute();

    expect(source.actionCount).toBe(0);
    expect(reports).toHaveLength(0);

    roll(0);
    plunder.aimAt(adjacent);
    plunder.execute();

    expect(source.actionCount).toBe(1);
    expect(source.goodwill).toBe(-1);
    expect(adjacent.resources.gold).toBe(80);
  });
});

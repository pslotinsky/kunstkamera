import { afterEach, describe, expect, it, vi } from 'vitest';

import { DiplomacyPolicy } from '@/core/ai/DiplomacyPolicy';
import { AllianceOfferedEvent } from '@/core/events/AllianceOfferedEvent';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup({
  adjacent = true,
  secondFamily = false,
  extraProvinces = 0,
} = {}) {
  const darian = makeGeneral({ name: 'Darian', charisma: 70 });
  const rival = makeFamily({ name: 'Stormmere', ruler: darian });
  const avar = makeGeneral({ name: 'Avar' });
  const rhovan = makeGeneral({ name: 'Rhovan' });
  const player = makeFamily({
    name: 'Alderwyn',
    ruler: avar,
    members: [avar, rhovan],
  });

  const neighbors = adjacent ? [2, 3] : [];
  const other = makeFamily({ name: 'Brackenridge' });
  const shore = makeProvince({ number: 6, family: other, gold: 100 });
  if (secondFamily) {
    neighbors.push(shore.number);
  }
  const home = makeProvince({
    number: 1,
    neighbors,
    family: rival,
    governor: darian,
    gold: 100,
  });
  const outpost = makeProvince({
    number: 5,
    neighbors: [3],
    family: rival,
    governor: darian,
  });
  const rich = makeProvince({
    number: 2,
    neighbors: [1],
    family: player,
    governor: rhovan,
    gold: 300,
    troops: 20,
  });
  const poor = makeProvince({
    number: 3,
    neighbors: [1, 5],
    family: player,
    governor: avar,
    gold: 10,
    troops: 90,
  });
  const extra = makeProvince({ number: 4, family: player });

  rival.homeProvince = home;
  player.homeProvince = poor;

  const provinces = [home, outpost, rich, poor, extra];
  if (secondFamily) {
    provinces.push(shore);
  }
  for (let index = 0; index < extraProvinces; index += 1) {
    provinces.push(makeProvince({ number: 10 + index, family: rival }));
  }
  const { world, events } = makeWorld(provinces, player);
  const policy = new DiplomacyPolicy({ world, events });
  const offers: AllianceOfferedEvent[] = [];
  const missions: MissionReportedEvent[] = [];

  events.subscribe(AllianceOfferedEvent, (event) => offers.push(event));
  events.subscribe(MissionReportedEvent, (event) => missions.push(event));

  const roll = (rolls: readonly number[]) => {
    const random = vi.spyOn(Math, 'random');

    for (const each of rolls) {
      random.mockReturnValueOnce(each);
    }
  };
  const play = (rolls: readonly number[] = []) => {
    advanceTo(world, home);
    roll(rolls);

    const command = policy.chooseCommand(home);
    command?.execute();

    return command;
  };
  const raid = (rolls: readonly number[] = []) => {
    advanceTo(world, home);
    roll(rolls);

    const command = policy.chooseFakeRaid(home);
    command?.execute();

    return command;
  };

  return {
    policy,
    home,
    outpost,
    rival,
    player,
    other,
    rich,
    extra,
    shore,
    rhovan,
    offers,
    missions,
    play,
    raid,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('DiplomacyPolicy', () => {
  it('acts only from the province the ruler is in', () => {
    const { policy, outpost } = setup({ secondFamily: true });

    expect(policy.chooseCommand(outpost)).toBeUndefined();
  });

  it('offers an alliance to the bordering family with the most provinces', () => {
    const { player, offers, play } = setup({ secondFamily: true });

    play();

    expect(offers.map((offer) => offer.proposer.name)).toEqual(['Stormmere']);
    expect(player.ally).toBeUndefined();
  });

  it('needs at least two bordering families to name the strongest', () => {
    const { offers, play } = setup();

    play([0.99]);

    expect(offers).toEqual([]);
  });

  it('counts the royal house as a neighbour but never courts it', () => {
    const { other, rich, extra, offers, play } = setup({
      secondFamily: true,
    });
    rich.claim(other);
    extra.claim(other);
    Object.assign(other, { royal: true });

    play();

    expect(offers).toHaveLength(1);
  });

  it('does not seek an ally once it owns more than ten provinces', () => {
    const { offers, play } = setup({ secondFamily: true, extraProvinces: 9 });

    play([0.99]);

    expect(offers).toEqual([]);
  });

  it('breaks with an ally that is no longer its strongest neighbour', () => {
    const { rival, other, missions, play } = setup({ secondFamily: true });
    rival.formAlliance(other);

    play();

    expect(rival.ally).toBeUndefined();
    expect(missions.map((mission) => mission.outcome.kind)).toEqual(['break']);
  });

  it.each([
    [9, true],
    [8, false],
  ])(
    'with %s extra provinces breaks with a far smaller strongest ally: %s',
    (extraProvinces, breaks) => {
      const { rival, player, play } = setup({
        secondFamily: true,
        extraProvinces,
      });
      rival.formAlliance(player);

      play([0.99]);

      expect(rival.ally === undefined).toBe(breaks);
    },
  );

  it.each([
    [0.34, ['defection']],
    [0.35, []],
  ])(
    'tries a defection on a roll under half the ruler’s CHA: %s',
    (defectionRoll, kinds) => {
      const { missions, play } = setup();

      play([defectionRoll, 0]);

      expect(missions.map((mission) => mission.outcome.kind)).toEqual(kinds);
    },
  );
});

describe('DiplomacyPolicy fake raid', () => {
  it('raids one month in nine', () => {
    const { raid } = setup();

    expect(raid([0.11])).toBeDefined();
    expect(raid([0.12])).toBeUndefined();
  });

  it('reports raiders caught by a stronger human lord and touches nothing', () => {
    const { rich, rhovan, missions, raid } = setup();
    rhovan.stats = rhovan.stats.increase({ war: 30 });

    raid([0, 0, 0]);

    const [mission] = missions;

    expect(missions).toHaveLength(1);
    expect(mission!.outcome).toMatchObject({ target: rich });
    expect(['plunder', 'sabotage']).toContain(mission!.outcome.kind);
    expect(rich.resources).toMatchObject({ gold: 300, troops: 20 });
  });

  it('passes unnoticed when no human lord nearby is stronger', () => {
    const { missions, raid } = setup();

    raid([0, 0, 0]);

    expect(missions).toEqual([]);
  });

  it('is never ordered for an entrusted province', () => {
    const { home, player, raid } = setup();
    home.claim(player);
    home.entrust();

    expect(raid([0])).toBeUndefined();
  });
});

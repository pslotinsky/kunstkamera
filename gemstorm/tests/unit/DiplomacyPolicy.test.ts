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

function setup({ adjacent = true, hasPlunderTarget = false } = {}) {
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
  const shore = makeProvince({ number: 6, family: makeFamily(), gold: 100 });
  if (hasPlunderTarget) {
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
  if (hasPlunderTarget) {
    provinces.push(shore);
  }
  const { world, events } = makeWorld(provinces, player);
  const policy = new DiplomacyPolicy({ world, events });
  const offers: AllianceOfferedEvent[] = [];
  const missions: MissionReportedEvent[] = [];

  events.subscribe(AllianceOfferedEvent, (event) => offers.push(event));
  events.subscribe(MissionReportedEvent, (event) => missions.push(event));

  const play = (rolls: readonly number[]) => {
    advanceTo(world, home);

    const random = vi.spyOn(Math, 'random');

    for (const roll of rolls) {
      random.mockReturnValueOnce(roll);
    }

    policy.chooseCommand(home)?.execute();
  };

  return {
    policy,
    outpost,
    rival,
    player,
    rich,
    shore,
    rhovan,
    offers,
    missions,
    play,
  };
}

describe('DiplomacyPolicy', () => {
  afterEach(() => vi.restoreAllMocks());

  it('acts only from the home province', () => {
    const { policy, outpost } = setup();

    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(policy.chooseCommand(outpost)).toBeUndefined();
  });

  it('breaks its alliance on the roll, keeps it otherwise', () => {
    const kept = setup();
    const broken = setup();

    kept.rival.formAlliance(kept.player);
    broken.rival.formAlliance(broken.player);
    kept.play([0.5, 0.99]);
    broken.play([0.05]);

    expect(kept.rival.ally).toBe(kept.player);
    expect(broken.rival.ally).toBeUndefined();
  });

  it('offers an alliance to a stronger neighbour, the player included', () => {
    const { offers, rival, play } = setup();

    play([0.1]);

    expect(offers.map((offer) => offer.proposer)).toEqual([rival]);
  });

  it('plunders computer land even when the player owns the richer neighbour', () => {
    const { missions, shore, play } = setup({ hasPlunderTarget: true });

    play([0.9, 0.1, 0, 0]);

    expect(missions[0]?.outcome).toMatchObject({
      kind: 'plunder',
      target: shore,
    });
  });

  it('tries to turn the lord of a hostile neighbour', () => {
    const { missions, rhovan, play } = setup();

    play([0.9, 0.1, 0.99, 0]);

    expect(missions[0]?.outcome).toMatchObject({
      kind: 'defection',
      general: rhovan,
      persuaded: true,
    });
  });

  it('can send a defection offer beyond the borders of its capital', () => {
    const { missions, rhovan, play } = setup({ adjacent: false });

    play([0.9, 0.1, 0.99, 0]);

    expect(missions[0]?.outcome).toMatchObject({
      kind: 'defection',
      general: rhovan,
      persuaded: true,
    });
  });

  it('can send a sabotage order to a distant enemy province', () => {
    const { missions, rich, play } = setup({ adjacent: false });

    play([0.9, 0.1, 0, 0, 0.5]);

    expect(missions[0]?.outcome).toMatchObject({
      kind: 'sabotage',
      target: rich,
      damage: 'cultivation',
    });
  });
});

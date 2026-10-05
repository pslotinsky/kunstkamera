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

function setup() {
  const ander = makeGeneral({ name: 'Ander' });
  const rival = makeFamily({ name: 'Lyle', ruler: ander });
  const erin = makeGeneral({ name: 'Erin' });
  const pender = makeGeneral({ name: 'Pender' });
  const player = makeFamily({
    name: 'Blanche',
    ruler: erin,
    members: [erin, pender],
  });

  const home = makeProvince({
    number: 1,
    neighbors: [2, 3],
    family: rival,
    governor: ander,
    gold: 100,
  });
  const outpost = makeProvince({
    number: 5,
    neighbors: [3],
    family: rival,
    governor: ander,
  });
  const rich = makeProvince({
    number: 2,
    neighbors: [1],
    family: player,
    governor: pender,
    gold: 300,
    troops: 20,
  });
  const poor = makeProvince({
    number: 3,
    neighbors: [1, 5],
    family: player,
    governor: erin,
    gold: 10,
    troops: 90,
  });
  const extra = makeProvince({ number: 4, family: player });

  rival.homeProvince = home;
  player.homeProvince = poor;

  const { world, events } = makeWorld(
    [home, outpost, rich, poor, extra],
    player,
  );
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
    pender,
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

  it('plunders the richest hostile neighbour on the covert roll', () => {
    const { missions, rich, play } = setup();

    play([0.9, 0.1, 0]);

    expect(missions[0]?.outcome).toMatchObject({
      kind: 'plunder',
      target: rich,
    });
  });

  it('tries to turn the lord of a hostile neighbour', () => {
    const { missions, pender, play } = setup();

    play([0.9, 0.1, 0.99]);

    expect(missions[0]?.outcome).toMatchObject({
      kind: 'defection',
      general: pender,
    });
  });
});

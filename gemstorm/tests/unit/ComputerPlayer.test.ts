import { afterEach, describe, expect, it, vi } from 'vitest';

import { ComputerPlayer } from '@/core/ai/ComputerPlayer';
import { DefenseRequestedEvent } from '@/core/events/DefenseRequestedEvent';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

afterEach(() => vi.restoreAllMocks());

interface SetupParams {
  readonly intelligence?: number;
  readonly war?: number;
  readonly gold?: number;
  readonly food?: number;
  readonly troops?: number;
}

function setup(params: SetupParams = {}) {
  const darian = makeGeneral({
    name: 'Darian',
    intelligence: params.intelligence ?? 50,
    war: params.war ?? 50,
  });
  const rival = makeFamily({ name: 'Stormmere', ruler: darian });
  const avar = makeGeneral({ name: 'Avar', intelligence: 90, war: 90 });
  const player = makeFamily({ name: 'Alderwyn', ruler: avar });

  const home = makeProvince({
    number: 1,
    neighbors: [2],
    family: rival,
    governor: darian,
    gold: params.gold ?? 200,
    food: params.food ?? 400,
    troops: params.troops ?? 300,
    cultivation: 10,
    loyalty: 60,
    protection: 60,
  });
  const border = makeProvince({
    number: 2,
    neighbors: [1, 3],
    family: player,
    governor: avar,
    troops: 50,
  });
  const keep = makeProvince({
    number: 3,
    neighbors: [2],
    family: player,
    governor: avar,
    gold: 100,
    food: 100,
    cultivation: 10,
    loyalty: 60,
    protection: 60,
  });

  rival.moveHome(home);
  player.moveHome(border);

  const { world, events } = makeWorld([home, border, keep], player);
  const computer = new ComputerPlayer({ world, events });
  const defended: DefenseRequestedEvent[] = [];
  const missions: MissionReportedEvent[] = [];

  events.subscribe(DefenseRequestedEvent, (event) => defended.push(event));
  events.subscribe(MissionReportedEvent, (event) => missions.push(event));

  const play = (province: typeof home, rolls: readonly number[]) => {
    advanceTo(world, province);

    const random = vi.spyOn(Math, 'random');

    for (const roll of rolls) {
      random.mockReturnValueOnce(roll);
    }

    return computer.play(province);
  };

  return { home, border, keep, defended, missions, play };
}

describe('ComputerPlayer', () => {
  it('leads with the military when its lord’s WAR outweighs his INT', () => {
    const { home, defended, play } = setup({ intelligence: 50, war: 80 });

    play(home, [0.4]);

    expect(defended).toHaveLength(1);
    expect(home.development.cultivation).toBe(10);
  });

  it('develops first on a roll in the middle band when INT holds level', () => {
    const { home, defended, play } = setup({ intelligence: 80, war: 50 });

    play(home, [0.59]);

    expect(defended).toEqual([]);
    expect(home.development.cultivation).toBeGreaterThan(10);
    expect(home.actionCount).toBe(1);
  });

  it('trades before choosing its order when short of Gold only', () => {
    const { home, play } = setup({ intelligence: 80, gold: 20, food: 400 });

    play(home, [0.59]);

    expect(home.resources.food).toBe(200);
    expect(home.development.cultivation).toBeGreaterThan(10);
  });

  it('leads with diplomacy on a low roll and raids when no alliance move fits', () => {
    const { home, border, missions, play } = setup({ intelligence: 80 });

    play(home, [0.1, 0.99, 0, 0, 0]);

    expect(missions).toHaveLength(1);
    expect(missions[0]!.outcome).toMatchObject({ target: border });
    expect(home.development.cultivation).toBe(10);
    expect(home.actionCount).toBe(1);
  });

  it('does nothing when no step of its plan can act', () => {
    const { home, play } = setup({
      intelligence: 80,
      gold: 5,
      food: 0,
      troops: 0,
    });

    const suspended = play(home, [0.59, 0]);

    expect(suspended).toBe(false);
    expect(home.actionCount).toBe(0);
  });

  it('never raids for an entrusted province and moves on down its plan', () => {
    const { keep, missions, play } = setup();
    keep.entrust();

    play(keep, [0.1, 0]);

    expect(missions).toEqual([]);
    expect(keep.development.cultivation).toBeGreaterThan(10);
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getFamilyCrestUrl } from '@/ui/art/getFamilyCrestUrl';
import { SoundBoard } from '@/ui/sound/SoundBoard';
import { MARCH_MS } from '@/ui/WorldMap/WarMarch';
import { WorldMapControl } from '@/ui/WorldMap/WorldMapControl';

import {
  makeFamily,
  makeInvasionReport,
  makeProvince,
  makeWorld,
} from './factories';

function setup() {
  const attacking = makeFamily();
  const defending = makeFamily();
  const source = makeProvince({ number: 7, family: attacking });
  const target = makeProvince({ number: 8, family: defending });
  const { world } = makeWorld([source, target], attacking);
  const container = document.createElement('div');
  const sounds = new SoundBoard();
  const control = new WorldMapControl({ map: world.map, sounds });

  control.mount(container);

  function getMarkerCrests(): (string | null)[] {
    return [...container.querySelectorAll('.province-markers image')].map(
      (crest) => crest.getAttribute('href'),
    );
  }

  return {
    attacking,
    defending,
    source,
    target,
    control,
    sounds,
    getMarkerCrests,
  };
}

describe('WorldMapControl', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the defender on a taken province until the war animation ends', () => {
    vi.useFakeTimers();
    const { attacking, defending, source, target, control, getMarkerCrests } =
      setup();

    control.showWar(makeInvasionReport({ source, target }), () => {});
    target.claim(attacking);
    control.actualizeProvince(target);

    expect(getMarkerCrests()).toEqual([
      getFamilyCrestUrl(attacking),
      getFamilyCrestUrl(defending),
    ]);

    vi.runAllTimers();

    expect(getMarkerCrests()).toEqual([
      getFamilyCrestUrl(attacking),
      getFamilyCrestUrl(attacking),
    ]);
  });

  it('plays a distant skirmish when the war march clashes', () => {
    vi.useFakeTimers();
    const { source, target, control, sounds } = setup();
    const skirmish = vi.spyOn(sounds, 'playSkirmish');

    control.showWar(makeInvasionReport({ source, target }), () => {});

    expect(skirmish).not.toHaveBeenCalled();

    vi.advanceTimersByTime(MARCH_MS);

    expect(skirmish).toHaveBeenCalledOnce();
  });

  it('marches without a clash when the war was not fought', () => {
    vi.useFakeTimers();
    const { source, target, control, sounds } = setup();
    const skirmish = vi.spyOn(sounds, 'playSkirmish');

    control.showWar(
      makeInvasionReport({
        source,
        target,
        answer: 'surrender',
        outcome: undefined,
      }),
      () => {},
    );
    vi.runAllTimers();

    expect(skirmish).not.toHaveBeenCalled();
  });
});

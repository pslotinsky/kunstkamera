// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  const control = new WorldMapControl({ map: world.map });

  control.mount(container);

  function getMarkerCrests(): (string | null)[] {
    return [...container.querySelectorAll('.province-markers image')].map(
      (crest) => crest.getAttribute('href'),
    );
  }

  return { attacking, defending, source, target, control, getMarkerCrests };
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

    expect(getMarkerCrests()).toEqual([attacking.crest, defending.crest]);

    vi.runAllTimers();

    expect(getMarkerCrests()).toEqual([attacking.crest, attacking.crest]);
  });
});

import { describe, expect, it } from 'vitest';

import { HIRED_UNITS } from '@/config/fifth-units';
import { GEMS } from '@/config/gems';
import { BAD_EVENTS, DISASTERS, GOOD_EVENTS } from '@/config/province-events';
import { SCENARIO_1 } from '@/config/scenario-1';

const assets = import.meta.glob('../../public/**/*.webp');

function hasAsset(path: string): boolean {
  return Object.hasOwn(assets, `../../public/${path}`);
}

describe('game content assets', () => {
  it('has portraits and crests for every starting general and house', () => {
    for (const general of SCENARIO_1.generals) {
      expect(
        hasAsset(`portraits/${general.name.toLowerCase()}.webp`),
        general.name,
      ).toBe(true);
    }
    for (const family of SCENARIO_1.families) {
      expect(
        hasAsset(`crests/${family.name.toLowerCase()}.webp`),
        family.name,
      ).toBe(true);
    }
  });

  it('has portraits for Guardians, hired creatures, and the visiting tide wyrm', () => {
    const names = [
      ...GEMS.map((gem) => gem.guardian.name),
      ...HIRED_UNITS.map((unit) => unit.name),
      'Nerith',
    ];
    for (const name of names) {
      expect(hasAsset(`unit/${name.toLowerCase()}.webp`), name).toBe(true);
      expect(hasAsset(`fifth-units/${name.toLowerCase()}.webp`), name).toBe(
        true,
      );
    }
  });

  it('has artwork for every configured incident', () => {
    for (const incident of [...GOOD_EVENTS, ...BAD_EVENTS, ...DISASTERS]) {
      expect(hasAsset(`events/${incident.image}.webp`), incident.name).toBe(
        true,
      );
    }
  });
});

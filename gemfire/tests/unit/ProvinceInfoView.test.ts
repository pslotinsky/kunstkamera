import { describe, expect, it } from 'vitest';

import type { Province } from '@/core/domain/Province';
import { WorldFactory } from '@/core/WorldFactory';
import { ProvinceInfoView } from '@/ui/ProvinceInfo/ProvinceInfoView';

const world = new WorldFactory().create();

describe('ProvinceInfoView', () => {
  it('reveals full detail only for a province the player owns', () => {
    const owned = world.map.provinces.find((province) =>
      province.isOwner(world.player),
    );
    const rival = world.map.provinces.find(
      (province) => !province.isNeutral() && !province.isOwner(world.player),
    );
    const neutral = world.map.provinces.find((province) =>
      province.isNeutral(),
    );

    expect(owned, 'a player-owned province').toBeDefined();
    expect(rival, 'a rival-owned province').toBeDefined();
    expect(neutral, 'a neutral province').toBeDefined();

    expect(panelFor(owned)).toContain('Gold');
    expect(panelFor(rival)).not.toContain('Gold');
    expect(panelFor(neutral)).not.toContain('Gold');
  });
});

function panelFor(selection: Province | undefined): string {
  return new ProvinceInfoView({ player: world.player, selection }, {}).render();
}

import { describe, expect, it } from 'vitest';

import type { Province } from '@/core/domain/Province';
import { WorldFactory } from '@/core/WorldFactory';
import styles from '@/ui/ProvinceCommands/ProvinceCommands.module.scss';
import { ProvinceCommandsView } from '@/ui/ProvinceCommands/ProvinceCommandsView';

const world = new WorldFactory().create();

describe('ProvinceCommandsView', () => {
  it('shows the command menu only for a province the player owns', () => {
    const owner = world.map.provinces.find((province) =>
      province.isOwner(world.player),
    );
    const rival = world.map.provinces.find(
      (province) => !province.isOwner(world.player),
    );
    const neutral = world.map.provinces.find((province) =>
      province.isNeutral(),
    );

    expect(owner, 'a player-owned province').toBeDefined();
    expect(rival, 'a rival-owned province').toBeDefined();
    expect(neutral, 'a neutral province').toBeDefined();

    expect(menuFor(owner)).toContain('Domestic');
    expect(menuFor(rival)).not.toContain('Domestic');
    expect(menuFor(neutral)).not.toContain('Domestic');
    expect(menuFor(undefined)).not.toContain('Domestic');
  });

  it('hides every command section until its group is opened', () => {
    const owner = world.map.provinces.find((province) =>
      province.isOwner(world.player),
    );

    const sections = menuFor(owner).match(/<div class="[^"]*" data-group=/g);

    expect(sections).toHaveLength(4);

    for (const section of sections ?? []) {
      expect(section).toContain(styles.hidden);
    }
  });
});

function menuFor(selection: Province | undefined): string {
  return new ProvinceCommandsView(
    { player: world.player, selection },
    {},
  ).render();
}

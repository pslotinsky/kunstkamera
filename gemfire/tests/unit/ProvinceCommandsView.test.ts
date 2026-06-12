import { describe, expect, it } from 'vitest';

import { createCommandGroups } from '@/core/commands/province/catalog';
import { WorldFactory } from '@/core/WorldFactory';
import { EventBus } from '@/lib/EventBus';
import styles from '@/ui/ProvinceCommands/ProvinceCommands.module.scss';
import { ProvinceCommandsView } from '@/ui/ProvinceCommands/ProvinceCommandsView';

describe('ProvinceCommandsView', () => {
  it('renders the menu hidden, closed, and disabled until a province takes the turn', () => {
    const world = new WorldFactory().create();
    const events = new EventBus();
    const commands = createCommandGroups({ world, events });
    const markup = new ProvinceCommandsView(
      { world, commands, events },
      {},
    ).render();
    const sections = markup.match(/<div class="[^"]*" data-group=/g);

    expect(markup).toContain(`class="${styles.root} ${styles.hidden}"`);
    expect(markup).toContain('data-action="skip-turn" disabled>');
    expect(markup).not.toMatch(/data-command="[^"]+">/);
    expect(sections).toHaveLength(4);

    for (const section of sections ?? []) {
      expect(section).toContain(styles.hidden);
    }
  });
});

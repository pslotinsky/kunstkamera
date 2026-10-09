// @vitest-environment jsdom
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
    const view = new ProvinceCommandsView({ world, commands, events }, {});

    const container = document.createElement('div');
    view.mount(container);

    const root = container.querySelector<HTMLElement>(`.${styles.root}`)!;
    const groupSections = root.querySelectorAll('div[data-group]');
    const commandButtons = [
      ...root.querySelectorAll<HTMLButtonElement>('button[data-command]'),
    ];
    const skipButton = root.querySelector<HTMLButtonElement>(
      `.${styles.skipTurn}`,
    );

    expect(root.classList.contains(styles.hidden!)).toBe(true);
    expect(groupSections).toHaveLength(4);
    expect(skipButton?.disabled).toBe(true);
    expect(commandButtons.length).toBeGreaterThan(0);
    expect(commandButtons.every((button) => button.disabled)).toBe(true);

    for (const section of groupSections) {
      expect(section.classList.contains(styles.hidden!)).toBe(true);
    }
  });
});

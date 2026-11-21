// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { AllyCommand } from '@/core/commands/province/AllyCommand';
import { AllyDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/AllyDialogControl';

import { advanceTo, makeFamily, makeProvince, makeWorld } from './factories';

describe('Ally dialog', () => {
  it('offers to break the current pact and lets the player select a replacement', () => {
    const player = makeFamily({ name: 'Alderwyn' });
    const ally = makeFamily({ name: 'Stormmere' });
    const rival = makeFamily({ name: 'Greyfen' });
    const home = makeProvince({ number: 1, family: player });
    const allied = makeProvince({ number: 2, family: ally });
    const distant = makeProvince({ number: 3, family: rival });
    player.moveHome(home);
    player.formAlliance(ally);
    const context = makeWorld([home, allied, distant], player);
    advanceTo(context.world, home);

    const command = new AllyCommand(context);
    const control = new AllyDialogControl('ally', context.world);
    const container = document.createElement('div');
    control.mount(container);
    control.onConfirm(() => command.execute());
    control.open(command);

    expect(control.step).toBeUndefined();
    expect(container.querySelector('[data-detail]')?.textContent).toContain(
      'Break the alliance?',
    );
    expect(command.selectableTargets).toEqual([3]);

    control.chooseTarget(distant);

    expect(container.querySelector('[data-headline]')?.textContent).toBe(
      'Ally with Greyfen',
    );
    expect(player.ally).toBe(ally);
    container
      .querySelector<HTMLButtonElement>('[data-action="confirm"]')!
      .click();

    expect(player.ally).toBe(rival);
    expect(ally.ally).toBeUndefined();
    control.unmount();
  });
});

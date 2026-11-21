// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { ChangeLordCommand } from '@/core/commands/province/ChangeLordCommand';
import { ChangeLordDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/ChangeLordDialogControl';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

describe('Change Lord dialog', () => {
  it('returns to territory selection after a free recall and confirms moving the ruler', () => {
    const ruler = makeGeneral({ name: 'Avar' });
    const lord = makeGeneral({ name: 'Nemer' });
    const family = makeFamily({ ruler, members: [ruler, lord] });
    const home = makeProvince({ number: 1, family, governor: ruler });
    const estate = makeProvince({ number: 2, family, governor: lord });
    family.moveHome(home);
    const context = makeWorld([home, estate], family);
    advanceTo(context.world, home);

    const command = new ChangeLordCommand(context);
    const control = new ChangeLordDialogControl('change-lord', context.world);
    const container = document.createElement('div');
    const click = (selector: string) =>
      container.querySelector<HTMLButtonElement>(selector)!.click();
    control.mount(container);
    control.onConfirm(() => {
      const spendsTurn = command.consumesTurn();
      command.execute();

      if (!spendsTurn) {
        control.refresh();
      }
    });
    control.open(command);
    control.chooseTarget(estate);
    click('[data-select="Avar"]');
    click('[data-action="confirm"]');

    expect(estate.isRemotelyRuled).toBe(true);
    expect(control.step?.prompt).toBe('Which territory?');
    expect(home.actionCount).toBe(0);

    control.chooseTarget(estate);
    click('[data-mode="lords"]');
    click('[data-select="1"]');

    const question = container.querySelector('[data-question]');
    expect(question?.textContent).toBe('OK to move yourself?');
    expect(family.homeProvince).toBe(home);

    click('[data-action="confirm"]');

    expect(family.homeProvince).toBe(estate);
    expect(home.actionCount).toBe(1);
    control.unmount();
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { createCommandGroups } from '@/core/commands/province/catalog';
import { DevelopCommand } from '@/core/commands/province/DevelopCommand';
import { RecruitCommand } from '@/core/commands/province/RecruitCommand';
import { CommandDialogsControl } from '@/ui/CommandDialogs/CommandDialogsControl';
import { ProvinceCommandsControl } from '@/ui/ProvinceCommands/ProvinceCommandsControl';

import { makeFamily, makeProvince, makeWorld } from './factories';

describe('CommandDialogsControl', () => {
  it('opens recruitment when command classes share a minified name', () => {
    const recruitName = Object.getOwnPropertyDescriptor(
      RecruitCommand,
      'name',
    )!;
    const developName = Object.getOwnPropertyDescriptor(
      DevelopCommand,
      'name',
    )!;

    Object.defineProperty(RecruitCommand, 'name', {
      value: 'e',
      configurable: true,
    });
    Object.defineProperty(DevelopCommand, 'name', {
      value: 'e',
      configurable: true,
    });

    try {
      const family = makeFamily();
      const province = makeProvince({ family, gold: 200, troops: 100 });
      const context = makeWorld([province], family);
      const dialogs = new CommandDialogsControl(context);
      const groups = createCommandGroups(context);
      const commands = new ProvinceCommandsControl(
        context.world,
        groups,
        context.events,
        dialogs,
      );
      const dialogContainer = document.createElement('div');
      const menuContainer = document.createElement('div');

      dialogs.mount(dialogContainer);
      commands.mount(menuContainer);
      commands.show();
      menuContainer
        .querySelector<HTMLButtonElement>('button[data-group="Military"]')!
        .click();
      menuContainer
        .querySelector<HTMLImageElement>('[data-command="Recruit"] img')!
        .click();

      expect(
        menuContainer.querySelector('[data-step]')!.textContent,
      ).not.toContain('Cultivation');
      const prompts = Array.from(
        dialogContainer.querySelectorAll('[data-prompt]'),
      ).map((element) => element.textContent);

      expect(prompts).toContain('How many troops (0-100)?');
      commands.unmount();
      dialogs.unmount();
    } finally {
      Object.defineProperty(RecruitCommand, 'name', recruitName);
      Object.defineProperty(DevelopCommand, 'name', developName);
    }
  });
});

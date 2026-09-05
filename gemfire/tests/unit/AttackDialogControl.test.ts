// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { AttackDialogControl } from '@/ui/ProvinceCommands/CommandDialog/AttackDialogControl';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup(gold = 100) {
  const erin = makeGeneral({ name: 'Erin', war: 87 });
  const mine = makeFamily({
    name: 'Blanche',
    ruler: erin,
    gems: [Gem.ofName('Zendor')],
  });
  const rival = makeFamily({ name: 'Lyle' });

  const source = makeProvince({
    number: 1,
    name: 'Rodale',
    neighbors: [2],
    family: mine,
    governor: erin,
    gold,
    troops: 156,
    food: 200,
  });
  const enemy = makeProvince({
    number: 2,
    name: 'Hyland',
    neighbors: [1],
    family: rival,
    troops: 60,
  });

  source.addUnit(HiredUnit.ofName('Orks')!);

  const { world, events } = makeWorld([source, enemy], mine);

  advanceTo(world, source);

  const container = document.createElement('div');
  document.body.append(container);

  const control = new AttackDialogControl(AttackCommand.name, world);
  control.mount(container);
  control.open(new AttackCommand({ world, events }));
  control.pickTarget(enemy);

  const root = container.querySelector<HTMLElement>(
    `[data-dialog="${AttackCommand.name}"]`,
  )!;

  const commit = (field: string, amount: number) => {
    const input = root.querySelector<HTMLInputElement>(
      `[data-amount-field="${field}"] [data-amount-input]`,
    )!;

    input.value = String(amount);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  return {
    commit,
    bring: (name: string) =>
      root
        .querySelector<HTMLElement>(
          `[data-dropdown="unit"] [data-value="${name}"]`,
        )!
        .click(),
    commander: () =>
      root.querySelector('[data-dropdown="commander"] [data-dropdown-label]')!
        .textContent,
    slotOptions: () =>
      [
        ...root.querySelectorAll<HTMLElement>(
          '[data-dropdown="unit"] [data-dropdown-option]',
        ),
      ].map((option) => option.dataset.value),
    figures: () => root.querySelector('[data-figures]')!.textContent,
    foodRange: () => root.querySelector('[data-food-prompt]')!.textContent,
    confirms: () =>
      !root.querySelector<HTMLButtonElement>('button[data-action="confirm"]')!
        .disabled,
  };
}

describe('AttackDialogControl', () => {
  afterEach(() => document.body.replaceChildren());

  it('leads with the governor and offers hired units beside the house gems', () => {
    const dialog = setup();

    expect(dialog.commander()).toContain('Erin');
    expect(dialog.slotOptions()).toEqual(['', 'Orks', 'Zendor']);
  });

  it('moves the deployment gold and the supply days with the commitment', () => {
    const dialog = setup();

    dialog.commit('troops', 156);
    dialog.commit('food', 120);

    expect(dialog.figures()).toBe('Deployment 29 gold — supply 7 days');
    expect(dialog.foodRange()).toBe('How much food (16-200)?');

    dialog.bring('Orks');

    expect(dialog.figures()).toBe('Deployment 29 gold — supply 4 days');
  });

  it('withholds the order until the province can pay and feed the army', () => {
    const dialog = setup();

    expect(dialog.confirms()).toBe(false);

    dialog.commit('troops', 156);

    expect(dialog.confirms()).toBe(false);

    dialog.commit('food', 15);

    expect(dialog.confirms()).toBe(false);

    dialog.commit('food', 120);

    expect(dialog.confirms()).toBe(true);
  });

  it('withholds the order when the province cannot afford the deployment', () => {
    const dialog = setup(10);

    dialog.commit('troops', 156);
    dialog.commit('food', 120);

    expect(dialog.confirms()).toBe(false);
  });
});

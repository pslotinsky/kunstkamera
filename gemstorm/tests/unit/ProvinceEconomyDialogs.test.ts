// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { MarketRate } from '@/core/domain/MarketRate';
import { GiveFoodDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/GiveFoodDialogControl';
import { TradeDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/TradeDialogControl';

import { makeFamily, makeProvince, makeWorld } from './factories';

describe('Province economy dialogs', () => {
  it('asks for confirmation before spending food at full Loyalty', () => {
    const family = makeFamily();
    const province = makeProvince({ family, loyalty: 100, food: 80 });
    const context = makeWorld([province], family);
    const command = new GiveFoodCommand(context);
    const control = new GiveFoodDialogControl('give-food');
    const container = document.createElement('div');
    control.mount(container);
    control.onConfirm(() => command.execute());
    control.open(command);

    const gift =
      container.querySelector<HTMLButtonElement>('[data-amount="20"]')!;
    const confirmation = container.querySelector<HTMLElement>(
      '[data-gift-confirmation]',
    )!;
    const confirm = container.querySelector<HTMLButtonElement>(
      '[data-action="confirm"]',
    )!;

    expect(confirmation.hidden).toBe(true);
    gift.click();

    expect(confirmation.hidden).toBe(false);
    expect(province.resources.food).toBe(80);
    confirm.click();

    expect(province.resources.food).toBe(60);
    control.unmount();
  });

  it('clamps a buy to the gold spending limit and rejects amounts that buy no food', () => {
    const family = makeFamily();
    const province = makeProvince({ family, gold: 100, food: 998 });
    const context = makeWorld([province], family);
    context.world.market.rate = MarketRate.HIGH;
    const command = new TradeCommand(context);
    const control = new TradeDialogControl('trade', context.world);
    const container = document.createElement('div');
    control.mount(container);
    control.onConfirm(() => command.execute());
    control.open(command);
    control.chooseStep('buy');

    const input = container.querySelector<HTMLInputElement>(
      '[data-amount-input]',
    )!;
    const confirm = container.querySelector<HTMLButtonElement>(
      '[data-action="confirm"]',
    )!;

    expect(input.max).toBe('2');
    input.value = '1';
    input.dispatchEvent(new Event('input'));
    expect(confirm.disabled).toBe(true);

    input.value = '4';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('2');
    expect(confirm.disabled).toBe(false);
    confirm.click();

    expect(province.resources.gold).toBe(98);
    expect(province.resources.food).toBe(999);
    control.unmount();
  });
});

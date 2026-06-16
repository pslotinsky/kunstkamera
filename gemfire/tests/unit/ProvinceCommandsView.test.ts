import { describe, expect, it } from 'vitest';

import { createCommandGroups } from '@/core/commands/province/catalog';
import { WorldFactory } from '@/core/WorldFactory';
import { EventBus } from '@/lib/EventBus';
import { AmountFieldView } from '@/ui/ProvinceCommands/AmountField/AmountFieldView';
import { ConfirmCommandDialogView } from '@/ui/ProvinceCommands/CommandDialog/ConfirmCommandDialogView';
import { GiveFoodDialogView } from '@/ui/ProvinceCommands/CommandDialog/GiveFoodDialogView';
import { TradeDialogView } from '@/ui/ProvinceCommands/CommandDialog/TradeDialogView';
import { TransportDialogView } from '@/ui/ProvinceCommands/CommandDialog/TransportDialogView';
import styles from '@/ui/ProvinceCommands/ProvinceCommands.module.scss';
import { ProvinceCommandsView } from '@/ui/ProvinceCommands/ProvinceCommandsView';

describe('ProvinceCommandsView', () => {
  it('renders the menu hidden, closed, and disabled until a province takes the turn', () => {
    const world = new WorldFactory().create();
    const events = new EventBus();
    const commands = createCommandGroups({ world, events });
    const cultivationDialog = new ConfirmCommandDialogView(
      { name: 'CultivationCommand', prompt: '' },
      {},
    );
    const protectionDialog = new ConfirmCommandDialogView(
      { name: 'ProtectionCommand', prompt: '' },
      {},
    );
    const giveFoodDialog = new GiveFoodDialogView(
      { name: 'GiveFoodCommand' },
      {},
    );
    const tradeDialog = new TradeDialogView(
      { name: 'TradeCommand' },
      { amount: new AmountFieldView({ name: 'amount' }, {}) },
    );
    const transportDialog = new TransportDialogView(
      { name: 'TransportCommand' },
      {
        gold: new AmountFieldView({ name: 'gold' }, {}),
        food: new AmountFieldView({ name: 'food' }, {}),
      },
    );
    const markup = new ProvinceCommandsView(
      { world, commands, events },
      {
        cultivationDialog,
        protectionDialog,
        giveFoodDialog,
        tradeDialog,
        transportDialog,
      },
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

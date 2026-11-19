// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCommandGroups } from '@/core/commands/province/catalog';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { WorldFactory } from '@/core/WorldFactory';
import { AdviceControl } from '@/ui/Advice/AdviceControl';
import { CommandDialogsControl } from '@/ui/CommandDialogs/CommandDialogsControl';
import { ProvinceCommandsControl } from '@/ui/ProvinceCommands/ProvinceCommandsControl';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

interface Options {
  readonly hasAdvisor?: boolean;
  readonly isRivalTurn?: boolean;
}

function setup(options: Options = {}) {
  const advisor = new WorldFactory()
    .createAdvisors()
    .find((candidate) => candidate.name === 'Brannoc')!;
  const avar = makeGeneral({ name: 'Avar' });
  const player = makeFamily({ name: 'Alderwyn', ruler: avar });
  const home = makeProvince({
    number: 1,
    name: 'Whitehaven',
    neighbors: [2],
    family: player,
    governor: avar,
    gold: 200,
    food: 900,
    troops: 150,
  });
  const unclaimed = makeProvince({
    number: 2,
    name: 'Frostbreak',
    neighbors: [1],
  });
  const rivalSeat = makeProvince({
    number: 3,
    name: 'Varrenhold',
    family: makeFamily({ name: 'Varrengard' }),
  });

  player.moveHome(home);

  const context = makeWorld(
    [home, unclaimed, rivalSeat],
    player,
    undefined,
    (options.hasAdvisor ?? true) ? advisor : undefined,
  );
  const dialogs = new CommandDialogsControl(context);
  const advice = new AdviceControl(context);
  const commands = new ProvinceCommandsControl(
    context.world,
    createCommandGroups(context),
    context.events,
    dialogs,
    advice,
  );

  advanceTo(context.world, options.isRivalTurn ? rivalSeat : home);
  dialogs.mount(document.createElement('div'));
  advice.mount(document.body.appendChild(document.createElement('div')));
  commands.mount(document.body.appendChild(document.createElement('div')));
  commands.show();

  return { ...context, home };
}

function adviceButton(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    'button[data-action="advice"]',
  );
}

function isPanelOpen(): boolean {
  const panel = document.querySelector<HTMLElement>(
    '[aria-labelledby="advice-heading"]',
  )!;

  return ![...panel.classList].some((name) => name.includes('hidden'));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('AdviceControl', () => {
  it('speaks in the advisor’s own lines, naming the target', () => {
    setup();

    adviceButton()!.click();

    expect(isPanelOpen()).toBe(true);
    expect(document.querySelector('[data-line]')?.textContent).toBe(
      '“Frostbreak has no lord. March in and plant our banner.”',
    );
  });

  it('closes without spending the turn and returns focus to Advice', () => {
    const { events, home } = setup();
    const ended = vi.fn();
    const before = home.resources;
    events.subscribe(TurnEndedEvent, ended);

    adviceButton()!.click();
    document.querySelector<HTMLButtonElement>('[data-close]')!.click();

    expect(isPanelOpen()).toBe(false);
    expect(ended).not.toHaveBeenCalled();
    expect(home.resources).toBe(before);
    expect(document.activeElement).toBe(adviceButton());
  });

  it('offers no advice while a rival province takes its turn', () => {
    setup({ isRivalTurn: true });

    expect(adviceButton()!.disabled).toBe(true);
  });

  it('shows no Advice button in a campaign without an advisor', () => {
    setup({ hasAdvisor: false });

    expect(adviceButton()).toBeNull();
  });
});

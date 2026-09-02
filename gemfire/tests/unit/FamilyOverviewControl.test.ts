// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { ViewCommand } from '@/core/commands/province/ViewCommand';
import { HiredUnit } from '@/core/domain/HiredUnit';
import styles from '@/ui/FamilyOverview/FamilyOverview.module.scss';
import { FamilyOverviewControl } from '@/ui/FamilyOverview/FamilyOverviewControl';

import { makeFamily, makeProvince, makeWorld } from './factories';

function setup() {
  const mine = makeFamily({ name: 'Blanche' });
  const theirs = makeFamily({ name: 'Lyle' });
  const myProvince = makeProvince({
    number: 1,
    name: 'Lorraine',
    family: mine,
  });
  const theirProvince = makeProvince({
    number: 2,
    name: 'Anjou',
    family: theirs,
  });

  mine.moveHome(myProvince);
  theirs.moveHome(theirProvince);
  myProvince.addUnit(HiredUnit.ofName('Orks')!);
  theirProvince.addUnit(HiredUnit.ofName('Warriors')!);

  const { world, events } = makeWorld([myProvince, theirProvince], mine);
  const control = new FamilyOverviewControl(ViewCommand.name, world);
  const container = document.createElement('div');

  control.mount(container);
  control.open(new ViewCommand({ world, events }));

  const root = container.querySelector<HTMLElement>(`.${styles.root}`)!;

  return {
    myProvince,
    theirProvince,
    control,
    openUnitsTab: () =>
      root.querySelector<HTMLButtonElement>('[data-mode="units"]')!.click(),
    shown: () => !root.classList.contains(styles.hidden!),
    body: () => root.querySelector('[data-body]')!.textContent,
    house: () => root.querySelector('[data-family]')!.textContent,
  };
}

describe('FamilyOverviewControl', () => {
  it('stays shut until a province is picked, then opens on its house', () => {
    const screen = setup();

    expect(screen.shown()).toBe(false);

    screen.control.pickTarget(screen.theirProvince);

    expect(screen.shown()).toBe(true);

    expect(screen.house()).toBe('Lyle');
    expect(screen.body()).toContain('Anjou');
  });

  it('counts Fifth Units for your own house only', () => {
    const screen = setup();

    screen.control.pickTarget(screen.myProvince);
    screen.openUnitsTab();

    expect(screen.body()).toContain('Orks');

    screen.control.pickTarget(screen.theirProvince);
    screen.openUnitsTab();

    expect(screen.body()).not.toContain('Warriors');
    expect(screen.body()).toContain('Search');
  });
});

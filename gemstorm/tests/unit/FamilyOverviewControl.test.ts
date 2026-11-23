// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { ViewCommand } from '@/core/commands/province/ViewCommand';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';
import styles from '@/ui/screens/StrategyScreen/FamilyOverview/FamilyOverview.module.scss';
import { FamilyOverviewControl } from '@/ui/screens/StrategyScreen/FamilyOverview/FamilyOverviewControl';

import { makeFamily, makeProvince, makeWorld } from './factories';

function setup() {
  const mine = makeFamily({ name: 'Alderwyn', gems: [Gem.ofName('Voltryn')] });
  const theirs = makeFamily({ name: 'Stormmere' });
  const myProvince = makeProvince({
    number: 1,
    name: 'Lorraine',
    family: mine,
    hirePool: ['Pikemen'],
  });
  const theirProvince = makeProvince({
    number: 2,
    name: 'Anjou',
    family: theirs,
    gold: 314,
    food: 271,
    troops: 163,
  });

  const myOtherProvince = makeProvince({ number: 3, family: mine });
  const neutral = makeProvince({ number: 4, name: 'Hollow', food: 81 });
  myOtherProvince.fifthUnits.addUnit(HiredUnit.ofName('Ogre')!);

  mine.moveHome(myProvince);
  theirs.moveHome(theirProvince);
  myProvince.fifthUnits.addUnit(HiredUnit.ofName('Grimhides')!);
  theirProvince.fifthUnits.addUnit(HiredUnit.ofName('Warriors')!);

  const { world, events } = makeWorld(
    [myProvince, theirProvince, myOtherProvince, neutral],
    mine,
  );
  const control = new FamilyOverviewControl(ViewCommand.name, world);
  const container = document.createElement('div');

  control.mount(container);
  control.open(new ViewCommand({ world, events }));

  const root = container.querySelector<HTMLElement>(`.${styles.root}`)!;

  return {
    myProvince,
    theirProvince,
    neutral,
    control,
    openLandTab: () =>
      root.querySelector<HTMLButtonElement>('[data-mode="land"]')!.click(),
    tabsHidden: () => root.querySelector<HTMLElement>('[data-tabs]')!.hidden,
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

    expect(screen.house()).toBe('Stormmere');
    expect(screen.body()).toContain('Anjou');
  });

  it('counts Fifth Units for your own house only', () => {
    const screen = setup();

    screen.control.pickTarget(screen.myProvince);
    screen.openUnitsTab();

    expect(screen.body()).toContain('Grimhides');
    expect(screen.body()).toContain('Voltryn');
    expect(screen.body()).not.toContain('Ogre');
    expect(screen.body()).not.toContain('Pikemen');

    screen.control.pickTarget(screen.theirProvince);
    screen.openUnitsTab();

    expect(screen.body()).not.toContain('Warriors');
    expect(screen.body()).toContain('Search');
  });

  it('shows rival resources and shows neutral territory without family tabs', () => {
    const screen = setup();

    screen.control.pickTarget(screen.theirProvince);
    screen.openLandTab();
    expect(screen.body()).toContain('314');
    expect(screen.body()).toContain('271');
    expect(screen.body()).toContain('163');

    screen.control.pickTarget(screen.neutral);
    expect(screen.house()).toContain('Neutral');
    expect(screen.body()).toContain('81');
    expect(screen.tabsHidden()).toBe(true);

    screen.control.pickTarget(screen.myProvince);
    expect(screen.tabsHidden()).toBe(false);
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import styles from '@/ui/DefenseDialog/DefenseDialog.module.scss';
import { DefenseDialogControl } from '@/ui/DefenseDialog/DefenseDialogControl';

import {
  advanceTo,
  makeArmy,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

interface SetupParams {
  readonly troops?: number;
  readonly refuges?: number;
}

function setup(params: SetupParams = {}) {
  const ander = makeGeneral({ name: 'Ander' });
  const rival = makeFamily({ name: 'Lyle', ruler: ander });
  const erin = makeGeneral({ name: 'Erin' });
  const player = makeFamily({ name: 'Blanche', ruler: erin });
  const refuges = Array.from(
    { length: params.refuges ?? 0 },
    (_unused, index) =>
      makeProvince({ number: 10 + index, neighbors: [2], family: player }),
  );

  const source = makeProvince({
    number: 1,
    neighbors: [2],
    family: rival,
    governor: ander,
    gold: 200,
    troops: 500,
    food: 500,
  });
  const attacked = makeProvince({
    number: 2,
    name: 'Hyland',
    neighbors: [1, ...refuges.map((refuge) => refuge.number)],
    family: player,
    governor: erin,
    troops: params.troops ?? 100,
    food: 100,
  });

  attacked.addUnit(HiredUnit.ofName('Orks')!);
  player.homeProvince = attacked;

  const { world, events } = makeWorld([source, attacked, ...refuges], player);
  const container = document.createElement('div');
  const published: object[] = [];

  document.body.append(container);
  new DefenseDialogControl({ world, events }).mount(container);

  for (const kind of [
    BattleStartedEvent,
    BattleReportedEvent,
    TurnEndedEvent,
  ]) {
    events.subscribe(kind, (event: object) => published.push(event));
  }

  advanceTo(world, source);

  const attack = new AttackCommand({ world, events });

  attack.attackAt(
    attacked,
    makeArmy({ commander: ander, troops: 400, food: 400 }),
  );
  attack.execute();

  const root = container.querySelector<HTMLElement>(`.${styles.root}`)!;
  const button = (selector: string) =>
    root.querySelector<HTMLButtonElement>(selector)!;

  return { root, button, published, refuges };
}

describe('DefenseDialogControl', () => {
  afterEach(() => document.body.replaceChildren());

  it('offers only the answers the province can give', () => {
    const { button } = setup({ troops: 0, refuges: 1 });

    expect(button('[data-answer="fight"]').disabled).toBe(true);
    expect(button('[data-answer="retreat"]').disabled).toBe(false);
    expect(button('[data-answer="surrender"]').disabled).toBe(true);
  });

  it('fights with the Fifth Unit standing in the province', () => {
    const { button, published, root } = setup();

    button('[data-answer="fight"]').click();

    const started = published[0] as BattleStartedEvent;

    expect(started.battle.defender.unit?.name).toBe('Orks');
    expect(root.classList.contains(styles.hidden!)).toBe(true);
    expect(published.some((event) => event instanceof TurnEndedEvent)).toBe(
      false,
    );
  });

  it('asks where to flee when there is more than one refuge, then ends the turn', () => {
    const { button, published, refuges, root } = setup({
      troops: 0,
      refuges: 2,
    });

    button('[data-answer="retreat"]').click();

    expect(
      root.querySelector('[data-fleeing]')!.classList.contains(styles.hidden!),
    ).toBe(false);

    button('[data-flee]').click();

    const reported = published[0] as BattleReportedEvent;

    expect(refuges).toContain(reported.report.refuge);
    expect(published[published.length - 1]).toBeInstanceOf(TurnEndedEvent);
  });
});

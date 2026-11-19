import { describe, expect, it } from 'vitest';

import { AllianceAnswerCommand } from '@/core/commands/AllianceAnswerCommand';
import { AllyCommand } from '@/core/commands/province/AllyCommand';
import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { NegotiateCommand } from '@/core/commands/province/NegotiateCommand';
import { PlunderCommand } from '@/core/commands/province/PlunderCommand';
import { SabotageCommand } from '@/core/commands/province/SabotageCommand';
import { AllianceOfferedEvent } from '@/core/events/AllianceOfferedEvent';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';

import { advanceTo, makeFamily, makeProvince, makeWorld } from './factories';

function setup() {
  const alderwyn = makeFamily({ name: 'Alderwyn' });
  const stormmere = makeFamily({ name: 'Stormmere' });
  const varrengard = makeFamily({ name: 'Varrengard', royal: true });

  const home = makeProvince({
    number: 1,
    neighbors: [2, 3, 4],
    family: alderwyn,
    troops: 100,
  });
  const outpost = makeProvince({ number: 2, neighbors: [1], family: alderwyn });
  const pineward = makeProvince({
    number: 3,
    neighbors: [1],
    family: stormmere,
  });
  const crown = makeProvince({ number: 4, neighbors: [1], family: varrengard });

  alderwyn.moveHome(home);

  const { world, events } = makeWorld(
    [home, outpost, pineward, crown],
    alderwyn,
  );
  const context = { world, events };
  const reports: MissionReportedEvent[] = [];

  events.subscribe(MissionReportedEvent, (event) => reports.push(event));
  advanceTo(world, home);

  return {
    world,
    context,
    alderwyn,
    stormmere,
    home,
    outpost,
    pineward,
    reports,
  };
}

describe('AllyCommand', () => {
  it('is issued from the home province alone', () => {
    const { world, context, outpost } = setup();
    const command = new AllyCommand(context);

    expect(command.canExecute()).toBe(true);

    advanceTo(world, outpost);

    expect(command.canExecute()).toBe(false);
    expect(command.selectableTargets).toEqual([]);
  });

  it('offers every family but your own and the royal one, and none while allied', () => {
    const { context, alderwyn, stormmere } = setup();
    const command = new AllyCommand(context);

    expect(command.selectableTargets).toEqual([3]);

    alderwyn.formAlliance(stormmere);

    expect(command.selectableTargets).toEqual([]);
  });

  it('breaks an alliance on both sides, and lets the two houses fight again', () => {
    const { context, alderwyn, stormmere, reports } = setup();
    const command = new AllyCommand(context);

    alderwyn.formAlliance(stormmere);
    command.execute();

    expect(alderwyn.ally).toBeUndefined();
    expect(stormmere.ally).toBeUndefined();
    expect(reports[0]?.outcome).toEqual({ kind: 'break', family: stormmere });
    expect(new AttackCommand(context).selectableTargets).toContain(3);
  });

  it('keeps every hostile order away from an ally', () => {
    const { context, alderwyn, stormmere } = setup();

    alderwyn.formAlliance(stormmere);

    for (const command of [
      new AttackCommand(context),
      new NegotiateCommand(context),
      new SabotageCommand(context),
      new PlunderCommand(context),
    ]) {
      expect(command.selectableTargets).toEqual([4]);
    }
  });
});

describe('A rival offering the player an alliance', () => {
  function offer() {
    const context = setup();
    const { world, stormmere, pineward, alderwyn } = context;
    const offers: AllianceOfferedEvent[] = [];

    stormmere.homeProvince = pineward;
    context.context.events.subscribe(AllianceOfferedEvent, (event) =>
      offers.push(event),
    );
    advanceTo(world, pineward);

    const command = new AllyCommand(context.context);

    command.proposeTo(alderwyn);
    command.execute();

    return { ...context, command, offers };
  }

  it('waits for the player instead of rolling for them', () => {
    const { command, offers, stormmere, alderwyn } = offer();

    expect(command.suspendsTurn()).toBe(true);
    expect(offers.map((each) => each.proposer)).toEqual([stormmere]);
    expect(alderwyn.ally).toBeUndefined();
  });

  it('forms the alliance only when the player accepts', () => {
    const accepted = offer();
    const declined = offer();

    for (const [each, answer] of [
      [accepted, true],
      [declined, false],
    ] as const) {
      const reply = new AllianceAnswerCommand(each.context);

      reply.answer(each.stormmere, answer);
      reply.execute();
    }

    expect(accepted.alderwyn.ally).toBe(accepted.stormmere);
    expect(declined.alderwyn.ally).toBeUndefined();
  });
});

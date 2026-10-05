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
  const blanche = makeFamily({ name: 'Blanche' });
  const lyle = makeFamily({ name: 'Lyle' });
  const lankshire = makeFamily({ name: 'Lankshire', royal: true });

  const home = makeProvince({
    number: 1,
    neighbors: [2, 3, 4],
    family: blanche,
    troops: 100,
  });
  const outpost = makeProvince({ number: 2, neighbors: [1], family: blanche });
  const hyland = makeProvince({ number: 3, neighbors: [1], family: lyle });
  const crown = makeProvince({ number: 4, neighbors: [1], family: lankshire });

  blanche.moveHome(home);

  const { world, events } = makeWorld([home, outpost, hyland, crown], blanche);
  const context = { world, events };
  const reports: MissionReportedEvent[] = [];

  events.subscribe(MissionReportedEvent, (event) => reports.push(event));
  advanceTo(world, home);

  return { world, context, blanche, lyle, home, outpost, hyland, reports };
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
    const { context, blanche, lyle } = setup();
    const command = new AllyCommand(context);

    expect(command.selectableTargets).toEqual([3]);

    blanche.formAlliance(lyle);

    expect(command.selectableTargets).toEqual([]);
  });

  it('breaks an alliance on both sides, and lets the two houses fight again', () => {
    const { context, blanche, lyle, reports } = setup();
    const command = new AllyCommand(context);

    blanche.formAlliance(lyle);
    command.execute();

    expect(blanche.ally).toBeUndefined();
    expect(lyle.ally).toBeUndefined();
    expect(reports[0]?.outcome).toEqual({ kind: 'break', family: lyle });
    expect(new AttackCommand(context).selectableTargets).toContain(3);
  });

  it('keeps every hostile order away from an ally', () => {
    const { context, blanche, lyle } = setup();

    blanche.formAlliance(lyle);

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
    const { world, lyle, hyland, blanche } = context;
    const offers: AllianceOfferedEvent[] = [];

    lyle.homeProvince = hyland;
    context.context.events.subscribe(AllianceOfferedEvent, (event) =>
      offers.push(event),
    );
    advanceTo(world, hyland);

    const command = new AllyCommand(context.context);

    command.proposeTo(blanche);
    command.execute();

    return { ...context, command, offers };
  }

  it('waits for the player instead of rolling for them', () => {
    const { command, offers, lyle, blanche } = offer();

    expect(command.suspendsTurn()).toBe(true);
    expect(offers.map((each) => each.proposer)).toEqual([lyle]);
    expect(blanche.ally).toBeUndefined();
  });

  it('forms the alliance only when the player accepts', () => {
    const accepted = offer();
    const declined = offer();

    for (const [each, answer] of [
      [accepted, true],
      [declined, false],
    ] as const) {
      const reply = new AllianceAnswerCommand(each.context);

      reply.answer(each.lyle, answer);
      reply.execute();
    }

    expect(accepted.blanche.ally).toBe(accepted.lyle);
    expect(declined.blanche.ally).toBeUndefined();
  });
});

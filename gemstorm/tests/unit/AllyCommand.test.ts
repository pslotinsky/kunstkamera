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

function setup(withAlternate = false) {
  const alderwyn = makeFamily({ name: 'Alderwyn' });
  const stormmere = makeFamily({ name: 'Stormmere' });
  const varrengard = makeFamily({ name: 'Varrengard', royal: true });
  const greyfen = makeFamily({ name: 'Greyfen' });

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
  const distant = makeProvince({ number: 5, family: greyfen });

  alderwyn.moveHome(home);

  const provinces = [home, outpost, pineward, crown];
  if (withAlternate) {
    provinces.push(distant);
  }
  const { world, events } = makeWorld(provinces, alderwyn);
  const context = { world, events };
  const reports: MissionReportedEvent[] = [];

  events.subscribe(MissionReportedEvent, (event) => reports.push(event));
  advanceTo(world, home);

  return {
    world,
    context,
    alderwyn,
    stormmere,
    greyfen,
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

  it('offers every other non-royal house except the current ally', () => {
    const { context, alderwyn, stormmere } = setup(true);
    const command = new AllyCommand(context);

    expect(command.selectableTargets).toEqual([3, 5]);

    alderwyn.formAlliance(stormmere);

    expect(command.selectableTargets).toEqual([5]);
  });

  it('breaks an alliance on both sides, and lets the two houses fight again', () => {
    const { context, alderwyn, stormmere, home, reports } = setup();
    const command = new AllyCommand(context);

    alderwyn.formAlliance(stormmere);
    command.execute();

    expect(alderwyn.ally).toBeUndefined();
    expect(stormmere.ally).toBeUndefined();
    expect(reports[0]?.outcome).toEqual({ kind: 'break', family: stormmere });
    expect(new AttackCommand(context).selectableTargets).toContain(3);
    expect(home.actionCount).toBe(1);
    expect(home.goodwill).toBe(0);
  });

  it('replaces the current pact only when the new house accepts', () => {
    const { context, alderwyn, stormmere, greyfen, reports } = setup(true);
    const command = new AllyCommand(context);
    alderwyn.formAlliance(stormmere);
    greyfen.ruler.stats = alderwyn.ruler.stats.increase({ charisma: 1 });

    command.proposeTo(greyfen);
    command.execute();

    expect(alderwyn.ally).toBe(stormmere);

    greyfen.ruler.stats = alderwyn.ruler.stats;
    command.proposeTo(greyfen);
    command.execute();

    expect(reports.map(({ outcome }) => outcome)).toEqual([
      { kind: 'alliance', family: greyfen, accepted: false },
      { kind: 'alliance', family: greyfen, accepted: true },
    ]);
    expect(stormmere.ally).toBeUndefined();
    expect(greyfen.ally).toBe(alderwyn);
    expect(alderwyn.ally).toBe(greyfen);
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
  function offer(withExistingPact = false) {
    const context = setup(withExistingPact);
    const { world, stormmere, pineward, alderwyn, greyfen } = context;
    const offers: AllianceOfferedEvent[] = [];

    if (withExistingPact) {
      alderwyn.formAlliance(greyfen);
    }
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
    const accepted = offer(true);
    const declined = offer(true);

    for (const [each, answer] of [
      [accepted, true],
      [declined, false],
    ] as const) {
      const reply = new AllianceAnswerCommand(each.context);

      reply.answer(each.stormmere, answer);
      reply.execute();
    }

    expect(accepted.alderwyn.ally).toBe(accepted.stormmere);
    expect(accepted.greyfen.ally).toBeUndefined();
    expect(declined.alderwyn.ally).toBe(declined.greyfen);
  });
});

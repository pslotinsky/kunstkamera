import { afterEach, describe, expect, it, vi } from 'vitest';

import { ComputerPlayer } from '@/core/ai/ComputerPlayer';
import { CommandExecutor } from '@/core/CommandExecutor';
import { CrownCommand } from '@/core/commands/CrownCommand';
import { JudgeCaptiveCommand } from '@/core/commands/JudgeCaptiveCommand';
import { LifecycleCommand } from '@/core/commands/LifecycleCommand';
import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import { NegotiateCommand } from '@/core/commands/province/NegotiateCommand';
import { RecruitCommand } from '@/core/commands/province/RecruitCommand';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { Coronation } from '@/core/domain/Coronation';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Succession } from '@/core/domain/Succession';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { CampaignEndedEvent } from '@/core/events/CampaignEndedEvent';
import { DefenseRequestedEvent } from '@/core/events/DefenseRequestedEvent';
import { MonthEndedEvent } from '@/core/events/MonthEndedEvent';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { SuccessionReportedEvent } from '@/core/events/SuccessionReportedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnHeldEvent } from '@/core/events/TurnHeldEvent';
import { TurnReleasedEvent } from '@/core/events/TurnReleasedEvent';
import { TurnScheduledEvent } from '@/core/events/TurnScheduledEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { WarReportedEvent } from '@/core/events/WarReportedEvent';
import { WorldEngine } from '@/core/WorldEngine';

import {
  advanceTo,
  makeArmy,
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeOutcome,
  makeProvince,
  makeWorld,
} from './factories';

function execute(context: WorldCommandContext, command: WorldCommand): void {
  const executor = new CommandExecutor(context);

  executor.execute(command);
}

function island() {
  const player = makeFamily({ name: 'Blanche', fame: 200 });
  const rival = makeFamily({
    name: 'Lyle',
    fame: 0,
    gems: [Gem.ofName('Empyron')],
  });
  const provinces = Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    const family = number === 30 ? rival : player;

    return makeProvince({
      number,
      family,
      governor: family.ruler,
      neighbors: number === 29 ? [30] : [29],
      troops: number === 30 ? 0 : 100,
      gold: 200,
      food: 200,
    });
  });
  const source = provinces[28]!;
  const target = provinces[29]!;

  player.moveHome(provinces[0]!);
  rival.moveHome(target);

  const context = makeWorld(provinces, player);

  advanceTo(context.world, source);

  return { ...context, player, rival, source, target, provinces };
}

describe('Campaign outcome', () => {
  afterEach(() => vi.restoreAllMocks());

  it('requires all 30 provinces, regardless of alliances and Gems', () => {
    const { world, player, rival, target } = island();

    player.formAlliance(rival);
    player.gems = [
      'Pluvius',
      'Zendor',
      'Skulryk',
      'Empyron',
      'Scylla',
      'Chylla',
      'Dragon',
    ].map((name) => Gem.ofName(name));

    expect(world.campaign.assess()).toBeUndefined();

    world.dissolve(rival);
    target.unclaim();

    expect(world.campaign.assess()).toBeUndefined();

    player.gems = [];
    target.claim(player);

    expect(world.campaign.assess()?.isVictory).toBe(true);
    expect(world.campaign.assess()).toBeUndefined();
  });

  it('does not award victory while an independent rival remains', () => {
    const { world, player, target } = island();

    target.claim(player);

    expect(world.campaign.assess()).toBeUndefined();
  });

  it('keeps the outcome and names when a dissolved house name is reused', () => {
    const { world, player, rival } = island();

    world.absorb(player, rival);
    const replacement = makeFamily({ name: player.name });

    world.families.add(replacement.name, replacement);
    const outcome = world.campaign.assess();

    expect(outcome?.reason).toBe('absorption');
    expect(outcome?.rival).toBe('Lyle');
    expect(outcome?.ruler).toBe(player.ruler.name);

    player.crown(makeGeneral({ name: 'Later ruler' }));
    world.date = world.date.next();

    expect(world.campaign.assess()).toBeUndefined();
    expect(world.campaign.outcome).toBe(outcome);
    expect(outcome?.ruler).not.toBe('Later ruler');
    expect(outcome?.date.month).toBe(4);
  });

  it('does not treat a same-named replacement as the original player house', () => {
    const { world, player } = island();
    const replacement = makeFamily({ name: player.name });

    world.families.add(replacement.name, replacement);
    for (const province of world.map.provinces) {
      province.claim(replacement);
    }

    expect(world.campaign.assess()?.isVictory).toBe(false);
  });

  it('defeats a landless player even if the family is still registered', () => {
    const { world, player, rival } = island();

    for (const province of world.getFamilyProvinces(player)) {
      province.claim(rival);
    }

    expect(world.campaign.assess()?.reason).toBe('last-province-lost');
  });

  it('waits for the selected heir and continues the same house', () => {
    const { world, player, events, source } = island();
    const heirs = ['Pender', 'Karl'].map((name) =>
      makeGeneral({ name, lineage: player.name }),
    );

    for (const heir of heirs) {
      player.enlist(heir);
    }
    world.bury(player.ruler);
    const succession = new Succession(world).replace(player);

    expect(succession).toBeInstanceOf(Coronation);
    expect(world.campaign.isAwaitingHeir).toBe(true);
    expect(world.campaign.assess()).toBeUndefined();

    const recruit = new RecruitCommand({ world, events });
    const troops = source.resources.troops;

    recruit.recruit(10);
    execute({ world, events }, recruit);

    expect(source.resources.troops).toBe(troops);

    if (succession instanceof Coronation) {
      const crown = new CrownCommand({ world, events });

      crown.crown(succession, heirs[1]!);
      execute({ world, events }, crown);
    }

    expect(player.ruler).toBe(heirs[1]);
    expect(world.campaign.isAwaitingHeir).toBe(false);
    expect(world.campaign.outcome).toBeUndefined();

    execute({ world, events }, recruit);

    expect(source.resources.troops).toBe(troops + 10);
  });

  it('settles breakaways before defeat and never credits a Gem beneficiary for old age', () => {
    const { world, player, source, rival } = island();
    const lord = makeGeneral({ name: 'Pender' });
    const deposed = player.ruler;

    player.enlist(lord);
    source.assignGovernor(lord);
    player.gems = rival.gems;
    world.bury(deposed);
    new Succession(world).replace(player);

    expect(world.campaign.outcome).toBeUndefined();
    expect(source.family).not.toBe(player);
    expect(source.family?.ruler).toBe(lord);
    expect(source.family?.gems).toHaveLength(1);

    const outcome = world.campaign.assess();

    expect(outcome?.reason).toBe('no-heir');
    expect(outcome?.ruler).toBe(deposed.name);
    expect(outcome?.rival).toBeUndefined();
  });
});

describe('Campaign completion through game actions', () => {
  afterEach(() => vi.restoreAllMocks());

  it('ends an AI turn after recruiting the player ruler, before another captive or order', () => {
    const context = island();
    const { world, events, player, rival, target } = context;
    const captive = makeCaptive({
      general: player.ruler,
      house: player,
      captor: rival,
    });
    const other = makeGeneral({ name: 'Pender' });
    const second = makeCaptive({
      general: other,
      house: player,
      captor: rival,
    });
    const computer = new ComputerPlayer(context);
    const endings: CampaignEndedEvent[] = [];

    player.enlist(other);
    world.hold(captive);
    world.hold(second);
    advanceTo(world, target);
    events.subscribe(CampaignEndedEvent, (event) => endings.push(event));
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    computer.play(target);
    computer.play(target);

    expect(world.campaign.outcome?.reason).toBe('absorption');
    expect(world.isHeld(captive.general)).toBe(false);
    expect(world.isHeld(other)).toBe(true);
    expect(target.resources.gold).toBe(200);
    expect(target.resources.troops).toBe(0);
    expect(endings).toHaveLength(1);
  });

  it('suspends the AI turn when its order requests a player defense', () => {
    const context = island();
    const { world, events, source, target } = context;
    const computer = new ComputerPlayer(context);
    const defenses: DefenseRequestedEvent[] = [];

    target.addResources({ troops: 300 });
    advanceTo(world, target);
    events.subscribe(DefenseRequestedEvent, (event) => defenses.push(event));
    vi.spyOn(Math, 'random').mockReturnValue(0.999);

    const suspended = computer.play(target);

    expect(suspended).toBe(true);
    expect(defenses).toHaveLength(1);
    expect(defenses[0]!.invasion.target).toBe(source);
    expect(target.actionCount).toBe(1);
    expect(world.campaign.isEnded).toBe(false);
  });

  it('pauses AI orders when a banishment requires the player to choose an heir', () => {
    const context = island();
    const { world, player, rival, target } = context;
    const heirs = ['Pender', 'Karl'].map((name) =>
      makeGeneral({ name, lineage: player.name }),
    );
    const captive = makeCaptive({
      general: player.ruler,
      house: player,
      captor: rival,
    });
    const computer = new ComputerPlayer(context);

    for (const heir of heirs) {
      player.enlist(heir);
    }

    world.hold(captive);
    advanceTo(world, target);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    computer.play(target);

    expect(world.campaign.isAwaitingHeir).toBe(true);
    expect(world.campaign.isEnded).toBe(false);
    expect(target.actionCount).toBe(0);
    expect(target.resources.gold).toBe(200);
    expect(target.resources.troops).toBe(0);
  });

  it('resumes deferred upkeep once after an heir is chosen during a turn', async () => {
    const context = island();
    const { world, events, player, rival } = context;
    const heirs = ['Pender', 'Karl'].map((name) =>
      makeGeneral({ name, lineage: player.name }),
    );

    for (const heir of heirs) {
      player.enlist(heir);
    }

    world.date = new CalendarDate(1186, 3);
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    new WorldEngine(world, events).start();

    const province = world.turnQueue.current!;
    const turnNumber = world.turnQueue.turnNumber;
    const gold = province.resources.gold;
    const unit = HiredUnit.ofName('Orks')!;
    const captive = makeCaptive({
      general: player.ruler,
      house: player,
      captor: rival,
    });
    const judge = new JudgeCaptiveCommand(context);
    const holder = {};
    let coronation: Coronation | undefined;

    province.addUnit(unit);
    world.hold(captive);
    events.subscribe(SuccessionReportedEvent, (event) => {
      if (event.outcome instanceof Coronation) {
        coronation = event.outcome;
        events.publish(new TurnHeldEvent(holder));
      }
    });
    judge.judge(captive, 'banish');
    execute(context, judge);
    events.publish(new TurnEndedEvent(turnNumber));
    events.publish(new TurnEndedEvent(turnNumber));
    events.publish(new TurnScheduledEvent());

    expect(world.turnQueue.current).toBe(province);
    expect(province.resources.gold).toBe(gold);

    const crown = new CrownCommand(context);

    crown.crown(coronation!, heirs[1]!);
    execute(context, crown);
    events.publish(new TurnReleasedEvent(holder));
    events.publish(new TurnReleasedEvent(holder));
    await Promise.resolve();
    events.publish(new TurnEndedEvent(turnNumber));

    expect(world.turnQueue.turnNumber).toBe(turnNumber + 1);
    expect(province.resources.gold).toBe(gold - unit.cost);
    expect(player.ruler).toBe(heirs[1]);
  });

  it('resumes the remaining January deaths without aging survivors twice', async () => {
    const date = new CalendarDate(1200, 1);
    const ruler = makeGeneral({ deathDate: date });
    const heirs = ['Pender', 'Karl'].map((name) =>
      makeGeneral({
        name,
        lineage: 'Blanche',
        birth: new CalendarDate(1170, 1),
      }),
    );
    const lord = makeGeneral({ name: 'Erven', deathDate: date });
    const player = makeFamily({
      name: 'Blanche',
      ruler,
      members: [ruler, ...heirs, lord],
    });
    const rival = makeFamily({ name: 'Lyle' });
    const home = makeProvince({ number: 1, family: player, governor: ruler });
    const other = makeProvince({
      number: 2,
      family: rival,
      governor: rival.ruler,
    });
    const context = makeWorld([home, other], player, date);
    const { world, events } = context;
    const holder = {};
    let coronation: Coronation | undefined;

    events.subscribe(SuccessionReportedEvent, (event) => {
      if (event.outcome instanceof Coronation) {
        coronation = event.outcome;
        events.publish(new TurnHeldEvent(holder));
      }
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    new WorldEngine(world, events).start();

    const agedWar = heirs[1]!.stats.war;

    expect(world.generals.all).toContain(lord);
    expect(agedWar).toBeGreaterThan(50);

    const crown = new CrownCommand(context);

    crown.crown(coronation!, heirs[1]!);
    execute(context, crown);
    events.publish(new TurnReleasedEvent(holder));
    await Promise.resolve();

    expect(world.generals.all).not.toContain(lord);
    expect(heirs[1]!.stats.war).toBe(agedWar);
    expect(world.date).toBe(date);
    expect(world.turnQueue.current).toBe(home);
  });

  it('wins on a neutral claim only after moving the troops and reports the ending once', () => {
    const context = island();
    const { world, events, source, target, rival } = context;
    const endings: CampaignEndedEvent[] = [];
    const command = new MoveTroopsCommand(context);

    world.dissolve(rival);
    target.unclaim();
    events.subscribe(CampaignEndedEvent, (event) => endings.push(event));
    events.subscribe(ProvinceUpdatedEvent, () => {
      expect(world.campaign.outcome?.isVictory).toBe(true);
      expect(target.resources.troops).toBe(10);
    });
    command.moveTo(target, { troops: 10 });
    execute(context, command);
    execute(context, command);

    expect(endings).toHaveLength(1);
    expect(source.resources.troops).toBe(90);
    expect(target.resources.troops).toBe(10);
  });

  it('wins through surrender after transferring all members and Gems', () => {
    const context = island();
    const { world, events, player, rival, target } = context;
    const command = new NegotiateCommand(context);
    const endings: CampaignEndedEvent[] = [];

    vi.spyOn(Math, 'random').mockReturnValue(0);
    events.subscribe(CampaignEndedEvent, (event) => {
      endings.push(event);
      expect(target.family).toBe(player);
      expect(player.members).toContain(rival.ruler);
      expect(player.gems).toHaveLength(1);
      expect(world.families.all).not.toContain(rival);
    });
    command.demandSurrender(rival);
    execute(context, command);

    expect(endings).toHaveLength(1);
    expect(world.campaign.outcome?.isVictory).toBe(true);
  });

  it.each(['victory', 'defeat'] as const)(
    'ruler recruitment produces %s, while capture alone does not',
    (result) => {
      const context = island();
      const { world, player, rival } = context;
      const house = result === 'victory' ? rival : player;
      const captor = result === 'victory' ? player : rival;
      const captive = makeCaptive({ general: house.ruler, house, captor });
      const judge = new JudgeCaptiveCommand(context);

      world.hold(captive);
      expect(world.campaign.assess()).toBeUndefined();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      judge.judge(captive, 'recruit');
      execute(context, judge);

      expect(world.campaign.outcome?.isVictory).toBe(result === 'victory');
      expect(world.isHeld(captive.general)).toBe(false);
      expect(world.campaign.outcome?.reason).toBe(
        result === 'victory' ? 'unification' : 'absorption',
      );
    },
  );

  it('wins a conceded invasion after spoils and transfers, before the report is published', () => {
    const context = island();
    const { world, events, source, target, player } = context;
    const order: string[] = [];
    const command = new AttackCommand(context);

    events.subscribe(BattleReportedEvent, () => {
      order.push('battle');
      expect(world.campaign.outcome?.isVictory).toBe(true);
      expect(target.family).toBe(player);
      expect(target.resources.gold).toBe(100);
      expect(target.resources.troops).toBe(50);
    });
    events.subscribe(CampaignEndedEvent, () => order.push('ending'));
    command.attackAt(
      target,
      makeArmy({ commander: source.governor!, troops: 50, food: 100 }),
    );
    execute(context, command);

    expect(order).toEqual(['battle', 'ending']);
  });

  it('waits for a fought invasion, then ignores late battle and turn events', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const context = island();
    const { world, events, source, target } = context;

    target.addResources({ troops: 100 });
    new WorldEngine(world, events).start();

    for (
      let turn = 0;
      turn < world.map.provinces.length && world.turnQueue.current !== source;
      turn += 1
    ) {
      events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
    }

    expect(world.turnQueue.current).toBe(source);

    const attack = new AttackCommand(context);
    const endings: CampaignEndedEvent[] = [];

    events.subscribe(CampaignEndedEvent, (event) => endings.push(event));
    attack.attackAt(
      target,
      makeArmy({ commander: source.governor!, troops: 50, food: 100 }),
    );
    execute(context, attack);

    expect(world.campaign.isEnded).toBe(false);

    const endingDate = world.date;
    const endingTurn = world.turnQueue.turnNumber;

    events.publish(new BattleEndedEvent(makeOutcome()));
    const gold = source.resources.gold;
    const recruit = new RecruitCommand(context);

    recruit.recruit(20);
    execute(context, recruit);
    events.publish(new BattleEndedEvent(makeOutcome()));
    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
    events.publish(new MonthEndedEvent(world.date));
    events.publish(new MonthStartedEvent(world.date));
    events.publish(new TurnScheduledEvent());
    events.publish(new TurnReleasedEvent({}));
    await Promise.resolve();

    expect(world.campaign.outcome?.isVictory).toBe(true);
    expect(world.date).toBe(endingDate);
    expect(world.turnQueue.turnNumber).toBe(endingTurn);
    expect(world.turnQueue.current).toBe(source);
    expect(source.resources.gold).toBe(gold);
    expect(endings).toHaveLength(1);
  });

  it('defeats the player when an entrusted final province falls automatically', () => {
    const rival = makeFamily({ name: 'Lyle' });
    const lord = makeGeneral({ name: 'Pender' });
    const player = makeFamily({ name: 'Blanche', members: [lord] });
    const source = makeProvince({
      number: 1,
      family: rival,
      governor: rival.ruler,
      neighbors: [2],
      gold: 200,
      troops: 100,
      food: 200,
    });
    const target = makeProvince({
      number: 2,
      family: player,
      governor: lord,
      neighbors: [1],
    });
    const context = makeWorld([source, target], player);
    const order: string[] = [];

    target.entrust();
    advanceTo(context.world, source);
    context.events.subscribe(WarReportedEvent, () => order.push('war'));
    context.events.subscribe(CampaignEndedEvent, () => order.push('ending'));
    const attack = new AttackCommand(context);

    attack.attackAt(
      target,
      makeArmy({ commander: rival.ruler, troops: 50, food: 100 }),
    );
    execute(context, attack);

    expect(context.world.campaign.outcome?.reason).toBe('last-province-lost');
    expect(context.world.campaign.outcome?.rival).toBe('Lyle');
    expect(order).toEqual(['war', 'ending']);
  });

  it('retains the current month when the last province is claimed on the final turn', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const context = island();
    const { world, events, player, source, target, rival } = context;

    world.dissolve(rival);
    source.unclaim();
    target.claim(player);
    target.assignGovernor(player.ruler);
    new WorldEngine(world, events).start();

    for (let turn = 1; turn < 29; turn += 1) {
      events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
    }

    expect(world.turnQueue.current).toBe(target);
    const now = world.date;
    const move = new MoveTroopsCommand(context);

    target.addResources({ troops: 10 });
    move.moveTo(source, { troops: 10 });
    execute(context, move);
    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));

    expect(world.campaign.outcome?.isVictory).toBe(true);
    expect(world.date).toBe(now);
  });

  it('stops a monthly death sequence before another death, tax, or a province turn', () => {
    const date = new CalendarDate(1230, 9);
    const ruler = makeGeneral({ name: 'Erin', deathDate: date });
    const player = makeFamily({ name: 'Blanche', ruler });
    const otherRuler = makeGeneral({ name: 'Seth', deathDate: date });
    const rival = makeFamily({ name: 'Lyle', ruler: otherRuler });
    const mine = makeProvince({ number: 1, family: player, governor: ruler });
    const theirs = makeProvince({
      number: 2,
      family: rival,
      governor: otherRuler,
    });
    const { world, events } = makeWorld([mine, theirs], player, date);
    const reports: object[] = [];
    const turns: TurnStartedEvent[] = [];

    vi.spyOn(Math, 'random').mockReturnValue(0);
    events.subscribe(SuccessionReportedEvent, (event) => reports.push(event));
    events.subscribe(TurnStartedEvent, (event) => turns.push(event));
    new WorldEngine(world, events).start();

    expect(world.campaign.outcome?.reason).toBe('no-heir');
    expect(world.generals.all).toContain(otherRuler);
    expect(theirs.resources.gold).toBe(0);
    expect(reports).toHaveLength(1);
    expect(turns).toEqual([]);
    expect(world.date).toBe(date);
  });

  it('does not mistake an heirless rival for unification while land becomes unclaimed', () => {
    const context = island();
    const { world, target, rival } = context;

    world.date = rival.ruler.deathDate;
    vi.spyOn(Math, 'random').mockReturnValue(0);
    // Only the rival is due to die.
    vi.spyOn(world.player.ruler, 'getDeathRisk').mockReturnValue(0);
    const lifecycle = new LifecycleCommand(context);

    execute(context, lifecycle);

    expect(target.isNeutral()).toBe(true);
    expect(world.campaign.isEnded).toBe(false);
  });

  it('recognizes a final defection when the rival ruler has already lost the home province', () => {
    const context = island();
    const { world, player, rival, target, provinces } = context;
    const lord = makeGeneral({ name: 'Seth' });

    rival.homeProvince = provinces[0]!;
    rival.enlist(lord);
    target.assignGovernor(lord);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const negotiate = new NegotiateCommand(context);

    negotiate.persuade(lord);
    execute(context, negotiate);

    expect(target.family).toBe(player);
    expect(world.families.all).not.toContain(rival);
    expect(world.campaign.outcome?.isVictory).toBe(true);
  });

  it('waits for the player’s heir choice before resuming the month and paying tax', async () => {
    const date = new CalendarDate(1200, 9);
    const ruler = makeGeneral({ name: 'Erin', deathDate: date });
    const heirs = ['Pender', 'Karl'].map((name) =>
      makeGeneral({ name, lineage: 'Blanche' }),
    );
    const player = makeFamily({
      name: 'Blanche',
      ruler,
      members: [ruler, ...heirs],
    });
    const rival = makeFamily({ name: 'Lyle' });
    const home = makeProvince({
      number: 1,
      family: player,
      governor: ruler,
      gold: 10,
    });
    const other = makeProvince({
      number: 2,
      family: rival,
      governor: rival.ruler,
    });
    const context = makeWorld([home, other], player, date);
    const holder = {};
    let coronation: Coronation | undefined;

    context.events.subscribe(SuccessionReportedEvent, (event) => {
      if (event.outcome instanceof Coronation) {
        coronation = event.outcome;
        context.events.publish(new TurnHeldEvent(holder));
      }
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    new WorldEngine(context.world, context.events).start();

    expect(coronation).toBeDefined();
    expect(home.resources.gold).toBe(10);
    expect(context.world.campaign.outcome).toBeUndefined();

    const crown = new CrownCommand(context);

    crown.crown(coronation!, heirs[1]!);
    execute(context, crown);
    context.events.publish(new TurnReleasedEvent(holder));
    await Promise.resolve();

    expect(player.ruler).toBe(heirs[1]);
    expect(context.world.campaign.isAwaitingHeir).toBe(false);
    expect(home.resources.gold).toBe(110);
    expect(context.world.campaign.isEnded).toBe(false);
  });
});

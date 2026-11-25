import { afterEach, describe, expect, it, vi } from 'vitest';

import { SCENARIOS } from '@/config/scenarios';
import { RansomCommand } from '@/core/commands/RansomCommand';
import { ResolveEventsCommand } from '@/core/commands/ResolveEventsCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { Captive } from '@/core/domain/Captive';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { MarketRate } from '@/core/domain/MarketRate';
import { Nerith } from '@/core/domain/Nerith';
import { IncidentReportedEvent } from '@/core/events/IncidentReportedEvent';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { SavedGame } from '@/core/saves/SavedGame';
import { SaveFile } from '@/core/saves/SaveFile';
import { TurnHold } from '@/core/TurnHold';
import { WorldEngine } from '@/core/WorldEngine';
import { WorldFactory } from '@/core/WorldFactory';
import { EventBus } from '@/lib/EventBus';

import { blockSaves, makeSaves } from './factories';

const FIRST_SLOT = 'gemstorm.save.1';
const SECOND_SLOT = 'gemstorm.save.2';

function saveFixture() {
  const factory = new WorldFactory();
  const scenario = SCENARIOS[0]!;
  const [advisor] = factory.createAdvisors();
  const world = factory.create({
    scenario,
    family: scenario.playableFamilies[0]!,
    advisor: advisor!,
  });
  const first = world.turnQueue.provinceOrder.findIndex(
    (province, index) =>
      index > 0 &&
      index < world.turnQueue.provinceOrder.length - 1 &&
      world.isPlayerRun(province),
  );
  for (let index = 0; index < first; index += 1) {
    world.turnQueue.next();
  }
  return { world, ...makeSaves() };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('GameSaves', () => {
  it('resumes the same turn and preserves damage while dropping old announcements', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { world, saves } = saveFixture();
    const { current, turnNumber, provinceOrder } = world.turnQueue;
    const nextProvince = provinceOrder[turnNumber]!;
    nextProvince.claim(world.player);
    nextProvince.assignGovernor(world.player.ruler);
    nextProvince.addResources({ troops: 200 });
    world.date = new CalendarDate(world.date.year, 6);
    const troopsBefore = nextProvince.resources.troops;
    const oldEvents = new EventBus();
    const earlierReport = vi.fn();
    oldEvents.subscribe(IncidentReportedEvent, earlierReport);
    const eventsCommand = new ResolveEventsCommand({
      world,
      events: oldEvents,
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    eventsCommand.execute();
    const damagedTroops = nextProvince.resources.troops;
    expect(damagedTroops).toBeLessThan(troopsBefore);
    expect(earlierReport).not.toHaveBeenCalled();
    expect(saves.save(1, world)).toBe(true);
    eventsCommand.report(nextProvince);
    expect(earlierReport).toHaveBeenCalled();

    const random = vi
      .spyOn(Math, 'random')
      .mockClear()
      .mockImplementation(() => {
        throw new Error('Loading should not roll randomness');
      });
    const restored = saves.load(1)!;
    const events = new EventBus();
    const turnStarted = vi.fn();
    const monthStarted = vi.fn();
    const incidentReported = vi.fn();
    events.subscribe(TurnStartedEvent, turnStarted);
    events.subscribe(MonthStartedEvent, monthStarted);
    events.subscribe(IncidentReportedEvent, incidentReported);
    const engine = new WorldEngine(restored, events);
    engine.resume();

    expect(turnStarted).toHaveBeenCalledExactlyOnceWith(
      new TurnStartedEvent(turnNumber, restored.turnQueue.current!),
    );
    expect(restored.turnQueue.current?.number).toBe(current?.number);
    expect(
      restored.turnQueue.provinceOrder.map(({ number }) => number),
    ).toEqual(provinceOrder.map(({ number }) => number));
    expect(restored.date).toEqual(world.date);

    const menu = new TurnHold(events, 'pause');
    const interruption = new TurnHold(events);
    expect(engine.saveBlocker).toBeUndefined();
    interruption.hold();
    expect(engine.saveBlocker).toBe('interruption');
    menu.hold();
    expect(engine.saveBlocker).toBe('interruption');
    interruption.release();
    expect(engine.saveBlocker).toBeUndefined();
    menu.release();
    events.publish(new TurnEndedEvent(turnNumber));

    expect(restored.turnQueue.turnNumber).toBe(turnNumber + 1);
    expect(restored.turnQueue.current?.number).toBe(nextProvince.number);
    expect(restored.turnQueue.current?.resources.troops).toBe(damagedTroops);
    expect(turnStarted).toHaveBeenCalledTimes(2);
    expect(monthStarted).not.toHaveBeenCalled();
    expect(incidentReported).not.toHaveBeenCalled();
    expect(random).not.toHaveBeenCalled();
    engine.stop();
  });

  it('restores campaign changes and lets a returning house ransom its captive', () => {
    const { world, saves } = saveFixtureWithPlayerTurn();
    const active = world.turnQueue.current!;
    const { player } = world;
    const oldCapital = player.homeProvince;
    player.moveHome(active);
    const entrusted = world
      .getFamilyProvinces(player)
      .find((province) => province !== active)!;
    entrusted.entrust();
    active.recordAction(2);
    active.recordAction(-1);
    const rival = world.families.all.find((family) => family !== player)!;
    const lostHouse = world.families.all.find(
      (family) => family !== player && family !== rival && !family.royal,
    )!;
    player.formAlliance(rival);
    player.gems[0]!.rest(world.date, 3);
    const hire =
      active.fifthUnits.hirePool[0] ?? HiredUnit.ofName('Mercenaries')!;
    const remainingStrength = Math.floor(hire.strength / 2);
    hire.retainBattleStrength(remainingStrength);
    active.fifthUnits.hireUnit(hire);
    active.fifthUnits.addUnit(new Nerith());
    world.market.rate = MarketRate.HIGH;
    const firstArtifact = world.campaign.discoverArtifact()!;

    const heldGeneral = lostHouse.vassals[0]!;
    const captive = Captive.capture({
      general: heldGeneral,
      house: lostHouse,
      captor: player,
      battlefield: active,
    });
    world.hold(captive);
    const releasedRansom = Captive.capture({
      general: rival.vassals[0]!,
      house: rival,
      captor: player,
      battlefield: oldCapital,
    });
    releasedRansom.closeRansom();
    world.hold(releasedRansom);
    const exile = rival.vassals[1]!;
    rival.discharge(exile);
    exile.renounceHouse();
    world.exile(exile);

    const formerCapital = lostHouse.homeProvince;
    const breakawayProvince = world.map.provinces.find((province) =>
      province.isNeutral(),
    )!;
    world.absorb(lostHouse, rival);
    expect(saves.save(1, world)).toBe(true);
    const beforeReturn = saves.load(1)!;
    const waitingCaptive = beforeReturn.captives[0]!;
    expect(beforeReturn.families.has(lostHouse.name)).toBe(false);
    expect(waitingCaptive.house.name).toBe(lostHouse.name);

    vi.spyOn(Math, 'random').mockReturnValue(0);
    const founder = beforeReturn.families.getOrFail(rival.name).ruler;
    const province = beforeReturn.map.getProvince(breakawayProvince.number);
    const founded = beforeReturn.foundFamily(founder, province)!;
    expect(founded.name).toBe(lostHouse.name);
    expect(waitingCaptive.house).toBe(founded);
    founded.homeProvince.addResources({ food: 500 });

    expect(saves.save(2, beforeReturn)).toBe(true);
    const loaded = saves.load(2)!;
    const current = loaded.turnQueue.current!;
    const [restoredCaptive, restoredExhausted] = loaded.captives;
    const restoredHouse = loaded.families.getOrFail(founded.name);
    expect(loaded.player.homeProvince).toBe(current);
    expect(loaded.player.ally?.ally).toBe(loaded.player);
    expect(loaded.player.gems[0]?.countMonthsLeft(loaded.date)).toBe(3);
    expect(loaded.map.getProvince(entrusted.number).isEntrusted).toBe(true);
    expect(loaded.market.rate).toBe(MarketRate.HIGH);
    expect(loaded.campaign.advisor?.name).toBe(world.campaign.advisor?.name);
    expect(loaded.campaign.remainingArtifacts).toEqual(
      world.campaign.remainingArtifacts,
    );
    expect(
      loaded.campaign.remainingArtifacts.map(({ name }) => name),
    ).not.toContain(firstArtifact.name);
    expect(current.actionCount).toBe(2);
    expect(current.goodwill).toBe(1);
    expect(
      current.fifthUnits.units.map(({ name, strength }) => [name, strength]),
    ).toEqual([
      [hire.name, remainingStrength],
      ['Nerith', new Nerith().strength],
    ]);
    expect(current.fifthUnits.hirePool).toEqual(active.fifthUnits.hirePool);
    expect(restoredCaptive?.house).toBe(restoredHouse);
    expect(restoredCaptive?.belongsTo(restoredHouse)).toBe(true);
    expect(restoredCaptive?.captor).toBe(loaded.player);
    expect(restoredCaptive?.battlefield).toBe(current);
    expect(restoredCaptive?.demand).toBeUndefined();
    expect(restoredCaptive?.ransom).toEqual(captive.ransom);
    expect(restoredExhausted?.ransom).toBeUndefined();
    const restoredFormerCapital = loaded.map.getProvince(formerCapital.number);
    const formerFood = restoredFormerCapital.resources.food;
    const home = restoredHouse.homeProvince;
    const funds = home.resources.food;
    const price = restoredCaptive!.ransom!.food;
    const ransom = new RansomCommand({ world: loaded, events: new EventBus() });
    ransom.demand(restoredCaptive!, 'food');
    ransom.execute();

    expect(ransom.outcome).toBe('paid');
    expect(home.resources.food).toBe(funds - price);
    expect(restoredFormerCapital.resources.food).toBe(formerFood);
    expect(loaded.findFamilyOf(restoredCaptive!.general)).toBe(restoredHouse);
    expect(loaded.isHeld(restoredCaptive!.general)).toBe(false);
    expect(loaded.exiles).toHaveLength(1);
    expect(loaded.exiles[0]?.lineage).toBe(exile.lineage);
    expect(loaded.exiles[0]?.hasHouseMembership).toBe(false);
    expect(loaded.generals.has(exile.name)).toBe(false);
    current.fifthUnits.hiredUnits[0]!.recover();
    expect(current.fifthUnits.hiredUnits[0]!.strength).toBeGreaterThan(
      remainingStrength,
    );
  });

  it('captures a restored campaign exactly as it was saved', () => {
    const { world } = saveFixtureWithPlayerTurn();
    vi.spyOn(Date, 'now').mockReturnValue(100);
    const active = world.turnQueue.current!;
    const { player } = world;
    const rival = world.families.all.find((family) => family !== player)!;
    const entrusted = world
      .getFamilyProvinces(player)
      .find((province) => province !== active)!;
    const hire =
      active.fifthUnits.hirePool[0] ?? HiredUnit.ofName('Mercenaries')!;
    const exile = rival.vassals[1]!;

    player.moveHome(active);
    entrusted.entrust();
    active.recordAction(1);
    player.formAlliance(rival);
    player.gems[0]!.rest(world.date, 3);
    hire.retainBattleStrength(Math.floor(hire.strength / 2));
    active.fifthUnits.hireUnit(hire);
    active.fifthUnits.addUnit(new Nerith());
    world.market.rate = MarketRate.HIGH;
    world.campaign.discoverArtifact();
    world.hold(
      Captive.capture({
        general: rival.vassals[0]!,
        house: rival,
        captor: player,
        battlefield: active,
      }),
    );
    rival.discharge(exile);
    exile.renounceHouse();
    world.exile(exile);

    const saved = SavedGame.capture(world).serialize();
    const restored = SavedGame.parse(saved).restore();

    expect(SavedGame.capture(restored).serialize()).toBe(saved);
  });

  it('blocks saving until a demanded ransom has been answered', () => {
    const { world, saves, values } = saveFixtureWithPlayerTurn();
    const house = world.player;
    const captor = world.families.all.find((family) => !family.isEqual(house))!;
    const captive = Captive.capture({
      general: house.vassals[0]!,
      house,
      captor,
      battlefield: captor.homeProvince,
    });
    world.hold(captive);
    const events = new EventBus();
    const engine = new WorldEngine(world, events);
    const ransom = new RansomCommand({ world, events });
    const menu = new TurnHold(events, 'pause');
    engine.resume();
    menu.hold();
    expect(engine.saveBlocker).toBeUndefined();
    expect(saves.save(1, world)).toBe(true);
    const previousSave = values.get(FIRST_SLOT);

    ransom.demand(captive, 'food');
    ransom.execute();
    expect(world.findRansomFor(house)).toBe(captive);
    expect(engine.saveBlocker).toBe('interruption');
    expect(saves.save(1, world)).toBe(false);
    expect(values.get(FIRST_SLOT)).toBe(previousSave);

    ransom.answer(captive, false);
    ransom.execute();
    expect(engine.saveBlocker).toBeUndefined();
    expect(saves.save(1, world)).toBe(true);
    const restored = saves.load(1)!.captives[0]!;
    expect(restored.ransom).toBeUndefined();
    expect(restored.canDemandRansom).toBe(false);
    engine.stop();
  });

  it('keeps slots independent and preserves them on a failed replacement', () => {
    const { world, saves, storage, values } = saveFixtureWithPlayerTurn();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(100);
    expect(saves.list().map(({ status }) => status)).toEqual([
      'empty',
      'empty',
      'empty',
    ]);
    expect(saves.save(1, world)).toBe(true);
    clock.mockReturnValue(200);
    expect(saves.save(2, world)).toBe(true);
    expect(saves.load(1)).toBeDefined();
    expect(saves.newest()?.number).toBe(2);

    const before = new Map(values);
    const write = vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    expect(saves.save(1, world)).toBe(false);
    expect(values).toEqual(before);

    write.mockRestore();
    clock.mockReturnValue(300);
    expect(saves.save(1, world)).toBe(true);
    expect(saves.newest()?.number).toBe(1);
    expect(values.get(SECOND_SLOT)).toBe(before.get(SECOND_SLOT));
  });

  it('distinguishes unreadable and unsupported saves from blocked storage', () => {
    const { world, saves, values } = saveFixtureWithPlayerTurn();
    values.set(FIRST_SLOT, '{broken');
    values.set(SECOND_SLOT, JSON.stringify({ version: 42 }));
    expect(saves.list().map(({ status }) => status)).toEqual([
      'damaged',
      'unsupported',
      'empty',
    ]);
    expect(saves.newest()).toBeUndefined();
    expect(saves.load(1)).toBeUndefined();
    expect(saves.save(1, world)).toBe(true);
    expect(saves.newest()?.number).toBe(1);

    const blocked = blockSaves();
    expect(blocked.list().map(({ status }) => status)).toEqual([
      'unavailable',
      'unavailable',
      'unavailable',
    ]);
    expect(blocked.save(1, world)).toBe(false);
    expect(blocked.load(1)).toBeUndefined();
  });

  it('skips a newer save whose campaign cannot be restored', () => {
    const { world, saves, values } = saveFixtureWithPlayerTurn();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(100);
    expect(saves.save(1, world)).toBe(true);
    clock.mockReturnValue(200);
    expect(saves.save(2, world)).toBe(true);

    const { data, savedAt } = SaveFile.parse(values.get(SECOND_SLOT)!);
    const activeGenerals = [...data.activeGenerals, 'Missing general'];
    const damaged = new SaveFile({ ...data, activeGenerals }, savedAt);

    values.set(SECOND_SLOT, damaged.serialize());

    expect(saves.list().map(({ status }) => status)).toEqual([
      'ready',
      'damaged',
      'empty',
    ]);
    expect(saves.newest()?.number).toBe(1);
    expect(saves.load(2)).toBeUndefined();
  });

  it('keeps the previous save when a replacement cannot be restored', () => {
    const { world, saves, values, storage } = saveFixtureWithPlayerTurn();
    expect(saves.save(1, world)).toBe(true);
    const previousSave = values.get(FIRST_SLOT);
    const write = vi.spyOn(storage, 'setItem');

    world.turnQueue.current!.unclaim();

    expect(saves.save(1, world)).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(values.get(FIRST_SLOT)).toBe(previousSave);
  });
});

function saveFixtureWithPlayerTurn() {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);

  return saveFixture();
}

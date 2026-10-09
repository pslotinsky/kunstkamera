import { Army, type ArmyParams } from '@/core/domain/Army';
import { Battle, type BattleParams } from '@/core/domain/Battle';
import { Battlefield } from '@/core/domain/Battlefield';
import {
  BattleOutcome,
  type BattleOutcomeParams,
} from '@/core/domain/BattleOutcome';
import { BattleSide } from '@/core/domain/BattleSide';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { Captive, type CaptiveParams } from '@/core/domain/Captive';
import { Characteristics } from '@/core/domain/Characteristics';
import { Development } from '@/core/domain/Development';
import { Family } from '@/core/domain/Family';
import type { Gem } from '@/core/domain/Gem';
import { General } from '@/core/domain/General';
import { Invasion, type InvasionParams } from '@/core/domain/Invasion';
import {
  InvasionReport,
  type InvasionReportParams,
} from '@/core/domain/InvasionReport';
import { Province } from '@/core/domain/Province';
import { Resources } from '@/core/domain/Resources';
import { World } from '@/core/domain/World';
import { WorldMap } from '@/core/domain/WorldMap';
import { Collection } from '@/lib/Collection';
import { EventBus } from '@/lib/EventBus';

interface GeneralParams {
  readonly name?: string | undefined;
  readonly birth?: CalendarDate | undefined;
  readonly intelligence?: number | undefined;
  readonly war?: number | undefined;
  readonly charisma?: number | undefined;
  readonly lineage?: string | undefined;
  readonly deathDate?: CalendarDate | undefined;
}

interface FamilyParams {
  readonly name?: string | undefined;
  readonly ruler?: General | undefined;
  readonly members?: readonly General[] | undefined;
  readonly homeProvince?: Province | undefined;
  readonly fame?: number | undefined;
  readonly gems?: readonly Gem[] | undefined;
  readonly royal?: boolean | undefined;
}

interface ProvinceParams {
  readonly number?: number | undefined;
  readonly name?: string | undefined;
  readonly neighbors?: number[] | undefined;
  readonly family?: Family | undefined;
  readonly governor?: General | undefined;
  readonly gold?: number | undefined;
  readonly food?: number | undefined;
  readonly troops?: number | undefined;
  readonly loyalty?: number | undefined;
  readonly cultivation?: number | undefined;
  readonly protection?: number | undefined;
  readonly hirePool?: readonly string[] | undefined;
}

let generalSequence = 0;

export function makeGeneral(params: GeneralParams = {}): General {
  generalSequence += 1;

  return new General({
    name: params.name ?? `General ${generalSequence}`,
    birth: params.birth ?? new CalendarDate(1156, 1),
    stats: Characteristics.from({
      intelligence: params.intelligence ?? 50,
      war: params.war ?? 50,
      charisma: params.charisma ?? 50,
    }),
    lineage: params.lineage,
    deathDate: params.deathDate,
  });
}

let placeholderHomeNumber = 0;

let familySequence = 0;

export function makeFamily(params: FamilyParams = {}): Family {
  familySequence += 1;

  const ruler = params.ruler ?? makeGeneral();

  return new Family({
    name: params.name ?? `Family ${familySequence}`,
    ruler,
    members: params.members ?? [ruler],
    homeProvince: params.homeProvince ?? makePlaceholderHome(),
    fame: params.fame ?? 100,
    gems: params.gems ?? [],
    royal: params.royal,
  });
}

function makePlaceholderHome(): Province {
  placeholderHomeNumber -= 1;

  return makeProvince({ number: placeholderHomeNumber });
}

export function makeProvince(params: ProvinceParams = {}): Province {
  return new Province({
    number: params.number ?? 1,
    name: params.name ?? 'Province',
    neighbors: params.neighbors ?? [],
    family: params.family,
    governor: params.governor,
    resources: Resources.from({
      gold: params.gold ?? 0,
      food: params.food ?? 0,
      troops: params.troops ?? 0,
    }),
    development: Development.from({
      loyalty: params.loyalty ?? 0,
      cultivation: params.cultivation ?? 0,
      protection: params.protection ?? 0,
    }),
    hirePool: params.hirePool,
  });
}

export function makeWorld(
  provinces: Province[],
  player: Family,
  date: CalendarDate = new CalendarDate(1186, 4),
): { world: World; events: EventBus } {
  const familyMap = new Map<string, Family>();
  const generalMap = new Map<string, General>();

  for (const province of provinces) {
    if (province.family) {
      familyMap.set(province.family.name, province.family);
      generalMap.set(province.family.ruler.name, province.family.ruler);
      for (const member of province.family.members) {
        generalMap.set(member.name, member);
      }
    }
    if (province.governor) {
      generalMap.set(province.governor.name, province.governor);
    }
  }

  familyMap.set(player.name, player);

  const world = new World({
    date,
    map: new WorldMap(
      new Collection(
        new Map(provinces.map((province) => [province.number, province])),
        'province',
      ),
    ),
    families: new Collection(familyMap, 'family'),
    generals: new Collection(generalMap, 'general'),
    player,
  });

  return { world, events: new EventBus() };
}

export function advanceTo(world: World, province: Province): void {
  world.turnQueue.reset();

  while (
    world.turnQueue.current &&
    !world.turnQueue.current.isEqual(province)
  ) {
    world.turnQueue.next();
  }
}

type MakeBattleParams = Partial<Omit<BattleParams, 'field'>> & {
  readonly province?: number | undefined;
};

const LONDRE = 22;

export function makeArmy(params: Partial<ArmyParams> = {}): Army {
  return new Army({
    commander: params.commander ?? makeGeneral(),
    troops: params.troops ?? 200,
    food: params.food ?? 400,
    unit: params.unit,
  });
}

export function makeOutcome(
  params: Partial<BattleOutcomeParams> = {},
): BattleOutcome {
  return new BattleOutcome({
    winner: params.winner ?? BattleSide.attacker,
    reason: params.reason ?? 'flag',
    days: params.days ?? 2,
    attackerSurvivors: params.attackerSurvivors ?? 60,
    defenderSurvivors: params.defenderSurvivors ?? 0,
    lostUnits: params.lostUnits ?? [],
  });
}

export function makeInvasion(params: Partial<InvasionParams> = {}): Invasion {
  const attacking = makeFamily({ name: 'Lyle' });
  const source =
    params.source ??
    makeProvince({
      number: 1,
      neighbors: [LONDRE],
      family: attacking,
      governor: attacking.ruler,
      gold: 100,
      troops: 300,
      food: 300,
    });
  const target =
    params.target ??
    makeProvince({
      number: LONDRE,
      neighbors: [source.number],
      family: makeFamily({ name: 'Blanche' }),
      troops: 200,
      food: 300,
    });
  const world =
    params.world ?? makeWorld([source, target], target.family!).world;

  return new Invasion({
    world,
    source,
    target,
    attacker:
      params.attacker ??
      makeArmy({ commander: source.governor ?? makeGeneral() }),
  });
}

export function makeInvasionReport(
  params: Partial<InvasionReportParams> = {},
): InvasionReport {
  return new InvasionReport({
    source: params.source ?? makeProvince({ number: 2 }),
    target: params.target ?? makeProvince(),
    defending: params.defending,
    attacker: params.attacker ?? makeArmy(),
    defender: params.defender ?? makeArmy(),
    answer: params.answer ?? 'fight',
    outcome: 'outcome' in params ? params.outcome : makeOutcome(),
    refuge: params.refuge,
  });
}

export function makeCaptive(params: Partial<CaptiveParams> = {}): Captive {
  return new Captive({
    general: params.general ?? makeGeneral(),
    house: params.house ?? makeFamily(),
    captor: params.captor ?? makeFamily(),
  });
}

export function makeBattle(params: MakeBattleParams = {}): Battle {
  return new Battle({
    attacker:
      params.attacker ?? makeArmy({ commander: makeGeneral({ name: 'Erin' }) }),
    defender:
      params.defender ??
      makeArmy({ commander: makeGeneral({ name: 'Eselred' }) }),
    field: Battlefield.ofProvince(params.province ?? LONDRE),
  });
}

export function station(
  battle: Battle,
  unit: BattleUnit,
  column: number,
  row: number,
): BattleUnit {
  const cell = battle.field.getCell(column, row);

  if (cell) {
    unit.cell = cell;
  }

  return unit;
}

export function runOutTheClock(battle: Battle): Battle {
  while (!battle.isOver) {
    battle.endTurn();
  }

  return battle;
}

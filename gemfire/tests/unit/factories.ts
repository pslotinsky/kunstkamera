import { CalendarDate } from '@/core/domain/CalendarDate';
import { Characteristics } from '@/core/domain/Characteristics';
import { Development } from '@/core/domain/Development';
import { Family } from '@/core/domain/Family';
import { General } from '@/core/domain/General';
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
}

interface FamilyParams {
  readonly name?: string | undefined;
  readonly ruler?: General | undefined;
  readonly members?: readonly General[] | undefined;
  readonly homeProvince?: Province | undefined;
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
}

let generalSequence = 0;

export function makeGeneral(params: GeneralParams = {}): General {
  generalSequence += 1;

  return new General({
    name: params.name ?? `General ${generalSequence}`,
    birth: params.birth ?? new CalendarDate(170, 1),
    stats: Characteristics.from({
      intelligence: params.intelligence ?? 50,
      war: params.war ?? 50,
      charisma: params.charisma ?? 50,
    }),
  });
}

let placeholderHomeNumber = 0;

export function makeFamily(params: FamilyParams = {}): Family {
  const ruler = params.ruler ?? makeGeneral();

  return new Family({
    name: params.name ?? 'Family',
    ruler,
    members: params.members ?? [ruler],
    homeProvince: params.homeProvince ?? makePlaceholderHome(),
  });
}

// A family always has a seat; tests that don't exercise it get a placeholder
// with a negative number that can never match a real province.
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

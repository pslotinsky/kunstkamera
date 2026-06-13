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
  readonly intelligence?: number | undefined;
  readonly war?: number | undefined;
  readonly charisma?: number | undefined;
}

interface FamilyParams {
  readonly name?: string | undefined;
  readonly ruler?: General | undefined;
}

interface ProvinceParams {
  readonly number?: number | undefined;
  readonly name?: string | undefined;
  readonly neighbors?: number[] | undefined;
  readonly owner?: Family | undefined;
  readonly governor?: General | undefined;
  readonly gold?: number | undefined;
  readonly food?: number | undefined;
  readonly troops?: number | undefined;
  readonly loyalty?: number | undefined;
  readonly cultivation?: number | undefined;
  readonly protection?: number | undefined;
}

export function makeGeneral(params: GeneralParams = {}): General {
  return new General({
    name: params.name ?? 'General',
    stats: Characteristics.from({
      intelligence: params.intelligence ?? 50,
      war: params.war ?? 50,
      charisma: params.charisma ?? 50,
    }),
  });
}

export function makeFamily(params: FamilyParams = {}): Family {
  return new Family({
    name: params.name ?? 'Family',
    ruler: params.ruler ?? makeGeneral(),
  });
}

export function makeProvince(params: ProvinceParams = {}): Province {
  return new Province({
    number: params.number ?? 1,
    name: params.name ?? 'Province',
    neighbors: params.neighbors ?? [],
    owner: params.owner,
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
    if (province.owner) {
      familyMap.set(province.owner.name, province.owner);
      if (province.owner.ruler) {
        generalMap.set(province.owner.ruler.name, province.owner.ruler);
      }
      for (const member of province.owner.members) {
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

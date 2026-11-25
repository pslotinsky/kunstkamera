import { CalendarDate } from '@/core/domain/CalendarDate';
import { Captive } from '@/core/domain/Captive';
import { Characteristics } from '@/core/domain/Characteristics';
import { Family } from '@/core/domain/Family';
import { Gem } from '@/core/domain/Gem';
import { General } from '@/core/domain/General';
import { Ransom } from '@/core/domain/Ransom';
import type { World } from '@/core/domain/World';
import type { WorldMap } from '@/core/domain/WorldMap';
import { Collection } from '@/lib/Collection';

import type {
  SaveData,
  SavedCaptive,
  SavedFamily,
  SavedGeneral,
} from './SaveFile';

interface NamedEntry {
  readonly name: string;
}

type PopulationData = Pick<
  SaveData,
  | 'generals'
  | 'families'
  | 'activeGenerals'
  | 'activeFamilies'
  | 'exiles'
  | 'captives'
>;

export class PopulationRestorer {
  public static restore(
    data: PopulationData,
    map: WorldMap,
  ): PopulationRestorer {
    const roster = data.generals.map((saved) =>
      PopulationRestorer.restoreGeneral(saved),
    );
    const generals = PopulationRestorer.collect(roster, 'general');
    const houses = data.families.map((saved) =>
      PopulationRestorer.restoreFamily(saved, generals, map),
    );
    const families = PopulationRestorer.collect(houses, 'house');
    const population = new PopulationRestorer(data, families, generals);

    population.restoreAlliances();

    return population;
  }

  public readonly families: Collection<string, Family>;
  public readonly generals: Collection<string, General>;
  private readonly data: PopulationData;
  private readonly allFamilies: Collection<string, Family>;
  private readonly allGenerals: Collection<string, General>;

  private constructor(
    data: PopulationData,
    families: Collection<string, Family>,
    generals: Collection<string, General>,
  ) {
    this.data = data;
    this.allFamilies = families;
    this.allGenerals = generals;
    this.families = PopulationRestorer.collect(
      data.activeFamilies.map((name) => families.getOrFail(name)),
      'active house',
    );
    this.generals = PopulationRestorer.collect(
      data.activeGenerals.map((name) => generals.getOrFail(name)),
      'active general',
    );
  }

  public findProvinceOwner(name: string | null): Family | undefined {
    return name === null ? undefined : this.families.getOrFail(name);
  }

  public findGeneral(name: string | null): General | undefined {
    return name === null ? undefined : this.allGenerals.getOrFail(name);
  }

  public restoreCaptivesAndExiles(world: World): void {
    for (const name of this.data.exiles) {
      const general = this.allGenerals.getOrFail(name);
      if (world.generals.has(name) || world.isExiled(general)) {
        throw new Error('Invalid exiled general');
      }

      world.exile(general);
    }
    for (const saved of this.data.captives) {
      const captive = this.restoreCaptive(saved, world.map);

      world.hold(captive);
    }
  }

  private restoreAlliances(): void {
    const { families } = this.data;

    for (const saved of families) {
      if (saved.ally !== null) {
        const family = this.allFamilies.getOrFail(saved.name);
        const ally = this.allFamilies.getOrFail(saved.ally);
        const partner = families.find(({ name }) => name === ally.name);

        if (partner?.ally !== family.name) {
          throw new Error('Invalid saved alliance');
        }
        if (!family.isAlliedWith(ally)) {
          family.formAlliance(ally);
        }
      }
    }
  }

  private restoreCaptive(saved: SavedCaptive, map: WorldMap): Captive {
    const general = this.allGenerals.getOrFail(saved.general);
    const house = this.allFamilies.getOrFail(saved.house);
    const captor = this.allFamilies.getOrFail(saved.captor);
    const battlefield = map.getProvince(saved.battlefield);
    const ransom =
      saved.ransom === null
        ? undefined
        : new Ransom(saved.ransom.gold, saved.ransom.food);
    const params = { general, house, captor, battlefield };

    return new Captive(params, ransom);
  }

  private static restoreGeneral(saved: SavedGeneral): General {
    const birth = new CalendarDate(saved.birth.year, saved.birth.month);
    const stats = Characteristics.from(saved.stats);
    const lineage = saved.lineage ?? undefined;

    return new General({ ...saved, birth, stats, lineage });
  }

  private static restoreFamily(
    saved: SavedFamily,
    generals: Collection<string, General>,
    map: WorldMap,
  ): Family {
    const ruler = generals.getOrFail(saved.ruler);
    const members = saved.members.map((name) => generals.getOrFail(name));
    const homeProvince = map.getProvince(saved.home);
    const gems = saved.gems.map(({ name, readyOn }) => {
      const date =
        readyOn === null
          ? undefined
          : new CalendarDate(readyOn.year, readyOn.month);

      return Gem.restore(name, date);
    });

    return new Family({ ...saved, ruler, members, homeProvince, gems });
  }

  private static collect<Value extends NamedEntry>(
    values: readonly Value[],
    label: string,
  ): Collection<string, Value> {
    const entries = values.map((value) => [value.name, value] as const);
    const map = new Map(entries);

    if (map.size !== entries.length) {
      throw new Error(`Duplicate saved ${label}`);
    }

    return new Collection(map, label);
  }
}

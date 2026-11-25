import { PROVINCES } from '@/config/provinces';
import { Development } from '@/core/domain/Development';
import type { FifthUnit } from '@/core/domain/FifthUnit';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Nerith } from '@/core/domain/Nerith';
import { Province } from '@/core/domain/Province';
import { Resources } from '@/core/domain/Resources';
import { TurnQueue } from '@/core/domain/TurnQueue';
import { WorldMap } from '@/core/domain/WorldMap';
import { Collection } from '@/lib/Collection';
import { isDefined } from '@/lib/value/isDefined';

import type { PopulationRestorer } from './PopulationRestorer';
import type { SavedProvince, SavedUnit } from './SaveFile';

export class ProvinceRestorer {
  public static restore(records: readonly SavedProvince[]): ProvinceRestorer {
    const provinces = new Map<number, Province>();

    for (const record of records) {
      if (provinces.has(record.number)) {
        throw new Error('Duplicate saved province');
      }

      provinces.set(record.number, ProvinceRestorer.restoreProvince(record));
    }
    if (provinces.size !== PROVINCES.length) {
      throw new Error('Incomplete saved map');
    }

    const collection = new Collection(provinces, 'province');
    const map = new WorldMap(collection);

    return new ProvinceRestorer(records, map);
  }

  public readonly map: WorldMap;
  private readonly records: readonly SavedProvince[];

  private constructor(records: readonly SavedProvince[], map: WorldMap) {
    this.records = records;
    this.map = map;
  }

  public restoreGovernment(population: PopulationRestorer): void {
    for (const record of this.records) {
      this.restoreProvinceGovernment(record, population);
    }
  }

  public restoreTurnQueue(order: readonly number[], index: number): TurnQueue {
    const { provinces } = this.map;
    const complete = order.length === provinces.length;
    const unique = new Set(order).size === order.length;

    if (!complete || !unique || index >= order.length) {
      throw new Error('Invalid saved province order');
    }

    const provinceOrder = order.map((number) => this.map.getProvince(number));

    return TurnQueue.restore(provinces, { order: provinceOrder, index });
  }

  private restoreProvinceGovernment(
    record: SavedProvince,
    population: PopulationRestorer,
  ): void {
    const province = this.map.getProvince(record.number);
    const owner = population.findProvinceOwner(record.family);

    if (isDefined(owner)) {
      province.claim(owner);
    }
    province.assignGovernor(population.findGeneral(record.governor));
    province.restoreActionCycle(record);
    if (record.entrusted) {
      this.restoreEntrust(province);
    }
  }

  private restoreEntrust(province: Province): void {
    if (!province.canEntrust()) {
      throw new Error('Invalid entrusted province');
    }

    province.entrust();
  }

  private static restoreProvince(record: SavedProvince): Province {
    const geography = PROVINCES.find(({ number }) => number === record.number);
    if (!isDefined(geography)) {
      throw new Error(`Unknown saved province: ${record.number}`);
    }

    const resources = Resources.from(record.resources);
    const development = Development.from(record.development);
    const province = new Province({ ...geography, resources, development });
    const { fifthUnits } = province;

    for (const unit of record.stationed) {
      fifthUnits.addUnit(ProvinceRestorer.restoreStationedUnit(unit));
    }
    for (const unit of record.offers) {
      fifthUnits.addHireOffer(ProvinceRestorer.restoreHire(unit));
    }

    return province;
  }

  private static restoreStationedUnit(saved: SavedUnit): FifthUnit {
    let unit: FifthUnit;

    if (saved.name === 'Nerith') {
      unit = new Nerith();
      if (saved.strength !== unit.strength) {
        throw new Error('Invalid Nerith strength');
      }
    } else {
      unit = ProvinceRestorer.restoreHire(saved);
    }

    return unit;
  }

  private static restoreHire(saved: SavedUnit): HiredUnit {
    const unit = HiredUnit.ofName(saved.name);
    if (!isDefined(unit) || saved.strength > unit.maximumStrength) {
      throw new Error(`Invalid hired unit: ${saved.name}`);
    }

    unit.retainBattleStrength(saved.strength);

    return unit;
  }
}

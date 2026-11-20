import { sample } from '@/lib/array/sample';

import type { HiredUnit, UnitCategory } from '../HiredUnit';
import type { Province } from '../Province';

const MONTHLY_CHECK_CHANCE = 0.5;

export interface StationedHiredUnit {
  readonly province: Province;
  readonly unit: HiredUnit;
}

export class HiredUnitSelector {
  public constructor(private readonly random: () => number) {}

  public select(
    provinces: readonly Province[],
    category: UnitCategory,
  ): StationedHiredUnit | undefined {
    const candidates = this.findCandidates(provinces, category);
    const shouldCheck =
      candidates.length > 0 && this.random() < MONTHLY_CHECK_CHANCE;

    return shouldCheck ? sample(candidates, this.random) : undefined;
  }

  private findCandidates(
    provinces: readonly Province[],
    category: UnitCategory,
  ): readonly StationedHiredUnit[] {
    return provinces.flatMap((province) => {
      const units = province.hiredUnits.filter(
        (unit) => unit.category === category,
      );

      return units.map((unit) => ({ province, unit }));
    });
  }
}

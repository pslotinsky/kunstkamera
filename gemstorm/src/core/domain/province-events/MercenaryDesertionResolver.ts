import { isDefined } from '@/lib/value/isDefined';

import type { Province } from '../Province';
import type {
  HiredUnitSelector,
  StationedHiredUnit,
} from './HiredUnitSelector';

export class MercenaryDesertionResolver {
  public constructor(private readonly hiredUnitSelector: HiredUnitSelector) {}

  public resolve(
    provinces: readonly Province[],
  ): StationedHiredUnit | undefined {
    const candidate = this.hiredUnitSelector.select(provinces, 'mercenary');
    let desertion: StationedHiredUnit | undefined;

    if (isDefined(candidate) && this.shouldDesert(candidate)) {
      const { province, unit } = candidate;

      province.fifthUnits.dismissUnit(unit);
      desertion = candidate;
    }

    return desertion;
  }

  private shouldDesert(candidate: StationedHiredUnit): boolean {
    const { province, unit } = candidate;
    const fame = province.family?.fame ?? 0;

    return unit.needsMoreFame(fame);
  }
}

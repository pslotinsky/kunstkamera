import { compact } from '@/lib/array/compact';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import { Coronation } from './Coronation';
import { Disbanding, type GemInheritance } from './Disbanding';
import type { Family } from './Family';
import type { Gem } from './Gem';
import type { General } from './General';
import type { Province } from './Province';
import type { World } from './World';

export type SuccessionOutcome = Coronation | Disbanding;

export class Succession {
  private readonly world: World;

  public constructor(world: World) {
    this.world = world;
  }

  public replace(family: Family, banisher?: Family): SuccessionOutcome {
    const heirs = this.world.getHeirs(family);
    const [heir] = heirs;

    return heir
      ? this.crown(family, heir, heirs)
      : this.disband(family, banisher);
  }

  private crown(
    family: Family,
    heir: General,
    heirs: readonly General[],
  ): Coronation {
    const deposed = family.ruler;
    const coronation = new Coronation({
      family,
      deposed,
      heirs,
      provinces: this.world.getFamilyProvinces(family),
    });

    if (coronation.isChoiceFor(this.world.player)) {
      this.world.campaign.awaitHeir(coronation);
    } else {
      coronation.crown(heir);
    }

    return coronation;
  }

  private disband(family: Family, banisher: Family | undefined): Disbanding {
    this.world.campaign.recordFall(family, 'no-heir', banisher);

    const { ruler: deposed, gems } = family;
    const provinces = this.world.getFamilyProvinces(family);
    const breakaways = compact(
      provinces.map((province) => this.breakAway(province)),
    );
    const vassals = family.vassals.filter(
      (vassal) => !this.world.isHeld(vassal),
    );

    this.world.dissolve(family);
    family.gems = [];
    const inheritances = this.passGems(gems, banisher);
    this.world.wanderers.resettle(vassals);

    return new Disbanding({
      family,
      deposed,
      provinces,
      breakaways,
      inheritances,
    });
  }

  private breakAway(province: Province): Family | undefined {
    const lord = province.hasLord ? province.governor : undefined;
    const canFoundHouse = isDefined(lord) && !this.world.isHeld(lord);
    const founded = canFoundHouse
      ? this.world.foundFamily(lord, province)
      : undefined;

    if (!isDefined(founded)) {
      province.assignGovernor(undefined);
      province.unclaim();
    }

    return founded;
  }

  private passGems(
    gems: readonly Gem[],
    banisher?: Family,
  ): readonly GemInheritance[] {
    const survivors = this.world.families.all.filter(
      (family) => this.world.countProvinces(family) > 0,
    );

    return compact(
      gems.map((gem) => {
        const family =
          banisher ?? (survivors.length > 0 ? sample(survivors) : undefined);

        if (isDefined(family)) {
          family.gems = [...family.gems, gem];
        }

        return isDefined(family) ? { gem, family } : undefined;
      }),
    );
  }
}

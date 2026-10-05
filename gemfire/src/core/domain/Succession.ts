import { compact } from '@/lib/array/compact';

import { Coronation } from './Coronation';
import { Disbanding } from './Disbanding';
import type { Family } from './Family';
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
      provinces: this.world
        .getFamilyProvinces(family)
        .filter((province) => province.ruledBy(deposed)),
    });

    coronation.crown(heir);

    return coronation;
  }

  private disband(family: Family, banisher: Family | undefined): Disbanding {
    const { ruler: deposed, gems } = family;
    const provinces = this.world.getFamilyProvinces(family);
    const breakaways = compact(
      provinces.map((province) => this.breakAway(province)),
    );
    const strongest = this.findStrongest(breakaways);
    const beneficiary = banisher ?? strongest;

    this.resettle(family, strongest);
    this.world.dissolve(family, beneficiary);

    return new Disbanding({
      family,
      deposed,
      provinces,
      breakaways,
      gems,
      beneficiary,
    });
  }

  private breakAway(province: Province): Family | undefined {
    const lord = province.hasLord ? province.governor : undefined;
    const founded = lord && this.world.foundFamily(lord, province);

    if (!founded) {
      province.unclaim();
    }

    return founded;
  }

  private findStrongest(families: readonly Family[]): Family | undefined {
    return families.reduce<Family | undefined>(
      (strongest, family) =>
        !strongest ||
        family.homeProvince.resources.troops >
          strongest.homeProvince.resources.troops
          ? family
          : strongest,
      undefined,
    );
  }

  private resettle(family: Family, refuge: Family | undefined): void {
    const vassals = family.members.filter(
      (member) => !family.isRuler(member) && !this.world.isHeld(member),
    );

    for (const vassal of vassals) {
      if (refuge) {
        refuge.enlist(vassal);
      } else {
        this.world.exile(vassal);
      }
    }
  }
}

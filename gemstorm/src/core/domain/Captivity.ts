import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import type { Captive } from './Captive';
import type { RecruitClass } from './General';
import type { Province } from './Province';
import { Succession, type SuccessionOutcome } from './Succession';
import type { World } from './World';

export type Disposal = 'recruit' | 'release' | 'banish';

export type DisposalOutcome = 'joined' | 'released' | 'banished';

const REQUIRED_FAME: Readonly<Record<RecruitClass, number>> = {
  0: 51,
  1: 31,
  2: 16,
  3: 0,
};

export class Captivity {
  private readonly world: World;

  public constructor(world: World) {
    this.world = world;
  }

  public canRecruit(captive: Captive): boolean {
    const { general, house, captor } = captive;
    const hasRequiredFame = captor.fame >= REQUIRED_FAME[general.recruitClass];
    const isProtectedRuler =
      captive.isRuler &&
      (house.isEqual(this.world.player) ||
        this.world.getHeirs(house).length > 0);

    return hasRequiredFame && !isProtectedRuler;
  }

  public recruit(captive: Captive): boolean {
    const canRecruit = this.canRecruit(captive);

    if (canRecruit) {
      this.turn(captive);
    }

    return canRecruit;
  }

  public release(captive: Captive): Province | undefined {
    return captive.isRuler
      ? this.resettleRuler(captive)
      : this.sendToCourt(captive);
  }

  public banish(captive: Captive): SuccessionOutcome | undefined {
    const { general, house, captor } = captive;
    const wasRuler = captive.isRuler;

    if (!wasRuler) {
      this.world.getRuledProvince(general)?.assignGovernor(house.ruler);
    }

    house.discharge(general);
    this.world.exile(general);

    return wasRuler
      ? new Succession(this.world).replace(house, captor)
      : undefined;
  }

  private turn(captive: Captive): void {
    captive.general.renounceHouse();
    if (captive.isRuler) {
      this.recruitRuler(captive);
    } else {
      this.bringToCourt(captive);
    }
  }

  private recruitRuler(captive: Captive): void {
    const { house, captor } = captive;

    this.world.absorb(house, captor);
    for (const prisoner of this.world.getCaptivesOf(captor)) {
      if (prisoner.house.isEqual(house)) {
        this.world.free(prisoner);
      }
    }
  }

  private bringToCourt(captive: Captive): void {
    const { general, house, captor } = captive;

    this.sendToCourt(captive);
    house.discharge(general);
    captor.enlist(general);
  }

  private sendToCourt(captive: Captive): Province | undefined {
    const { general, house } = captive;
    const province = this.world.getRuledProvince(general);
    const governed = province?.belongsTo(house) ? province : undefined;

    governed?.assignGovernor(house.ruler);

    return governed;
  }

  private resettleRuler(captive: Captive): Province | undefined {
    const { house, captor } = captive;
    const destination = this.findReleaseDestination(captive);

    if (isDefined(destination)) {
      if (destination.isNeutral()) {
        destination.claim(house);
      }

      house.moveHome(destination);
    } else {
      this.world.campaign.recordFall(house, 'last-province-lost', captor);
      this.world.dissolve(house, captor);
    }

    return destination;
  }

  private findReleaseDestination(captive: Captive): Province | undefined {
    const remaining = this.findRemainingProvinces(captive);
    const destinations =
      remaining.length > 0
        ? remaining
        : this.findUnownedNeighbors(captive.battlefield);

    return destinations.length > 0 ? sample(destinations) : undefined;
  }

  private findRemainingProvinces(captive: Captive): readonly Province[] {
    const { house, battlefield } = captive;

    return this.world
      .getFamilyProvinces(house)
      .filter((province) => !province.isEqual(battlefield));
  }

  private findUnownedNeighbors(battlefield: Province): readonly Province[] {
    return this.world.map
      .getNeighbors(battlefield)
      .filter((province) => province.isNeutral());
  }
}

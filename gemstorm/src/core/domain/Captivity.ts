import type { Captive } from './Captive';
import type { RecruitClass } from './General';
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
const RELEASE_WAR_LOSS = 5;

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

  public release(captive: Captive): void {
    captive.general.decreaseWar(RELEASE_WAR_LOSS);
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
    const province = this.world.getRuledProvince(general);

    if (province?.belongsTo(house)) {
      province.assignGovernor(house.ruler);
    }

    house.discharge(general);
    captor.enlist(general);
  }
}

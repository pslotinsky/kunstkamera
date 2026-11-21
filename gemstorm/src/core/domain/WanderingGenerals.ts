import { isDefined } from '@/lib/value/isDefined';

import type { Family } from './Family';
import type { General } from './General';
import type { World } from './World';

export interface VassalOffer {
  readonly general: General;
  readonly court: Family;
}

export class WanderingGenerals {
  private readonly waiting: General[] = [];
  private pending: VassalOffer | undefined;

  public constructor(private readonly world: World) {}

  public get offer(): VassalOffer | undefined {
    return this.pending;
  }

  public resettle(generals: readonly General[]): void {
    this.waiting.push(...generals);
    this.makeOffers();
  }

  public answer(offer: VassalOffer, accepted: boolean): void {
    if (this.pending === offer) {
      this.pending = undefined;

      if (accepted) {
        offer.court.enlist(offer.general);
      } else {
        this.offerService(offer.general, offer.court);
      }

      this.makeOffers();
    }
  }

  private makeOffers(): void {
    while (!isDefined(this.pending) && this.waiting.length > 0) {
      this.offerService(this.waiting.shift()!);
    }
  }

  private offerService(general: General, declinedCourt?: Family): void {
    const court = this.findSmallestCourt(declinedCourt);

    if (!isDefined(court)) {
      this.world.exile(general);
    } else if (court === this.world.player) {
      this.pending = { general, court };
    } else {
      court.enlist(general);
    }
  }

  private findSmallestCourt(declinedCourt?: Family): Family | undefined {
    const candidates = this.world.families.all
      .filter(
        (family) => family !== declinedCourt && this.canReceiveVassals(family),
      )
      .map((family) => ({ family, size: this.countVassals(family) }));
    const [smallest] = candidates.sort((left, right) => left.size - right.size);

    return smallest?.family;
  }

  private canReceiveVassals(family: Family): boolean {
    return (
      !family.royal &&
      !this.world.isHeld(family.ruler) &&
      this.world.countProvinces(family) > 0
    );
  }

  private countVassals(family: Family): number {
    return this.world
      .getVassals(family)
      .filter((vassal) => !this.world.isHeld(vassal)).length;
  }
}

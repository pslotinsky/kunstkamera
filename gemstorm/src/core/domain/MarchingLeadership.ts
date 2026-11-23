import { isDefined } from '@/lib/value/isDefined';

import type { Army } from './Army';
import type { Family } from './Family';
import type { Province } from './Province';

export class MarchingLeadership {
  public constructor(
    private readonly origin: Province,
    private readonly army: Army,
  ) {}

  public depart(): void {
    if (
      !this.army.remotelyCommanded &&
      this.origin.ruledBy(this.army.commander)
    ) {
      this.origin.assignGovernor(undefined);
    }
  }

  public occupy(province: Province): void {
    const { commander, remotelyCommanded } = this.army;
    const family = this.origin.family!;

    if (!remotelyCommanded && family.isRuler(commander)) {
      family.moveHome(province);
    } else {
      province.assignGovernor(commander);
    }

    this.leaveUnderDirectRule();
  }

  public retreatTo(refuge: Province): void {
    const { commander, remotelyCommanded } = this.army;
    const family = this.origin.family!;

    if (refuge.isNeutral()) {
      refuge.claimUnowned(family, commander);
    }

    if (!remotelyCommanded) {
      this.settleCommander(refuge, family);
      this.leaveUnderDirectRule();
    }
  }

  public returnToOrigin(captured: boolean): void {
    const { commander, remotelyCommanded } = this.army;
    const family = this.origin.family!;

    if (!remotelyCommanded) {
      if (!captured) {
        this.origin.assignGovernor(commander);
      } else if (!family.isRuler(commander)) {
        this.leaveUnderDirectRule();
      }
    }
  }

  private settleCommander(refuge: Province, family: Family): void {
    const { commander } = this.army;

    if (family.isRuler(commander)) {
      family.moveHome(refuge);
    } else if (!isDefined(refuge.residentGovernor)) {
      refuge.assignGovernor(commander);
    }
  }

  private leaveUnderDirectRule(): void {
    if (!this.army.remotelyCommanded) {
      this.origin.assignGovernor(this.origin.family?.ruler);
    }
  }
}

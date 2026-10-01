import { isDefined } from '@/lib/value/isDefined';

import type { Family } from './Family';
import type { General } from './General';
import type { World } from './World';

const ALLY_ODDS = 0.8;
const ALLY_REFUSAL_RATIO = 2;
const SWORN_DEFECTION_ODDS = 0.4;
const KIN_DEFECTION_ODDS = 0.1;
const MAX_DEFECTION_ODDS = 0.9;
const SURRENDER_RATIO = 3;
const SURRENDER_ODDS = 0.25;

export interface EnvoyParams {
  readonly world: World;
  readonly family: Family;
}

export class Envoy {
  private readonly world: World;
  private readonly family: Family;

  public constructor(params: EnvoyParams) {
    this.world = params.world;
    this.family = params.family;
  }

  public canAllyWith(other: Family): boolean {
    return (
      !this.family.royal &&
      !other.royal &&
      !this.family.ally &&
      !this.family.isEqual(other)
    );
  }

  public proposeAlliance(other: Family): boolean {
    const accepted =
      this.canAllyWith(other) && Math.random() < this.weighAlliance(other);

    if (accepted) {
      this.family.formAlliance(other);
    }

    return accepted;
  }

  public canPersuade(general: General): boolean {
    const rival = this.world.findFamilyOf(general);

    return (
      isDefined(rival) &&
      this.family.isHostileTo(rival) &&
      !rival.isRuler(general)
    );
  }

  public persuade(general: General): boolean {
    const rival = this.world.findFamilyOf(general);
    const persuaded =
      isDefined(rival) &&
      this.canPersuade(general) &&
      Math.random() < this.weighDefection(general, rival);

    if (persuaded) {
      this.world.transfer(general, this.family);
    }

    return persuaded;
  }

  public demandSurrender(rival: Family): boolean {
    const yielded =
      this.family.isHostileTo(rival) &&
      this.canForceSurrender(rival) &&
      Math.random() < SURRENDER_ODDS;

    if (yielded) {
      this.world.absorb(rival, this.family);
    }

    return yielded;
  }

  private weighAlliance(other: Family): number {
    const ratio = this.countProvinces(other) / this.countProvinces(this.family);
    const share = (ALLY_REFUSAL_RATIO - ratio) / (ALLY_REFUSAL_RATIO - 1);

    return ALLY_ODDS * Math.min(1, Math.max(0, share));
  }

  private weighDefection(general: General, rival: Family): number {
    const base = general.isKinOf(rival)
      ? KIN_DEFECTION_ODDS
      : SWORN_DEFECTION_ODDS;
    const pressure = (this.family.fame - rival.fame) / 100;

    return Math.min(MAX_DEFECTION_ODDS, Math.max(0, base + pressure));
  }

  private canForceSurrender(rival: Family): boolean {
    return (
      this.countProvinces(this.family) >=
        this.countProvinces(rival) * SURRENDER_RATIO &&
      this.family.fame > rival.fame
    );
  }

  private countProvinces(family: Family): number {
    return this.world.getFamilyProvinces(family).length;
  }
}

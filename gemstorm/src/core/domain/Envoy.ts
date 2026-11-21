import { isDefined } from '@/lib/value/isDefined';

import type { Family } from './Family';
import type { General } from './General';
import type { World } from './World';

const ALLY_ODDS = 0.8;
const ALLY_REFUSAL_RATIO = 2;
const UNSTAFFED_CHARISMA_DIVISOR = 2;
const DEFECTION_CHANCES = [0.03, 0.15, 0.3, 0.5] as const;
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

  public canApproach(general: General): boolean {
    const rival = this.world.findFamilyOf(general);

    return isDefined(rival) && this.isDefectionTarget(general, rival);
  }

  public canPersuade(general: General): boolean {
    const rival = this.world.findFamilyOf(general);

    return (
      isDefined(rival) &&
      this.isDefectionTarget(general, rival) &&
      !general.isKinOf(rival) &&
      this.actingCharisma > general.stats.charisma &&
      this.family.ruler.stats.total > rival.ruler.stats.total
    );
  }

  public persuade(general: General): boolean {
    const persuaded =
      this.canPersuade(general) &&
      Math.random() < DEFECTION_CHANCES[general.defectionClass];

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
    const ratio =
      this.world.countProvinces(other) / this.world.countProvinces(this.family);
    const share = (ALLY_REFUSAL_RATIO - ratio) / (ALLY_REFUSAL_RATIO - 1);

    return ALLY_ODDS * Math.min(1, Math.max(0, share));
  }

  private isDefectionTarget(general: General, rival: Family): boolean {
    return (
      !this.family.royal &&
      this.family.isHostileTo(rival) &&
      !rival.isRuler(general) &&
      !this.world.isHeld(general)
    );
  }

  private get actingCharisma(): number {
    const { homeProvince, ruler } = this.family;

    return (
      homeProvince.governor?.stats.charisma ??
      Math.floor(ruler.stats.charisma / UNSTAFFED_CHARISMA_DIVISOR)
    );
  }

  private canForceSurrender(rival: Family): boolean {
    return (
      this.world.countProvinces(this.family) >=
      this.world.countProvinces(rival) * SURRENDER_RATIO
    );
  }
}

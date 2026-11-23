import { isDefined } from '@/lib/value/isDefined';

import type { Family } from './Family';
import type { General } from './General';
import type { World } from './World';

const MAX_ALLIANCE_GEM_DIFFERENCE = 2;
const UNSTAFFED_CHARISMA_DIVISOR = 2;
const DEFECTION_CHANCES = [0.03, 0.15, 0.3, 0.5] as const;
const MIN_SURRENDER_PROVINCE_LEAD = 10;
const SURRENDER_PROVINCE_RATIO = 5;
const MAX_SURRENDER_PROVINCES = 2;

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
      !this.family.isEqual(other) &&
      !this.family.isAlliedWith(other) &&
      this.world.families.all.includes(other)
    );
  }

  public proposeAlliance(other: Family): boolean {
    const accepted =
      !other.isEqual(this.world.player) &&
      this.canAllyWith(other) &&
      this.meetsAllianceTerms(other);

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

  public canDemandSurrender(rival: Family): boolean {
    return (
      !this.family.royal &&
      !rival.royal &&
      !rival.isEqual(this.world.player) &&
      this.family.isHostileTo(rival) &&
      this.world.families.all.includes(rival)
    );
  }

  public demandSurrender(rival: Family): boolean {
    const yielded =
      this.canDemandSurrender(rival) && this.meetsSurrenderTerms(rival);

    if (yielded) {
      this.world.absorb(rival, this.family);
    }

    return yielded;
  }

  private meetsAllianceTerms(other: Family): boolean {
    const gemDifference = Math.abs(this.family.gems.length - other.gems.length);

    return (
      this.family.ruler.stats.charisma >= other.ruler.stats.charisma &&
      gemDifference <= MAX_ALLIANCE_GEM_DIFFERENCE
    );
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

  private meetsSurrenderTerms(rival: Family): boolean {
    const ours = this.world.countProvinces(this.family);
    const theirs = this.world.countProvinces(rival);

    return (
      theirs > 0 &&
      theirs <= MAX_SURRENDER_PROVINCES &&
      ours - theirs >= MIN_SURRENDER_PROVINCE_LEAD &&
      ours >= theirs * SURRENDER_PROVINCE_RATIO &&
      this.family.ruler.stats.total >= rival.ruler.stats.total
    );
  }
}

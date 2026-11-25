import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import type { Province } from './Province';
import { Resources } from './Resources';

const ALLIANCE_DEFENSE_BONUS = 10;
const MIN_DEFENSE_PERCENT = 75;
const MAX_DEFENSE_PERCENT = 125;
const PERCENT_SCALE = 100;
const REMOTE_SCORE_DIVISOR = 2;
const SHARE = 1 / 5;
const SABOTAGE_TRAINING_CHANCE = 0.9;
const SABOTAGE_STAT_GAIN = 1;
const MAX_PLUNDER_FAME_LOSS = 2;
const MAX_PLUNDER_WAR_GAIN = 2;

const DAMAGES = ['troops', 'loyalty', 'cultivation', 'protection'] as const;
const TRAINABLE_STATS = ['intelligence', 'war'] as const;

export type SabotageDamage = (typeof DAMAGES)[number];

export interface InfiltrationParams {
  readonly source: Province;
  readonly target: Province;
}

export class Infiltration {
  private readonly source: Province;
  private readonly target: Province;

  public constructor(params: InfiltrationParams) {
    this.source = params.source;
    this.target = params.target;
  }

  public sabotage(): SabotageDamage | undefined {
    let damage: SabotageDamage | undefined;

    if (this.canSabotage()) {
      damage = sample(DAMAGES);
      this.damageTarget(damage);
    } else {
      this.trainAgent();
    }

    return damage;
  }

  public plunder(): Resources | undefined {
    let loot: Resources | undefined;

    if (this.canPlunder()) {
      loot = this.takeLoot();
      this.chargePlunderFame();
    } else {
      this.trainDefender();
    }

    return loot;
  }

  private canSabotage(): boolean {
    const allianceBonus = isDefined(this.target.family?.ally)
      ? ALLIANCE_DEFENSE_BONUS
      : 0;
    const attack = this.getScore(this.source);
    const defense = this.getScore(this.target, allianceBonus);
    const defensePercent = this.rollBetween(
      MIN_DEFENSE_PERCENT,
      MAX_DEFENSE_PERCENT,
    );

    return defense * defensePercent < attack * PERCENT_SCALE;
  }

  private canPlunder(): boolean {
    const { gold, food } = this.target.resources;

    return (
      (gold > 0 || food > 0) &&
      this.getScore(this.source) >= this.getScore(this.target)
    );
  }

  private getScore(province: Province, bonus = 0): number {
    const governor = province.residentGovernor;
    const stats = governor?.stats ?? province.family?.ruler.stats;
    const intelligence = stats?.intelligence ?? 0;
    const war = stats?.war ?? 0;
    const score = intelligence + war + bonus;

    return isDefined(governor)
      ? score
      : Math.floor(score / REMOTE_SCORE_DIVISOR);
  }

  private damageTarget(damage: SabotageDamage): void {
    if (damage === 'troops') {
      const troopsLost = Math.floor(this.target.resources.troops * SHARE);

      this.target.reduceResources({ troops: troopsLost });
    } else {
      const developmentLost = Math.floor(
        this.target.development.get(damage) * SHARE,
      );

      this.target.reduceDevelopment({ [damage]: developmentLost });
    }
  }

  private trainAgent(): void {
    const governor = this.source.residentGovernor;

    if (isDefined(governor) && Math.random() < SABOTAGE_TRAINING_CHANCE) {
      const stat = sample(TRAINABLE_STATS);

      governor.changeStats({ [stat]: SABOTAGE_STAT_GAIN });
    }
  }

  private takeLoot(): Resources {
    const gold = Math.floor(this.target.resources.gold * SHARE);
    const food = Math.floor(this.target.resources.food * SHARE);
    const loot = { gold, food };

    this.target.reduceResources(loot);
    this.source.addResources(loot);

    return Resources.from(loot);
  }

  private chargePlunderFame(): void {
    const fameLoss = this.rollBetween(0, MAX_PLUNDER_FAME_LOSS);

    this.source.family?.loseFame(fameLoss);
  }

  private trainDefender(): void {
    const governor = this.target.residentGovernor;

    if (isDefined(governor)) {
      const war = this.rollBetween(0, MAX_PLUNDER_WAR_GAIN);

      governor.changeStats({ war });
    }
  }

  private rollBetween(minimum: number, maximum: number): number {
    return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
  }
}

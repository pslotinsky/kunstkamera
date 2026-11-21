import type { Approach, BattleUnit } from './BattleUnit';

const PERCENT = 100;
const MIN_POWER_SHARE = 1;
const MAX_POWER_SHARE = 99;
const MELEE_WAR_DIVISOR = 50;
const MELEE_POWER_STEP = 10;
const MELEE_STRENGTH_DIVISOR = 3;
const MELEE_MIN_VARIATION = 90;
const MELEE_VARIATION_COUNT = 21;
const MELEE_AVERAGE_VARIATION = 100;
const STRENGTH_PER_DAMAGE_POINT = 10;
const RANGED_WAR_DIVISOR = 8;
const RANGED_POWER_DIVISOR = 9;
const RANGED_ATTACK_DIVISOR = 15;
const SPECIAL_ATTACK_DIVISOR = 13;
const DEFENSE_LIMIT = 50;
const DEFENSE_DIVISOR = 32;
const FATIGUE_DIVISOR = 10;
const FACING_DIVISOR = 10;

const TARGET_FACING: Readonly<Record<Approach, number>> = {
  front: 10,
  flank: 15,
  rear: 20,
};

const STRIKER_FACING: Readonly<Record<Approach, number>> = {
  front: 10,
  flank: 9,
  rear: 7,
};

interface StrikeDamage {
  readonly targetLosses: number;
  readonly strikerLosses: number;
  readonly fatigue: number;
}

export type MeleeRollMode = 'random' | 'average';

interface BattleDamageParams {
  readonly striker: BattleUnit;
  readonly target: BattleUnit;
  readonly approach: Approach;
  readonly meleeRoll: MeleeRollMode;
}

export class BattleDamage {
  public constructor(private readonly params: BattleDamageParams) {}

  public measure(): StrikeDamage {
    const { striker } = this.params;
    let damage: StrikeDamage;

    if (striker.unit.isSpecial) {
      damage = this.measureSpecial();
    } else if (striker.range === 'short') {
      damage = this.measureMelee();
    } else {
      damage = this.measureRanged();
    }

    return damage;
  }

  private measureMelee(): StrikeDamage {
    const { striker, target } = this.params;
    const defenderShare = this.measureDefenderPowerShare();
    const attackerShare = PERCENT - defenderShare;
    const targetDamage = this.measureMeleeLoss(target.strength, defenderShare);
    const strikerDamage = this.measureMeleeLoss(
      striker.strength,
      attackerShare,
    );
    const targetLosses = this.applyFacing(targetDamage, TARGET_FACING);
    const strikerLosses = this.applyFacing(strikerDamage, STRIKER_FACING);

    return { targetLosses, strikerLosses, fatigue: 0 };
  }

  private measureDefenderPowerShare(): number {
    const { striker, target } = this.params;
    const attackPower = this.measurePower(striker, striker.unit.attack);
    const defensePower = this.measurePower(target, target.unit.defense);
    const combinedPower = attackPower + defensePower;
    const share = Math.floor((defensePower * PERCENT) / combinedPower);

    return Math.min(MAX_POWER_SHARE, Math.max(MIN_POWER_SHARE, share));
  }

  private measurePower(unit: BattleUnit, rating: number): number {
    const warPower =
      Math.floor((unit.commanderWar * unit.strength) / MELEE_WAR_DIVISOR) + 1;
    const multiplier = Math.floor(
      (warPower + MELEE_POWER_STEP) / MELEE_POWER_STEP,
    );

    return multiplier * rating;
  }

  private measureMeleeLoss(strength: number, ownShare: number): number {
    const opposingShare = PERCENT - ownShare;
    const totalSquared = ownShare ** 2 + opposingShare ** 2;
    const variation = this.measureMeleeVariation();
    const exposedStrength = Math.floor((strength * variation) / PERCENT);
    const weightedStrength = Math.floor(
      (exposedStrength * opposingShare ** 2) / totalSquared,
    );
    const powerDifference = Math.floor(opposingShare / ownShare);

    return (
      powerDifference +
      Math.floor(weightedStrength / MELEE_STRENGTH_DIVISOR) +
      1
    );
  }

  private measureMeleeVariation(): number {
    return this.params.meleeRoll === 'average'
      ? MELEE_AVERAGE_VARIATION
      : MELEE_MIN_VARIATION + Math.floor(Math.random() * MELEE_VARIATION_COUNT);
  }

  private measureRanged(): StrikeDamage {
    const { striker } = this.params;
    const war = Math.floor(striker.commanderWar / RANGED_WAR_DIVISOR);
    const power =
      Math.floor((war * this.strengthFactor) / RANGED_POWER_DIVISOR) + 1;
    const damage = Math.floor(
      (power * striker.unit.attack) / RANGED_ATTACK_DIVISOR,
    );
    const targetLosses = this.applyDefense(damage);

    return { targetLosses, strikerLosses: 0, fatigue: 0 };
  }

  private measureSpecial(): StrikeDamage {
    const { striker } = this.params;
    const damage = Math.floor(
      (this.strengthFactor * striker.unit.attack) / SPECIAL_ATTACK_DIVISOR,
    );
    const targetLosses = this.applyDefense(damage);
    const fatigue = Math.floor(striker.strength / FATIGUE_DIVISOR);

    return { targetLosses, strikerLosses: 0, fatigue };
  }

  private get strengthFactor(): number {
    return (
      Math.floor(this.params.striker.strength / STRENGTH_PER_DAMAGE_POINT) + 1
    );
  }

  private applyDefense(damage: number): number {
    const faced = this.applyFacing(damage, TARGET_FACING);
    const vulnerability = DEFENSE_LIMIT - this.params.target.unit.defense;

    return Math.floor((faced * vulnerability) / DEFENSE_DIVISOR);
  }

  private applyFacing(
    damage: number,
    factors: Readonly<Record<Approach, number>>,
  ): number {
    const factor = factors[this.params.approach];

    return Math.floor((damage * factor) / FACING_DIVISOR);
  }
}

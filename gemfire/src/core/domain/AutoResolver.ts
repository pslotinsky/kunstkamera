import {
  BATTLE_DAY_LIMIT,
  DAILY_CASUALTY_RATE,
  MAX_WAR,
  WAR_LEVERAGE,
} from '@/config/battle';

import type { Army } from './Army';
import type { Battle } from './Battle';
import {
  BattleOutcome,
  type BattleSide,
  type OutcomeReason,
} from './BattleOutcome';

export class AutoResolver {
  public resolve(battle: Battle): BattleOutcome {
    let outcome: BattleOutcome | undefined;
    let day = 0;

    while (!outcome && day < BATTLE_DAY_LIMIT) {
      day += 1;
      outcome = this.fightDay(battle, day);
    }

    return outcome ?? this.decide(battle, 'defender', 'endurance', day);
  }

  private fightDay(battle: Battle, day: number): BattleOutcome | undefined {
    return this.starve(battle, day) ?? this.exchangeBlows(battle, day);
  }

  private starve(battle: Battle, day: number): BattleOutcome | undefined {
    const { attacker, defender } = battle;
    const attackerStarves = attacker.isStarving;
    const defenderStarves = defender.isStarving;

    attacker.eat();
    defender.eat();

    let outcome: BattleOutcome | undefined;

    if (attackerStarves) {
      outcome = this.decide(battle, 'defender', 'starvation', day);
    } else if (defenderStarves) {
      outcome = this.decide(battle, 'attacker', 'starvation', day);
    }

    return outcome;
  }

  private exchangeBlows(
    battle: Battle,
    day: number,
  ): BattleOutcome | undefined {
    const { attacker, defender } = battle;
    const attackerLosses = this.getCasualties(attacker, defender);
    const defenderLosses = this.getCasualties(defender, attacker);

    attacker.takeCasualties(attackerLosses);
    defender.takeCasualties(defenderLosses);

    let outcome: BattleOutcome | undefined;

    if (!attacker.hasTroops) {
      outcome = this.decide(battle, 'defender', 'rout', day);
    } else if (!defender.hasTroops) {
      outcome = this.decide(battle, 'attacker', 'rout', day);
    }

    return outcome;
  }

  private getCasualties(army: Army, enemy: Army): number {
    const pressure =
      this.getEffectiveStrength(enemy) / this.getEffectiveStrength(army);

    return Math.round(army.troops * DAILY_CASUALTY_RATE * pressure);
  }

  private getEffectiveStrength(army: Army): number {
    const leverage = (army.commander.stats.war / MAX_WAR) * WAR_LEVERAGE;

    return army.strength * (1 + leverage);
  }

  private decide(
    battle: Battle,
    winner: BattleSide,
    reason: OutcomeReason,
    days: number,
  ): BattleOutcome {
    return new BattleOutcome({
      winner,
      reason,
      days,
      attackerSurvivors: battle.attacker.troops,
      defenderSurvivors: battle.defender.troops,
    });
  }
}

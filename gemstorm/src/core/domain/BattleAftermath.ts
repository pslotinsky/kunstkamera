import { isDefined } from '@/lib/value/isDefined';

import type { Army } from './Army';
import type { BattleOutcome } from './BattleOutcome';
import type { InvasionReport } from './InvasionReport';
import type { Province } from './Province';

const MAX_RECOVERY_RATE = 10;
const STAT_PER_RECOVERY_POINT = 10;
const REMOTE_STAT_PER_RECOVERY_POINT = 20;
const MIN_SUPPLY_LOSS_PERCENT = 30;
const MAX_SUPPLY_LOSS_PERCENT = 50;
const PERCENT = 100;
const BASE_LOYALTY_PERCENT = 90;
const LOYALTY_PERCENT_LOSS_PER_DAY = 4;
const MAX_LOYALTY_BONUS = 5;
const DEVELOPMENT_DAMAGE_PER_DAY = 2;
const DEVELOPMENT_DAMAGE_DIVISOR = 45;
const MAX_EXTRA_DEVELOPMENT_DAMAGE = 1;
const MIN_DEVELOPMENT_DAMAGE = 1;

export class BattleAftermath {
  public constructor(
    private readonly report: InvasionReport,
    private readonly outcome: BattleOutcome,
  ) {}

  public apply(): Province | undefined {
    this.recordDefenderSurvivors();
    this.damageDevelopment();
    let refuge: Province | undefined;

    if (this.outcome.winner.isAttacker) {
      refuge = this.settleConquest();
    } else {
      this.settleDefense();
    }

    return refuge;
  }

  private recordDefenderSurvivors(): void {
    const { target, defender } = this.report;
    const troops = this.outcome.defenderSurvivors - target.resources.troops;
    const food = defender.food - target.resources.food;

    target.addResources({ troops, food });
  }

  private settleConquest(): Province | undefined {
    const { target, attacker } = this.report;
    const refuge = this.findSupplyRefuge();

    if (isDefined(refuge)) {
      this.rescueDefenderResources(refuge);
    } else {
      this.destroyDefenderSupplies();
    }

    const troops = this.outcome.attackerSurvivors - target.resources.troops;
    const { food } = attacker;
    const { loyalty } = target.development;

    target.addResources({ troops, food });
    target.reduceDevelopment({ loyalty });

    return refuge;
  }

  private findSupplyRefuge(): Province | undefined {
    const { refuge, target, defenderRetreatDestination } = this.report;
    let destination: Province | undefined;

    if (isDefined(refuge) && target.isNeighbor(refuge)) {
      const canSettle =
        !refuge.isNeutral() || isDefined(defenderRetreatDestination);

      if (canSettle) {
        destination = refuge;
      }
    }

    return destination;
  }

  private rescueDefenderResources(refuge: Province): void {
    const { target, defender } = this.report;
    const { intelligence } = defender.commander.stats;
    const { gold, food, troops } = target.resources;
    const rescuedGold = this.calculateRecovery(gold, intelligence, defender);
    const rescuedFood = this.calculateRecovery(food, intelligence, defender);
    const rescuedTroops = this.calculateTroopRecovery(troops, defender);
    const rescued = {
      gold: rescuedGold,
      food: rescuedFood,
      troops: rescuedTroops,
    };
    const troopsBefore = refuge.resources.troops;

    target.reduceResources(rescued);
    refuge.addResources(rescued);
    this.report.recoveredTroops = refuge.resources.troops - troopsBefore;
  }

  private destroyDefenderSupplies(): void {
    const { target } = this.report;
    const gold = this.rollSupplyLoss(target.resources.gold);
    const food = this.rollSupplyLoss(target.resources.food);

    target.reduceResources({ gold, food });
  }

  private settleDefense(): void {
    const { source, target, attacker } = this.report;
    const { food } = attacker;

    if (target.isNeighbor(source)) {
      const troops = this.calculateTroopRecovery(
        this.outcome.attackerSurvivors,
        attacker,
      );
      const troopsBefore = source.resources.troops;

      source.addResources({ troops });
      this.report.recoveredTroops = source.resources.troops - troopsBefore;
    }

    target.addResources({ food });
    this.damageLoyalty();
  }

  private damageLoyalty(): void {
    const { target } = this.report;
    const { loyalty } = target.development;
    const bonus = this.rollUpTo(MAX_LOYALTY_BONUS);
    const dailyLoss = LOYALTY_PERCENT_LOSS_PER_DAY * this.outcome.days;
    const percent = BASE_LOYALTY_PERCENT + bonus - dailyLoss;
    const remainingLoyalty = Math.floor((loyalty * percent) / PERCENT);
    const loss = loyalty - remainingLoyalty;

    target.reduceDevelopment({ loyalty: loss });
  }

  private damageDevelopment(): void {
    const { target } = this.report;
    const { cultivation, protection } = target.development;
    const cultivationLoss = this.calculateDevelopmentDamage(cultivation);
    const protectionLoss = this.calculateDevelopmentDamage(protection);

    target.reduceDevelopment({
      cultivation: cultivationLoss,
      protection: protectionLoss,
    });
  }

  private calculateDevelopmentDamage(value: number): number {
    const exposure = value * DEVELOPMENT_DAMAGE_PER_DAY * this.outcome.days;
    const damage = Math.floor(exposure / DEVELOPMENT_DAMAGE_DIVISOR);

    return (
      damage +
      this.rollUpTo(MAX_EXTRA_DEVELOPMENT_DAMAGE) +
      MIN_DEVELOPMENT_DAMAGE
    );
  }

  private calculateTroopRecovery(troops: number, army: Army): number {
    return this.calculateRecovery(troops, army.commander.stats.war, army);
  }

  private calculateRecovery(amount: number, stat: number, army: Army): number {
    const divisor = army.remotelyCommanded
      ? REMOTE_STAT_PER_RECOVERY_POINT
      : STAT_PER_RECOVERY_POINT;
    const rate = Math.min(MAX_RECOVERY_RATE, Math.floor(stat / divisor));

    return Math.floor((amount * rate) / MAX_RECOVERY_RATE);
  }

  private rollSupplyLoss(stock: number): number {
    const range = MAX_SUPPLY_LOSS_PERCENT - MIN_SUPPLY_LOSS_PERCENT;
    const percent = MIN_SUPPLY_LOSS_PERCENT + this.rollUpTo(range);

    return Math.floor((stock * percent) / PERCENT);
  }

  private rollUpTo(maximum: number): number {
    return Math.floor(Math.random() * (maximum + 1));
  }
}

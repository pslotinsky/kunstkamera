import { GEM_REST_MONTHS, GEM_REST_MONTHS_DEFEATED } from '@/config/battle';

import { Army } from './Army';
import { Battle } from './Battle';
import { Battlefield } from './Battlefield';
import type { BattleOutcome, BattleSide } from './BattleOutcome';
import type { DefenderAnswer } from './DefensePolicy';
import { DefensePolicy } from './DefensePolicy';
import type { Family } from './Family';
import type { FifthUnit } from './FifthUnit';
import type { General } from './General';
import { InvasionReport } from './InvasionReport';
import type { Province } from './Province';
import type { World } from './World';

export interface InvasionParams {
  readonly world: World;
  readonly source: Province;
  readonly target: Province;
  readonly attacker: Army;
}

export class Invasion {
  private readonly world: World;
  private readonly source: Province;
  private readonly target: Province;
  private readonly attacker: Army;
  private readonly policy: DefensePolicy;

  private displaced: readonly Province[] = [];
  private defender?: Army;
  private answer?: DefenderAnswer;

  public constructor(params: InvasionParams) {
    this.world = params.world;
    this.source = params.source;
    this.target = params.target;
    this.attacker = params.attacker;
    this.policy = new DefensePolicy(params.world);
  }

  public get affected(): readonly Province[] {
    return [this.source, this.target, ...this.displaced];
  }

  public begin(): Battle | InvasionReport {
    this.deploy();

    const defender = this.muster();
    const answer = this.policy.decide(this.target);

    this.defender = defender;
    this.answer = answer;

    if (answer === 'fight') {
      const field = Battlefield.ofProvince(this.target.number);

      return new Battle({ attacker: this.attacker, defender, field });
    }

    const refuge = answer === 'retreat' ? this.flee() : undefined;
    const report = new InvasionReport({
      target: this.target,
      attacker: this.attacker,
      defender,
      answer,
      refuge,
    });

    this.settle(report);

    return report;
  }

  public conclude(outcome: BattleOutcome): InvasionReport {
    const defender = this.defender;
    const answer = this.answer;

    if (!defender || !answer) {
      throw new Error('conclude() called before begin()');
    }

    const report = new InvasionReport({
      target: this.target,
      attacker: this.attacker,
      defender,
      answer,
      outcome,
    });

    this.settle(report);

    return report;
  }

  private deploy(): void {
    this.source.addResources({
      gold: -this.attacker.deploymentCost,
      troops: -this.attacker.troops,
      food: -this.attacker.food,
    });
  }

  private muster(): Army {
    const family = this.target.family!;

    return new Army({
      commander: this.target.governor ?? family.ruler,
      troops: this.target.resources.troops,
      food: this.target.resources.food,
      unit: this.chooseDefendingUnit(family),
    });
  }

  private chooseDefendingUnit(family: Family): FifthUnit | undefined {
    const rested = family.getReadyGuardians(this.world.date);

    return [...this.target.hiredUnits, ...rested].sort(
      (left, right) => right.strength - left.strength,
    )[0];
  }

  private flee(): Province | undefined {
    return this.policy.chooseRetreat(this.target);
  }

  private settle(report: InvasionReport): void {
    if (report.isFought) {
      this.applyLosses(report.defender);
      this.buryUnits(report);
      this.restGems(report);
    }

    if (report.refuge) {
      this.evacuate(report.refuge);
    }

    this.displaced = report.isTaken ? this.capture() : this.comeHome();
  }

  private applyLosses(defender: Army): void {
    this.target.addResources({
      troops: defender.troops - this.target.resources.troops,
      food: defender.food - this.target.resources.food,
    });
  }

  private buryUnits(report: InvasionReport): void {
    const outcome = report.outcome!;

    if (outcome.hasLostUnit('attacker')) {
      this.dismiss(this.attacker.unit, this.source);
    }

    if (outcome.hasLostUnit('defender')) {
      this.dismiss(report.defender.unit, this.target);
    }
  }

  private restGems(report: InvasionReport): void {
    const outcome = report.outcome!;

    this.restGem(this.source.family, this.attacker.unit, outcome, 'attacker');
    this.restGem(this.target.family, report.defender.unit, outcome, 'defender');
  }

  private restGem(
    family: Family | undefined,
    unit: FifthUnit | undefined,
    outcome: BattleOutcome,
    side: BattleSide,
  ): void {
    const gem = unit && family?.findGem(unit);

    if (gem) {
      const months = outcome.hasLostUnit(side)
        ? GEM_REST_MONTHS_DEFEATED
        : GEM_REST_MONTHS;

      gem.rest(this.world.date, months);
    }
  }

  private dismiss(unit: FifthUnit | undefined, province: Province): void {
    const stationed = province.hiredUnits.find((hired) => hired === unit);

    if (stationed) {
      province.removeUnit(stationed);
    }
  }

  private evacuate(refuge: Province): void {
    const lord = this.target.governor;
    const fleeing = this.target.resources.troops;

    this.target.addResources({ troops: -fleeing });
    refuge.addResources({ troops: fleeing });

    if (lord && !refuge.governor) {
      refuge.assignGovernor(lord);
    }
  }

  private capture(): readonly Province[] {
    const owner = this.source.family!;

    this.target.family = owner;

    const vacated = this.seat(this.attacker.commander, owner);

    this.garrison();
    this.relocateUnit();

    return vacated ? [vacated] : [];
  }

  private seat(commander: General, owner: Family): Province | undefined {
    const vacated = owner.isRuler(commander)
      ? undefined
      : this.world.getRuledProvince(commander);

    this.target.assignGovernor(commander);
    vacated?.assignGovernor(owner.ruler);

    return vacated;
  }

  private garrison(): void {
    const routed = this.target.resources.troops;

    this.target.addResources({
      troops: this.attacker.troops - routed,
      food: this.attacker.food,
    });
  }

  private relocateUnit(): void {
    const marched = this.source.hiredUnits.find(
      (unit) => unit === this.attacker.unit,
    );

    if (marched) {
      this.source.removeUnit(marched);
      this.target.addUnit(marched);
    }
  }

  private comeHome(): readonly Province[] {
    this.source.addResources({
      troops: this.attacker.troops,
      food: this.attacker.food,
    });

    return [];
  }
}

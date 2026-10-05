import { Army } from './Army';
import { Battle } from './Battle';
import { Battlefield } from './Battlefield';
import type { BattleOutcome } from './BattleOutcome';
import { BattleSide } from './BattleSide';
import { Conquest } from './Conquest';
import type { DefenderAnswer } from './DefensePolicy';
import { DefensePolicy } from './DefensePolicy';
import type { Family } from './Family';
import type { FifthUnit } from './FifthUnit';
import type { General } from './General';
import { InvasionReport, type InvasionReportParams } from './InvasionReport';
import type { Province } from './Province';
import type { World } from './World';

const GEM_REST_MONTHS = 3;
const GEM_REST_MONTHS_DEFEATED = 5;

export interface InvasionParams {
  readonly world: World;
  readonly source: Province;
  readonly target: Province;
  readonly attacker: Army;
}

export interface DefenseChoice {
  readonly answer: DefenderAnswer;
  readonly refuge?: Province | undefined;
  readonly unit?: FifthUnit | undefined;
}

export class Invasion {
  public readonly source: Province;
  public readonly target: Province;
  public readonly attacker: Army;

  private readonly world: World;
  private readonly policy: DefensePolicy;

  private displaced: readonly Province[] = [];
  private mustered?: Army;
  private answered?: DefenderAnswer;

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

  public get defender(): Army {
    if (!this.mustered) {
      throw new Error('defender read before muster()');
    }

    return this.mustered;
  }

  public get answers(): readonly DefenderAnswer[] {
    return this.policy.getAnswers(this.target);
  }

  public get refuges(): readonly Province[] {
    return this.policy.getRefuges(this.target);
  }

  public chooseRefuge(): Province | undefined {
    return this.policy.chooseRefuge(this.target);
  }

  public get defendingUnits(): readonly FifthUnit[] {
    return this.world.getFifthUnits(this.target);
  }

  public begin(): Battle | InvasionReport {
    this.muster();

    return this.answer({
      answer: this.policy.decide(this.target),
      refuge: this.chooseRefuge(),
    });
  }

  public muster(): void {
    this.deploy();
    this.mustered = this.raiseDefense(this.defendingUnits[0]);
  }

  public answer(choice: DefenseChoice): Battle | InvasionReport {
    const answer = this.answers.includes(choice.answer)
      ? choice.answer
      : this.policy.decide(this.target);

    this.answered = answer;

    if (answer === 'fight') {
      return this.fight(choice.unit);
    }

    const report = this.compileReport(answer, {
      refuge: answer === 'retreat' ? this.findRefuge(choice.refuge) : undefined,
    });

    this.settle(report);

    return report;
  }

  public conclude(
    outcome: BattleOutcome,
    refuge?: Province | undefined,
  ): InvasionReport {
    const answer = this.answered;

    if (!this.mustered || !answer) {
      throw new Error('conclude() called before begin()');
    }

    const report = this.compileReport(answer, {
      outcome,
      refuge: outcome.isWithdrawnBy(BattleSide.defender)
        ? this.findRefuge(refuge)
        : undefined,
    });

    this.settle(report);

    return report;
  }

  private compileReport(
    answer: DefenderAnswer,
    ending: Pick<InvasionReportParams, 'outcome' | 'refuge'>,
  ): InvasionReport {
    return new InvasionReport({
      source: this.source,
      target: this.target,
      defending: this.target.family,
      attacker: this.attacker,
      defender: this.defender,
      answer,
      ...ending,
    });
  }

  private fight(unit: FifthUnit | undefined): Battle {
    const chosen = this.defendingUnits.find((ready) => ready === unit);

    if (chosen) {
      this.mustered = this.raiseDefense(chosen);
    }

    const field = Battlefield.ofProvince(this.target.number);

    return new Battle({
      attacker: this.attacker,
      defender: this.defender,
      field,
    });
  }

  private findRefuge(refuge: Province | undefined): Province | undefined {
    const allowed = this.refuges.find((open) => open.isEqual(refuge));

    return allowed ?? this.chooseRefuge();
  }

  private deploy(): void {
    this.source.addResources({
      gold: -this.attacker.deploymentCost,
      troops: -this.attacker.troops,
      food: -this.attacker.food,
    });
  }

  private raiseDefense(unit: FifthUnit | undefined): Army {
    const family = this.target.family!;

    return new Army({
      commander: this.target.governor ?? family.ruler,
      troops: this.target.resources.troops,
      food: this.target.resources.food,
      unit,
    });
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

    const conquest = new Conquest({
      world: this.world,
      source: this.source,
      report,
    });

    const captive = conquest.takeCaptive();

    report.captive = captive;

    if (captive) {
      this.world.hold(captive);
    }
    this.displaced = report.isTaken ? this.overrun(conquest) : this.comeHome();
  }

  private overrun(conquest: Conquest): readonly Province[] {
    const defending = this.target.family;
    const displaced = this.capture();

    conquest.endHouse(defending);

    return displaced;
  }

  private applyLosses(defender: Army): void {
    this.target.addResources({
      troops: defender.troops - this.target.resources.troops,
      food: defender.food - this.target.resources.food,
    });
  }

  private buryUnits(report: InvasionReport): void {
    const outcome = report.outcome!;

    if (outcome.hasLostUnit(BattleSide.attacker)) {
      this.dismiss(this.attacker.unit, this.source);
    }

    if (outcome.hasLostUnit(BattleSide.defender)) {
      this.dismiss(report.defender.unit, this.target);
    }
  }

  private restGems(report: InvasionReport): void {
    const outcome = report.outcome!;

    this.restGem(
      this.source.family,
      this.attacker.unit,
      outcome,
      BattleSide.attacker,
    );
    this.restGem(
      this.target.family,
      report.defender.unit,
      outcome,
      BattleSide.defender,
    );
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
    const { troops, food, gold } = this.target.resources;
    const carried = {
      troops,
      food,
      gold: refuge.isHome ? gold : 0,
    };

    this.target.addResources({
      troops: -carried.troops,
      food: -carried.food,
      gold: -carried.gold,
    });
    refuge.addResources(carried);

    if (lord && !refuge.governor) {
      refuge.assignGovernor(lord);
    }
  }

  private capture(): readonly Province[] {
    const owner = this.source.family!;

    this.target.claim(owner);

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

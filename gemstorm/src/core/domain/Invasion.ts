import { isDefined } from '@/lib/value/isDefined';

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
import { HiredUnit } from './HiredUnit';
import { InvasionReport, type InvasionReportParams } from './InvasionReport';
import type { Province } from './Province';
import type { World } from './World';

const GEM_REST_MONTHS = 3;
const GEM_REST_MONTHS_DEFEATED = 5;
const ATTACK_VICTORY_FAME = 3;
const DEFENSE_VICTORY_FAME = 1;
const DESTROYED_UNIT_FAME_LOSS = 1;

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
    return this.getRetreatProvinces(BattleSide.defender);
  }

  public chooseRefuge(side = BattleSide.defender): Province | undefined {
    return side.isDefender
      ? this.policy.chooseRefuge(this.target)
      : this.source;
  }

  public getRetreatProvinces(side: BattleSide): readonly Province[] {
    const family = side.isAttacker ? this.source.family : this.target.family;

    return this.policy.getRefuges(this.target, family);
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
      refuge:
        answer === 'retreat'
          ? this.findRefuge(BattleSide.defender, choice.refuge)
          : undefined,
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
      refuge:
        outcome.reason === 'retreat'
          ? this.findRefuge(outcome.winner.opposite, refuge)
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

  private findRefuge(
    side: BattleSide,
    refuge: Province | undefined,
  ): Province | undefined {
    const allowed = this.getRetreatProvinces(side).find((open) =>
      open.isEqual(refuge),
    );

    return allowed ?? this.chooseRefuge(side);
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
    const { outcome, refuge } = report;

    if (isDefined(outcome)) {
      this.settleBattle(report, outcome);
    }

    const defendingRefuge = report.isTaken ? refuge : undefined;

    if (isDefined(defendingRefuge) && !defendingRefuge.isNeutral()) {
      this.evacuate(defendingRefuge);
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
    } else if (defendingRefuge?.isNeutral()) {
      this.evacuate(defendingRefuge);
    }

    this.displaced = report.isTaken
      ? this.overrun(conquest, defendingRefuge)
      : this.returnArmy(captive ? this.source : (refuge ?? this.source));
  }

  private settleBattle(report: InvasionReport, outcome: BattleOutcome): void {
    this.applyLosses(report.defender);
    this.settleBattleFame(outcome);
    this.buryUnits(report);
    this.persistHiredUnitStrengths(report);
    this.restGems(report);
  }

  private settleBattleFame(outcome: BattleOutcome): void {
    const attacking = this.source.family;
    const defending = this.target.family;
    const victoryFame = outcome.winner.isAttacker
      ? ATTACK_VICTORY_FAME
      : DEFENSE_VICTORY_FAME;
    const winner = outcome.winner.isAttacker ? attacking : defending;
    const loser = outcome.winner.isAttacker ? defending : attacking;

    if (outcome.hasLostUnit(BattleSide.attacker)) {
      attacking?.loseFame(DESTROYED_UNIT_FAME_LOSS);
    }
    if (outcome.hasLostUnit(BattleSide.defender)) {
      defending?.loseFame(DESTROYED_UNIT_FAME_LOSS);
    }

    winner?.gainFame(victoryFame);
    loser?.loseFame(victoryFame);
  }

  private overrun(
    conquest: Conquest,
    refuge: Province | undefined,
  ): readonly Province[] {
    const defending = this.target.family;
    const displaced = this.capture();

    conquest.endHouse(defending);

    return defending && refuge?.belongsTo(defending)
      ? [...displaced, refuge]
      : displaced;
  }

  private applyLosses(defender: Army): void {
    this.target.addResources({
      troops: defender.troops - this.target.resources.troops,
      food: defender.food - this.target.resources.food,
    });
  }

  private buryUnits(report: InvasionReport): void {
    const outcome = report.outcome!;

    if (
      this.attacker.unit?.isSpentAfterBattle ||
      outcome.hasLostUnit(BattleSide.attacker)
    ) {
      this.dismiss(this.attacker.unit, this.source);
    }

    if (
      report.defender.unit?.isSpentAfterBattle ||
      outcome.hasLostUnit(BattleSide.defender)
    ) {
      this.dismiss(report.defender.unit, this.target);
    }
  }

  private persistHiredUnitStrengths(report: InvasionReport): void {
    const { outcome } = report;

    if (outcome) {
      this.persistHiredUnitStrength(
        report.attacker.unit,
        outcome,
        BattleSide.attacker,
      );
      this.persistHiredUnitStrength(
        report.defender.unit,
        outcome,
        BattleSide.defender,
      );
    }
  }

  private persistHiredUnitStrength(
    unit: FifthUnit | undefined,
    outcome: BattleOutcome,
    side: BattleSide,
  ): void {
    const strength = outcome.getFifthUnitStrength(side);

    if (
      unit instanceof HiredUnit &&
      isDefined(strength) &&
      !outcome.hasLostUnit(side)
    ) {
      unit.retainBattleStrength(strength);
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
    const stationed = province.fifthUnits.units.find((hired) => hired === unit);

    if (stationed) {
      province.fifthUnits.removeUnit(stationed);
    }
  }

  private evacuate(refuge: Province): void {
    const lord = this.target.governor;
    const owner = this.target.family;
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

    if (isDefined(owner) && refuge.isNeutral()) {
      refuge.claimUnowned(owner, lord ?? owner.ruler);
      if (this.target.isHome) {
        owner.moveHome(refuge);
      }
    } else if (lord && !refuge.governor) {
      refuge.assignGovernor(lord);
    }
  }

  private capture(): readonly Province[] {
    const owner = this.source.family!;

    this.target.fifthUnits.removeSpentUnits();
    this.target.claim(owner);

    const vacated = this.seat(this.attacker.commander, owner);

    this.garrison();
    this.relocateUnit(this.target);

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

  private relocateUnit(destination: Province): void {
    const marched = this.source.fifthUnits.units.find(
      (unit) => unit === this.attacker.unit,
    );

    if (marched) {
      this.source.fifthUnits.removeUnit(marched);
      destination.fifthUnits.addUnit(marched);
    }
  }

  private returnArmy(refuge: Province): readonly Province[] {
    refuge.addResources({
      troops: this.attacker.troops,
      food: this.attacker.food,
    });

    const owner = this.source.family;
    const { commander } = this.attacker;
    const relocates = !refuge.isEqual(this.source);

    if (isDefined(owner) && relocates) {
      this.resettleAttacker(refuge, owner, commander);
      this.relocateUnit(refuge);
    }

    return relocates ? [refuge] : [];
  }

  private resettleAttacker(
    refuge: Province,
    owner: Family,
    commander: General,
  ): void {
    const isRuler = owner.isRuler(commander);

    if (refuge.isNeutral()) {
      refuge.claimUnowned(owner, commander);
    } else if (!isRuler && !refuge.isHome && !refuge.hasLord) {
      refuge.assignGovernor(commander);
    }

    if (isRuler && this.source.isHome) {
      owner.moveHome(refuge);
    } else if (!isRuler && this.source.ruledBy(commander)) {
      this.source.assignGovernor(owner.ruler, { preserveEntrust: true });
    }
  }
}

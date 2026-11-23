import { isDefined } from '@/lib/value/isDefined';

import { Army } from './Army';
import { Battle } from './Battle';
import { BattleAftermath } from './BattleAftermath';
import { Battlefield } from './Battlefield';
import type { BattleOutcome } from './BattleOutcome';
import { BattleSide } from './BattleSide';
import { Conquest } from './Conquest';
import type { DefenderAnswer } from './DefensePolicy';
import { DefensePolicy } from './DefensePolicy';
import type { Family } from './Family';
import type { FifthUnit } from './FifthUnit';
import { HiredUnit } from './HiredUnit';
import { InvasionReport, type InvasionReportParams } from './InvasionReport';
import { MarchingLeadership } from './MarchingLeadership';
import type { Province } from './Province';
import type { World } from './World';

const GEM_REST_MONTHS = 3;
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
  private readonly attackingLeadership: MarchingLeadership;

  private displaced: readonly Province[] = [];
  private mustered?: Army;
  private answered?: DefenderAnswer;

  public constructor(params: InvasionParams) {
    this.world = params.world;
    this.source = params.source;
    this.target = params.target;
    this.attacker = params.attacker;
    this.policy = new DefensePolicy(params.world);
    this.attackingLeadership = new MarchingLeadership(
      this.source,
      this.attacker,
    );
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
    if (side.isDefender) {
      return this.policy.chooseRefuge(this.target);
    }

    const refuges = this.getRetreatProvinces(side);

    return refuges.find((refuge) => refuge.isEqual(this.source)) ?? refuges[0];
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

    const answer = this.policy.decide(this.target, this.attacker);
    const unit = this.policy.chooseUnit(this.target, this.attacker);

    return this.resolve({ answer, unit });
  }

  public muster(): void {
    this.deploy();
    this.mustered = this.raiseDefense(this.defendingUnits[0]);
  }

  public answer(choice: DefenseChoice): Battle | InvasionReport {
    const { answers } = this;
    const answer = answers.includes(choice.answer) ? choice.answer : answers[0];
    const chosen = this.defendingUnits.find((ready) => ready === choice.unit);
    const unit = chosen ?? this.defender.unit;

    return this.resolve({
      answer: answer ?? 'surrender',
      refuge: choice.refuge,
      unit,
    });
  }

  private resolve(choice: DefenseChoice): Battle | InvasionReport {
    const { answer } = choice;

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

    const destination = this.findBattleRefuge(outcome, refuge);
    const report = this.compileReport(answer, { outcome, refuge: destination });

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
    this.mustered = this.raiseDefense(unit);

    const field = Battlefield.ofProvince(this.target.number);

    const retreats = BattleSide.all.filter(
      (side) => this.getRetreatProvinces(side).length > 0,
    );

    return new Battle({
      attacker: this.attacker,
      defender: this.defender,
      field,
      retreats,
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

  private findBattleRefuge(
    outcome: BattleOutcome,
    refuge: Province | undefined,
  ): Province | undefined {
    let destination: Province | undefined;

    if (outcome.reason === 'retreat') {
      destination = this.findRefuge(outcome.winner.opposite, refuge);
    } else if (outcome.winner.isAttacker) {
      destination = this.policy.chooseFallback(this.target);
    }

    return destination;
  }

  private deploy(): void {
    this.source.addResources({
      gold: -this.attacker.deploymentCost,
      troops: -this.attacker.troops,
      food: -this.attacker.food,
    });
    this.attackingLeadership.depart();
  }

  private raiseDefense(unit: FifthUnit | undefined): Army {
    const family = this.target.family!;
    const governor = this.target.residentGovernor;
    const commander = governor ?? family.ruler;
    const remotelyCommanded = !isDefined(governor);

    return new Army({
      commander,
      troops: this.target.resources.troops,
      food: this.target.resources.food,
      unit,
      remotelyCommanded,
    });
  }

  private settle(report: InvasionReport): void {
    const { outcome } = report;

    if (isDefined(outcome)) {
      this.settleBattle(report, outcome);
    }

    const conquest = new Conquest({
      world: this.world,
      source: this.source,
      report,
    });

    const captive = conquest.takeCaptive();

    report.captive = captive;

    if (isDefined(captive)) {
      this.world.hold(captive);
    }

    const recoveredAt = isDefined(outcome)
      ? new BattleAftermath(report, outcome).apply()
      : undefined;

    this.displaced = report.isTaken
      ? this.overrun(conquest, report, recoveredAt)
      : this.returnArmy(report);
  }

  private settleBattle(report: InvasionReport, outcome: BattleOutcome): void {
    this.settleBattleFame(outcome);
    if (outcome.hasLostUnit(BattleSide.attacker)) {
      this.mournUnit(report.attacker, this.source.family);
    }
    if (outcome.hasLostUnit(BattleSide.defender)) {
      this.mournUnit(report.defender, this.target.family);
    }
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

    winner?.gainFame(victoryFame);
    loser?.loseFame(victoryFame);
  }

  private mournUnit(army: Army, family: Family | undefined): void {
    const { unit, commander } = army;

    if (isDefined(unit)) {
      family?.loseFame(DESTROYED_UNIT_FAME_LOSS);
      commander.loseWar(unit.warPenalty);
    }
  }

  private overrun(
    conquest: Conquest,
    report: InvasionReport,
    recoveredAt: Province | undefined,
  ): readonly Province[] {
    const retreatDestination = this.retreatDefender(report);
    const refuge = retreatDestination ?? recoveredAt;

    this.evacuateUnits(report, refuge);
    this.capture();
    if (!report.isFought) {
      this.garrison();
    }
    conquest.endHouse(report.defending);

    return isDefined(refuge) ? [refuge] : [];
  }

  private buryUnits(report: InvasionReport): void {
    const outcome = report.outcome!;

    if (
      report.attacker.unit?.isSpentAfterBattle ||
      outcome.hasLostUnit(BattleSide.attacker)
    ) {
      this.dismiss(report.attacker.unit, this.source);
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
    this.restGem(this.source.family, report.attacker.unit);
    this.restGem(this.target.family, report.defender.unit);
  }

  private restGem(
    family: Family | undefined,
    unit: FifthUnit | undefined,
  ): void {
    const gem = unit && family?.findGem(unit);

    if (gem) {
      gem.rest(this.world.date, GEM_REST_MONTHS);
    }
  }

  private dismiss(unit: FifthUnit | undefined, province: Province): void {
    const stationed = province.fifthUnits.units.find((hired) => hired === unit);

    if (stationed) {
      province.fifthUnits.removeUnit(stationed);
    }
  }

  private retreatDefender(report: InvasionReport): Province | undefined {
    const { refuge } = report;
    let destination: Province | undefined;

    if (isDefined(refuge)) {
      const evacuated = this.evacuateDefender(report, refuge);
      const relocated = this.relocateDefenderLeadership(report);

      if (evacuated || relocated) {
        destination = refuge;
      }
    }

    return destination;
  }

  private evacuateDefender(report: InvasionReport, refuge: Province): boolean {
    const canEnterRefuge = !refuge.isNeutral() || !isDefined(report.captive);
    const evacuates = report.answer === 'retreat' && canEnterRefuge;

    if (evacuates) {
      this.evacuate(refuge);
    }

    return evacuates;
  }

  private relocateDefenderLeadership(report: InvasionReport): boolean {
    const { defender, defenderRetreatDestination: destination } = report;
    const relocates = isDefined(destination);

    if (relocates) {
      const leadership = new MarchingLeadership(this.target, defender);

      leadership.retreatTo(destination);
    }

    return relocates;
  }

  private evacuate(refuge: Province): void {
    const { troops, food, gold } = this.target.resources;
    const isAdjacent = this.target.isNeighbor(refuge);
    const carried = {
      troops: isAdjacent ? troops : 0,
      food: isAdjacent ? food : 0,
      gold: isAdjacent && refuge.isHome ? gold : 0,
    };

    const leaving = { ...carried, troops };

    this.target.reduceResources(leaving);
    refuge.addResources(carried);
  }

  private evacuateUnits(
    report: InvasionReport,
    refuge: Province | undefined,
  ): void {
    const units = this.target.fifthUnits;
    const survivor = report.isFought ? report.defender.unit : undefined;
    const canShelter =
      isDefined(refuge) &&
      isDefined(report.defending) &&
      refuge.belongsTo(report.defending);

    if (isDefined(survivor) && canShelter) {
      units.transfer(survivor, refuge.fifthUnits);
    }

    units.releaseUnits();
  }

  private capture(): void {
    const owner = this.source.family!;

    this.target.claim(owner);

    this.attackingLeadership.occupy(this.target);
    this.relocateUnit(this.target);
  }

  private garrison(): void {
    const routed = this.target.resources.troops;

    this.target.addResources({
      troops: this.attacker.troops - routed,
      food: this.attacker.food,
    });
  }

  private relocateUnit(destination: Province): void {
    const { unit } = this.attacker;

    if (isDefined(unit)) {
      this.source.fifthUnits.transfer(unit, destination.fifthUnits);
    }
  }

  private returnArmy(report: InvasionReport): readonly Province[] {
    const { captive } = report;
    const refuge = isDefined(captive)
      ? this.source
      : (report.refuge ?? this.source);
    const relocates = !refuge.isEqual(this.source);

    if (relocates) {
      this.attackingLeadership.retreatTo(refuge);
    } else {
      this.attackingLeadership.returnToOrigin(isDefined(captive));
    }

    return relocates ? [refuge] : [];
  }
}

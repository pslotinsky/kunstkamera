import { BATTLE_DAY_LIMIT } from '@/config/battle';

import type { Battle } from '../Battle';
import type { BattleOutcome } from '../BattleOutcome';
import { BattleSide } from '../BattleSide';
import type { Cell } from '../Cell';
import { Approach, LOST, type Reach, TURNS_CAP } from './Approach';

export const SCORE_WIN = 10000;

const SCORE_MATERIAL = 1;
const SCORE_KILL = 1;
const SCORE_RACE = 15;
const SCORE_CLOSING = 2;
const SCORE_SUPPLY = 10;
const SCORE_GUARD_RATIO = 0.6;

export class BattleScore {
  private readonly side: BattleSide;
  private readonly enemySide: BattleSide;

  public constructor(side: BattleSide) {
    this.side = side;
    this.enemySide = side.opposite;
  }

  public measure(battle: Battle): number {
    const outcome = battle.findOutcome();

    return outcome ? this.measureEnding(outcome) : this.measurePosition(battle);
  }

  private measureEnding(outcome: BattleOutcome): number {
    return outcome.winner.isEqual(this.side) ? SCORE_WIN : -SCORE_WIN;
  }

  private measurePosition(battle: Battle): number {
    return (
      this.weighMaterial(battle) +
      this.weighKills(battle) +
      this.weighRace(battle) +
      this.weighClosing(battle) +
      this.weighSupply(battle)
    );
  }

  private weighMaterial(battle: Battle): number {
    const mine = battle.getStrength(this.side);
    const theirs = battle.getStrength(this.enemySide);

    return (mine - theirs) * SCORE_MATERIAL;
  }

  private weighKills(battle: Battle): number {
    return (
      this.weighFallen(battle, this.enemySide) -
      this.weighFallen(battle, this.side)
    );
  }

  private weighFallen(battle: Battle, side: BattleSide): number {
    return battle.units
      .filter((unit) => unit.side.isEqual(side) && !unit.isStanding)
      .reduce((total, unit) => total + unit.committedStrength * SCORE_KILL, 0);
  }

  private weighRace(battle: Battle): number {
    const mine = this.surveyRace(battle, this.side);
    const theirs = this.surveyRace(battle, this.enemySide);

    return (this.findNearest(theirs) - this.findNearest(mine)) * SCORE_RACE;
  }

  private surveyRace(battle: Battle, side: BattleSide): readonly Reach[] {
    return this.survey(battle, side, this.findFlag(battle, side.opposite));
  }

  private weighClosing(battle: Battle): number {
    const closing = this.survey(battle, this.side, this.chooseGoal(battle));

    return -this.total(closing) * SCORE_CLOSING;
  }

  private chooseGoal(battle: Battle): Cell {
    const mine = battle.getStrength(this.side);
    const theirs = battle.getStrength(this.enemySide);
    const outmatched = mine < theirs * SCORE_GUARD_RATIO;

    return this.side.isDefender && outmatched
      ? this.findFlag(battle, this.side)
      : this.findFlag(battle, this.enemySide);
  }

  private findFlag(battle: Battle, side: BattleSide): Cell {
    return battle.field.getFlag(side);
  }

  private weighSupply(battle: Battle): number {
    const mine = this.countFeedableDays(battle, this.side);
    const theirs = this.countFeedableDays(battle, this.enemySide);

    return (mine - theirs) * SCORE_SUPPLY;
  }

  private countFeedableDays(battle: Battle, side: BattleSide): number {
    const left = BATTLE_DAY_LIMIT - battle.clock.daysFought + 1;

    return Math.min(battle.getArmy(side).supplyDays, Math.max(left, 0));
  }

  private findNearest(reaches: readonly Reach[]): number {
    const turns = reaches.map((reach) => reach.turns);

    return turns.length > 0 ? Math.min(...turns) : TURNS_CAP;
  }

  private total(reaches: readonly Reach[]): number {
    return reaches.reduce((sum, reach) => sum + reach.steps, 0);
  }

  private survey(
    battle: Battle,
    side: BattleSide,
    goal: Cell,
  ): readonly Reach[] {
    const approach = new Approach({
      goal,
      battlefield: battle.field,
      occupied: battle.getUnits(side.opposite).map((unit) => unit.cell),
    });

    return battle.units
      .filter((unit) => unit.side.isEqual(side))
      .map((unit) => (unit.isStanding ? approach.measureReach(unit) : LOST));
  }
}

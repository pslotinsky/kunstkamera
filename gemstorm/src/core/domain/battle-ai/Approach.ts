import type { Battlefield } from '../Battlefield';
import type { BattleUnit } from '../BattleUnit';
import type { Cell } from '../Cell';
import { Roads } from './Roads';

export const TURNS_CAP = 20;
export const STEPS_CAP = 40;

export interface Reach {
  readonly turns: number;
  readonly steps: number;
}

export const LOST: Reach = { turns: TURNS_CAP, steps: STEPS_CAP };

export interface ApproachParams {
  readonly goal: Cell;
  readonly battlefield: Battlefield;
  readonly occupied: readonly Cell[];
}

export class Approach {
  private readonly goal: Cell;
  private readonly battlefield: Battlefield;
  private readonly occupied: readonly Cell[];
  private readonly walked = new Map<boolean, Roads>();

  public constructor(params: ApproachParams) {
    this.goal = params.goal;
    this.battlefield = params.battlefield;
    this.occupied = params.occupied;
  }

  public measureReach(unit: BattleUnit): Reach {
    const roads = this.findRoads(unit);
    const effort = roads.measureEffort(unit.cell);
    const length = roads.measureLength(unit.cell);

    return {
      turns: Math.min(Math.ceil(length / unit.move), TURNS_CAP),
      steps: Math.min(effort, STEPS_CAP),
    };
  }

  private findRoads(unit: BattleUnit): Roads {
    const known = this.walked.get(unit.isFlying);

    if (known) {
      return known;
    }

    const roads = new Roads({
      goal: this.goal,
      walker: unit,
      battlefield: this.battlefield,
      occupied: this.occupied,
    });

    this.walked.set(unit.isFlying, roads);

    return roads;
  }
}

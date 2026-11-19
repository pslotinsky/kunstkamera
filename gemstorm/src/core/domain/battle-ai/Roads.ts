import { isDefined } from '@/lib/value/isDefined';

import type { Battlefield } from '../Battlefield';
import type { BattleUnit } from '../BattleUnit';
import type { Cell } from '../Cell';
import { Facing } from '../Facing';

const ONE_PACE = 1;
const BODY_EFFORT = 3;
const FENCE_EFFORT = 4;
const NO_EFFORT = 0;

interface Road {
  readonly effort: number;
  readonly length: number;
}

const UNREACHED: Road = {
  effort: Number.POSITIVE_INFINITY,
  length: Number.POSITIVE_INFINITY,
};

export interface RoadsParams {
  readonly goal: Cell;
  readonly walker: BattleUnit;
  readonly battlefield: Battlefield;
  readonly occupied?: readonly Cell[] | undefined;
}

export class Roads {
  private readonly walker: BattleUnit;
  private readonly battlefield: Battlefield;
  private readonly occupied: ReadonlySet<Cell>;
  private readonly roads = new Map<Cell, Road>();

  public constructor(params: RoadsParams) {
    this.walker = params.walker;
    this.battlefield = params.battlefield;
    this.occupied = new Set(params.occupied);
    this.walk(params.goal);
  }

  public measureEffort(cell: Cell): number {
    return this.findRoad(cell).effort;
  }

  public measureLength(cell: Cell): number {
    return this.findRoad(cell).length;
  }

  public isCloser(cell: Cell, than: Cell): boolean {
    return this.measureEffort(cell) < this.measureEffort(than);
  }

  private walk(goal: Cell): void {
    const waiting: Cell[][] = [[goal]];

    this.roads.set(goal, { effort: 0, length: 0 });

    for (let taken = 0; taken < waiting.length; taken += 1) {
      for (const cell of waiting[taken] ?? []) {
        for (const reached of this.reach(cell, taken)) {
          const effort = this.measureEffort(reached);

          waiting[effort] = [...(waiting[effort] ?? []), reached];
        }
      }
    }
  }

  private reach(cell: Cell, taken: number): readonly Cell[] {
    const reached: Cell[] = [];

    for (const open of this.findReachable(cell)) {
      const effort = taken + this.weighStep(open);

      if (effort < this.measureEffort(open)) {
        this.roads.set(open, { effort, length: this.measureLength(cell) + 1 });
        reached.push(open);
      }
    }

    return reached;
  }

  private findRoad(cell: Cell): Road {
    return this.roads.get(cell) ?? UNREACHED;
  }

  private weighStep(cell: Cell): number {
    return ONE_PACE + this.weighObstacle(cell);
  }

  private weighObstacle(cell: Cell): number {
    if (this.occupied.has(cell)) {
      return BODY_EFFORT;
    }

    return this.walker.canEnter(cell) ? NO_EFFORT : FENCE_EFFORT;
  }

  private findReachable(cell: Cell): readonly Cell[] {
    const neighbors = Facing.all.map((facing) =>
      this.battlefield.getNeighbor(cell, facing),
    );

    return neighbors.filter(
      (reachable): reachable is Cell =>
        isDefined(reachable) &&
        (this.walker.canEnter(reachable) || reachable.terrain === 'fence'),
    );
  }
}

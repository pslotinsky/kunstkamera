import type { Battle } from '../Battle';
import { BattleSide } from '../BattleSide';
import type { BattleUnit } from '../BattleUnit';
import type { Cell } from '../Cell';
import { UnitOrder } from '../UnitOrder';
import { BattleScore } from './BattleScore';
import { OrderCandidates } from './OrderCandidates';

const DEFAULT_DEPTH = 4;
const WORK_MARGIN = 8;

interface Scored {
  readonly order: UnitOrder;
  readonly worth: number;
}

interface Ply {
  readonly battle: Battle;
  readonly depth: number;
  readonly alpha: number;
  readonly beta: number;
}

export class TacticalSearch {
  private readonly side: BattleSide;
  private readonly score: BattleScore;
  private readonly depth: number;

  private visited = 0;

  public constructor(side: BattleSide, depth: number = DEFAULT_DEPTH) {
    this.side = side;
    this.score = new BattleScore(side);
    this.depth = depth;
  }

  public get nodes(): number {
    return this.visited;
  }

  public chooseOrder(unit: BattleUnit, battle: Battle): UnitOrder {
    this.visited = 0;

    const candidates = this.findCandidates(battle, unit);
    const walk = this.chooseWalk(battle, unit, candidates);
    const work = this.chooseWork(battle, unit, candidates);

    return (
      this.preferOne(walk, work) ?? new UnitOrder({ destination: unit.cell })
    );
  }

  public measureBest(battle: Battle): number {
    return this.search({
      battle: battle.clone(),
      depth: this.depth,
      alpha: -Infinity,
      beta: Infinity,
    });
  }

  private chooseWalk(
    battle: Battle,
    unit: BattleUnit,
    candidates: readonly UnitOrder[],
  ): Scored | undefined {
    return candidates
      .filter((order) => !order.isWorking)
      .reduce<Scored | undefined>((best, order) => {
        const ply = {
          battle,
          depth: this.depth - 1,
          alpha: best?.worth ?? -Infinity,
          beta: Infinity,
        };
        const worth = this.tryOrder(ply, unit, order);

        return !best || worth > best.worth ? { order, worth } : best;
      }, undefined);
  }

  private chooseWork(
    battle: Battle,
    unit: BattleUnit,
    candidates: readonly UnitOrder[],
  ): Scored | undefined {
    const ply = {
      battle,
      depth: this.depth - 1,
      alpha: -Infinity,
      beta: Infinity,
    };

    return this.findBest(
      candidates
        .filter((order) => order.isWorking)
        .map((order) => ({ order, worth: this.tryOrder(ply, unit, order) })),
    );
  }

  private findBest(scored: readonly Scored[]): Scored | undefined {
    return scored.reduce<Scored | undefined>(
      (best, next) => (!best || next.worth > best.worth ? next : best),
      undefined,
    );
  }

  private preferOne(
    walk: Scored | undefined,
    work: Scored | undefined,
  ): UnitOrder | undefined {
    const walked = walk?.worth ?? -Infinity;
    const worked = work?.worth ?? -Infinity;

    return worked > walked + WORK_MARGIN
      ? work?.order
      : (walk?.order ?? work?.order);
  }

  private tryOrder(ply: Ply, unit: BattleUnit, order: UnitOrder): number {
    if (!order.isWorking) {
      return this.playOut(ply, unit, order, true);
    }

    const blind = { ...ply, alpha: -Infinity };
    const odds = unit.fenceOdds;
    const done = this.playOut(blind, unit, order, true);
    const failed = this.playOut(blind, unit, order, false);

    return odds * done + (1 - odds) * failed;
  }

  private playOut(
    ply: Ply,
    unit: BattleUnit,
    order: UnitOrder,
    works: boolean,
  ): number {
    const copy = ply.battle.clone();
    const mover = this.findTwin(ply.battle, copy, unit);

    if (!mover) {
      return this.score.measure(copy);
    }

    this.perform(copy, mover, this.translate(ply.battle, copy, order), works);

    return this.search({ ...ply, battle: copy, beta: Infinity });
  }

  private search(ply: Ply): number {
    this.visited += 1;

    if (this.isSpent(ply)) {
      return this.score.measure(ply.battle);
    }

    const unit = this.findNext(ply.battle);

    return unit ? this.searchOrders(ply, unit) : this.handOver(ply);
  }

  private isSpent(ply: Ply): boolean {
    return ply.depth <= 0 || ply.battle.isOver;
  }

  private searchOrders(ply: Ply, unit: BattleUnit): number {
    return unit.side.isEqual(this.side)
      ? this.maximise(ply, unit)
      : this.minimise(ply, unit);
  }

  private handOver(ply: Ply): number {
    ply.battle.endTurn();

    return this.hasActor(ply.battle)
      ? this.search(ply)
      : this.score.measure(ply.battle);
  }

  private hasActor(battle: Battle): boolean {
    return !battle.isOver && this.findNext(battle) !== undefined;
  }

  private findCandidates(
    battle: Battle,
    unit: BattleUnit,
  ): readonly UnitOrder[] {
    return new OrderCandidates(battle, unit).list();
  }

  private findNext(battle: Battle): BattleUnit | undefined {
    return battle.getUnits(battle.turn).find((unit) => !unit.hasActed);
  }

  private maximise(ply: Ply, unit: BattleUnit): number {
    let best = -Infinity;
    let edge = ply.alpha;

    for (const order of this.findCandidates(ply.battle, unit)) {
      if (best < ply.beta) {
        const worth = this.walkInto({ ...ply, alpha: edge }, unit, order);

        best = Math.max(best, worth);
        edge = Math.max(edge, best);
      }
    }

    return best === -Infinity ? this.score.measure(ply.battle) : best;
  }

  private minimise(ply: Ply, unit: BattleUnit): number {
    let best = Infinity;
    let edge = ply.beta;

    for (const order of this.findCandidates(ply.battle, unit)) {
      if (best > ply.alpha) {
        const worth = this.walkInto({ ...ply, beta: edge }, unit, order);

        best = Math.min(best, worth);
        edge = Math.min(edge, best);
      }
    }

    return best === Infinity ? this.score.measure(ply.battle) : best;
  }

  private walkInto(ply: Ply, unit: BattleUnit, order: UnitOrder): number {
    const copy = ply.battle.clone();
    const mover = this.findTwin(ply.battle, copy, unit);

    if (!mover) {
      return this.score.measure(copy);
    }

    this.perform(copy, mover, this.translate(ply.battle, copy, order), true);

    return this.search({ ...ply, battle: copy, depth: ply.depth - 1 });
  }

  private perform(
    battle: Battle,
    unit: BattleUnit,
    order: UnitOrder,
    works: boolean,
  ): void {
    const path = battle.getMoveRange(unit).findPath(order.destination);

    unit.moveAlong(path);

    const target = order.target;
    const fence = order.fence;

    if (target?.isStanding) {
      battle.strike(unit, target);
    } else if (fence) {
      this.work(unit, fence, works);
    } else {
      unit.wait();
    }
  }

  private work(unit: BattleUnit, cell: Cell, works: boolean): void {
    if (works) {
      if (cell.terrain === 'fence') {
        cell.breakFence();
      } else {
        cell.raiseFence();
      }
    }

    unit.finishTurn();
  }

  private findTwin(
    from: Battle,
    to: Battle,
    unit: BattleUnit,
  ): BattleUnit | undefined {
    return to.units[from.units.indexOf(unit)];
  }

  private translate(from: Battle, to: Battle, order: UnitOrder): UnitOrder {
    const target = order.target;
    const fence = order.fence;

    return new UnitOrder({
      destination: this.findCell(to, order.destination),
      target: target ? this.findTwin(from, to, target) : undefined,
      fence: fence ? this.findCell(to, fence) : undefined,
    });
  }

  private findCell(battle: Battle, cell: Cell): Cell {
    return battle.field.getCell(cell.column, cell.row) ?? cell;
  }
}

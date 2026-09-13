import type { Battle } from '@/core/domain/Battle';
import type { Phase } from '@/core/domain/BattleClock';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import type { Cell } from '@/core/domain/Cell';
import { Facing } from '@/core/domain/Facing';
import { Control } from '@/lib/Control';

import { BattleBoardView, type Offset } from './BattleBoardView';
import { CellPickedEvent } from './CellPickedEvent';

const STEP_MS = 130;
const STILL = '(prefers-reduced-motion: reduce)';

interface Walk {
  readonly unit: BattleUnit;
  readonly from: Cell;
  readonly path: readonly Cell[];
  readonly onArrive: () => void;
}

export class BattleBoardControl extends Control<BattleBoardView> {
  private walking?: Walk | undefined;
  private stepping?: ReturnType<typeof setTimeout> | undefined;

  public constructor() {
    super(BattleBoardView, {});
  }

  public onCellPicked(handler: (cell: Cell) => void): void {
    this.subscribe(CellPickedEvent, (event) => handler(event.cell));
  }

  public showBattle(battle: Battle): void {
    this.stopWalking();
    this.view.draw(battle);
    this.showPhase(battle.clock.phase);
    this.placeAll(battle.units);
  }

  public showPhase(phase: Phase): void {
    this.view.showPhase(phase);
  }

  public redraw(battle: Battle, cell: Cell): void {
    this.view.redraw(cell, battle.field.getSprite(cell));
  }

  public place(unit: BattleUnit): void {
    this.view.place(unit);
  }

  public placeAll(units: readonly BattleUnit[]): void {
    for (const unit of units) {
      this.view.place(unit);
    }
  }

  public showChoices(
    unit: BattleUnit,
    reachable: readonly Cell[],
    targets: readonly Cell[],
  ): void {
    this.view.markChoices(unit.cell, reachable, targets);
  }

  public clearRange(): void {
    this.view.clearMarks();
  }

  public walk(
    unit: BattleUnit,
    path: readonly Cell[],
    onArrive: () => void,
  ): void {
    const from = this.view.findStanding(unit) ?? unit.cell;

    this.stopWalking();

    if (path.length > 0 && !this.prefersStill) {
      this.walking = { unit, from, path, onArrive };
      this.view.slideAlong(unit, this.measure(from, path), STEP_MS);
      this.takeStep(0);
    } else {
      this.view.place(unit);
      onArrive();
    }
  }

  public stopWalking(): void {
    const walk = this.walking;

    if (this.stepping !== undefined) {
      clearTimeout(this.stepping);
      this.stepping = undefined;
    }

    if (walk) {
      this.walking = undefined;
      this.land(walk.unit);
    }
  }

  protected override onUnmount(): void {
    this.stopWalking();
  }

  private get prefersStill(): boolean {
    return window.matchMedia?.(STILL).matches ?? false;
  }

  private measure(from: Cell, path: readonly Cell[]): readonly Offset[] {
    return path.map((cell) => ({
      columns: cell.column - from.column,
      rows: cell.row - from.row,
    }));
  }

  private takeStep(index: number): void {
    const walk = this.walking;
    const cell = walk?.path[index];

    if (walk && cell) {
      const previous = index === 0 ? walk.from : walk.path[index - 1]!;

      this.view.turn(walk.unit, Facing.between(previous, cell));
      this.stepping = setTimeout(() => this.takeStep(index + 1), STEP_MS);
    } else if (walk) {
      this.walking = undefined;
      this.land(walk.unit);
      walk.onArrive();
    }
  }

  private land(unit: BattleUnit): void {
    this.view.stopSliding(unit);
    this.view.place(unit);
  }
}

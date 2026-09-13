import type { Battle } from '@/core/domain/Battle';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import type { Cell } from '@/core/domain/Cell';
import type { MoveRange } from '@/core/domain/MoveRange';
import { TacticalPolicy } from '@/core/domain/TacticalPolicy';
import type { UnitOrder } from '@/core/domain/UnitOrder';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { Control } from '@/lib/Control';

import { ActionCancelledEvent } from './ActionCancelledEvent';
import { BattleBoardControl } from './BattleBoard/BattleBoardControl';
import { BattleScreenView } from './BattleScreenView';
import { ClashControl } from './Clash/ClashControl';
import { FenceChosenEvent } from './FenceChosenEvent';
import { RetreatChosenEvent } from './RetreatChosenEvent';
import { RetreatConfirmedEvent } from './RetreatConfirmedEvent';
import { SkyControl } from './Sky/SkyControl';
import { ENEMY_SIDE, PLAYER_SIDE } from './sides';
import { TurnDoneEvent } from './TurnDoneEvent';
import type { BattleScreenContext, BattleScreenControls } from './types';
import { UnitWaitedEvent } from './UnitWaitedEvent';

const ENEMY_ORDER_DELAY_MS = 420;

export class BattleScreenControl extends Control<
  BattleScreenView,
  BattleScreenControls
> {
  private readonly enemy = new TacticalPolicy(ENEMY_SIDE);

  private battle?: Battle | undefined;
  private selected?: BattleUnit | undefined;
  private range?: MoveRange | undefined;
  private targets: readonly BattleUnit[] = [];
  private breakable: readonly Cell[] = [];
  private siting = false;
  private ordering?: ReturnType<typeof setTimeout> | undefined;
  private leaving = false;
  private busy = false;

  public constructor(context: BattleScreenContext) {
    super(BattleScreenView, context, {
      sky: new SkyControl(),
      board: new BattleBoardControl(),
      clash: new ClashControl(),
    });
  }

  public play(battle: Battle): void {
    this.battle = battle;
    this.clearOrder();

    if (battle.isOver) {
      this.endBattle(battle);
    } else {
      this.view.showBattle(battle);
      this.controls.board.showBattle(battle);
      this.controls.clash.showLandscape(battle.field.landscape);
      this.startPlayerTurn(battle);
      this.view.show();
    }
  }

  public close(): void {
    this.stopOrdering();
    this.battle = undefined;
    this.view.hide();
  }

  protected override onUnmount(): void {
    this.stopOrdering();
  }

  protected override onMount(): void {
    this.controls.board.onCellPicked((cell) => this.pickCell(cell));
    this.subscribe(FenceChosenEvent, () => this.siteFence());
    this.subscribe(UnitWaitedEvent, () => this.holdSelected());
    this.subscribe(ActionCancelledEvent, () => this.stepBack());
    this.subscribe(RetreatChosenEvent, () => this.askToLeave());
    this.subscribe(RetreatConfirmedEvent, () => this.leave());
    this.subscribe(TurnDoneEvent, () => this.finishTurn());
  }

  private pickCell(cell: Cell): void {
    const battle = this.battle;

    if (battle && !this.busy && battle.turn === PLAYER_SIDE) {
      this.actOn(battle, cell);
    }
  }

  private actOn(battle: Battle, cell: Cell): void {
    const standing = battle.getUnit(cell);
    const ordered = this.selected;

    if (this.siting) {
      this.buildAt(battle, cell);
    } else if (standing && this.targets.includes(standing)) {
      this.strikeAt(battle, standing);
    } else if (this.breakable.includes(cell)) {
      this.breakAt(battle, cell);
    } else if (standing?.side === PLAYER_SIDE && !standing.hasActed) {
      this.turnTo(battle, standing);
    } else if (ordered && this.range?.includes(cell)) {
      this.moveSelected(battle, cell);
    }
  }

  private siteFence(): void {
    const battle = this.battle;
    const unit = this.selected;

    if (battle && unit?.canBuild) {
      this.siting = true;
      this.controls.board.showChoices(unit, [], battle.getBuildSites(unit));
      this.view.askForSite(unit);
    }
  }

  private buildAt(battle: Battle, cell: Cell): void {
    const unit = this.selected;

    if (unit) {
      const done = battle.build(unit, cell);

      this.finishWork(battle, unit, cell);
      this.view.showWork(unit, done);
    }
  }

  private breakAt(battle: Battle, cell: Cell): void {
    const unit = this.selected;

    if (unit) {
      const done = battle.breakDown(unit, cell);

      this.finishWork(battle, unit, cell);
      this.view.showBreaking(unit, done);
    }
  }

  private finishWork(battle: Battle, unit: BattleUnit, cell: Cell): void {
    this.controls.board.redraw(battle, cell);
    this.controls.board.place(unit);
    this.clearOrder();
  }

  private turnTo(battle: Battle, unit: BattleUnit): void {
    if (this.selected === unit) {
      this.clearOrder();
      this.view.askForUnit();
    } else {
      this.select(battle, unit);
    }
  }

  private select(battle: Battle, unit: BattleUnit): void {
    const range = unit.stepsLeft > 0 ? battle.getMoveRange(unit) : undefined;

    this.selected = unit;
    this.range = range;
    this.targets = battle.getTargets(unit);
    this.breakable = battle.getBreakable(unit);
    this.siting = false;
    this.controls.board.showChoices(unit, range?.cells ?? [], [
      ...this.targets.map((target) => target.cell),
      ...this.breakable,
    ]);

    const builds = unit.canBuild && battle.getBuildSites(unit).length > 0;

    if (range) {
      this.view.askForOrder(unit, this.targets.length > 0, builds);
    } else {
      this.view.askForStrike(unit, builds);
    }
  }

  private moveSelected(battle: Battle, cell: Cell): void {
    const unit = this.selected;
    const range = this.range;

    if (unit && range) {
      const path = range.findPath(cell);

      this.clearMarks();
      this.busy = true;
      this.view.showWalking();
      unit.moveAlong(path);
      this.controls.board.walk(unit, path, () => {
        this.busy = false;
        this.settleOrEnd(battle);

        if (this.battle === battle) {
          this.landOrder(battle, unit);
        }
      });
    }
  }

  private landOrder(battle: Battle, unit: BattleUnit): void {
    if (this.hasMoreToDo(battle, unit)) {
      this.select(battle, unit);
    } else {
      this.holdUnit(unit);
      this.clearOrder();
      this.view.askForUnit();
    }
  }

  private hasMoreToDo(battle: Battle, unit: BattleUnit): boolean {
    return (
      unit.stepsLeft > 0 ||
      battle.getTargets(unit).length > 0 ||
      battle.getBreakable(unit).length > 0 ||
      (unit.canBuild && battle.getBuildSites(unit).length > 0)
    );
  }

  private strikeAt(battle: Battle, standing: BattleUnit): void {
    const unit = this.selected;

    if (unit) {
      this.clearOrder();
      this.busy = true;
      this.view.showClashing();

      const clash = battle.strike(unit, standing);

      this.controls.clash.play(clash, () => {
        this.busy = false;
        this.showRound(battle);
        this.view.askForUnit();
        this.settleOrEnd(battle);
      });
    }
  }

  private holdSelected(): void {
    const unit = this.selected;

    if (this.battle && unit) {
      this.holdUnit(unit);
      this.clearOrder();
      this.view.askForUnit();
    }
  }

  private stepBack(): void {
    const battle = this.battle;
    const unit = this.selected;

    if (this.leaving) {
      this.leaving = false;
      this.view.askForUnit();
    } else if (this.siting && battle && unit) {
      this.select(battle, unit);
    }
  }

  private askToLeave(): void {
    if (this.battle && this.battle.turn === PLAYER_SIDE) {
      this.leaving = true;
      this.view.askToRetreat();
    }
  }

  private leave(): void {
    const battle = this.battle;

    if (battle) {
      this.leaving = false;
      battle.retreat(PLAYER_SIDE);
      this.endBattle(battle);
    }
  }

  private holdUnit(unit: BattleUnit): void {
    unit.wait();
    this.controls.board.place(unit);
  }

  private clearMarks(): void {
    this.range = undefined;
    this.targets = [];
    this.breakable = [];
    this.siting = false;
    this.controls.board.clearRange();
  }

  private clearOrder(): void {
    this.selected = undefined;
    this.leaving = false;
    this.clearMarks();
  }

  private finishTurn(): void {
    const battle = this.battle;

    if (battle && !this.busy && battle.turn === PLAYER_SIDE) {
      battle.endTurn();
      this.clearOrder();
      this.startEnemyTurn(battle);
    }
  }

  private startPlayerTurn(battle: Battle): void {
    this.showRound(battle);
    this.view.askForUnit();
  }

  private startEnemyTurn(battle: Battle): void {
    this.showRound(battle);
    this.view.showEnemyTurn();
    this.playEnemy(battle);
  }

  private showRound(battle: Battle): void {
    this.view.showClock(battle.clock);
    this.view.showArmies(battle);
    this.controls.sky.showPhase(battle.clock.phase);
    this.controls.clash.showPhase(battle.clock.phase);
    this.controls.board.showPhase(battle.clock.phase);
    this.controls.board.placeAll(battle.units);
  }

  private playEnemy(battle: Battle): void {
    const pending = battle
      .getUnits(ENEMY_SIDE)
      .filter((unit) => !unit.hasActed);
    const next = pending[0];

    if (next) {
      this.orderNext(battle, next);
    } else {
      battle.endTurn();
      this.startPlayerTurn(battle);
      this.settleOrEnd(battle);
    }
  }

  private orderNext(battle: Battle, unit: BattleUnit): void {
    this.ordering = setTimeout(() => {
      this.ordering = undefined;

      if (this.battle === battle) {
        const order = this.enemy.orderUnit(unit, battle);

        this.followOrder(battle, unit, order);
      }
    }, ENEMY_ORDER_DELAY_MS);
  }

  private followOrder(
    battle: Battle,
    unit: BattleUnit,
    order: UnitOrder,
  ): void {
    const path = battle.getMoveRange(unit).findPath(order.destination);

    unit.moveAlong(path);
    this.controls.board.walk(unit, path, () =>
      this.actOnOrder(battle, unit, order),
    );
  }

  private actOnOrder(battle: Battle, unit: BattleUnit, order: UnitOrder): void {
    const target = order.target;

    if (this.battle !== battle) {
      this.stopOrdering();
    } else if (battle.isOver) {
      this.endBattle(battle);
    } else if (target?.isStanding) {
      this.view.showClashing();

      const clash = battle.strike(unit, target);

      this.controls.clash.play(clash, () => {
        this.showRound(battle);
        this.view.showEnemyTurn();
        this.resumeEnemy(battle);
      });
    } else {
      this.holdUnit(unit);
      this.resumeEnemy(battle);
    }
  }

  private resumeEnemy(battle: Battle): void {
    if (this.battle === battle) {
      this.settleOrEnd(battle);
    }

    if (this.battle === battle) {
      this.playEnemy(battle);
    }
  }

  private stopOrdering(): void {
    this.busy = false;
    this.controls.board.stopWalking();
    this.controls.clash.stop();

    if (this.ordering !== undefined) {
      clearTimeout(this.ordering);
      this.ordering = undefined;
    }
  }

  private settleOrEnd(battle: Battle): void {
    if (battle.isOver) {
      this.endBattle(battle);
    }
  }

  private endBattle(battle: Battle): void {
    const outcome = battle.findOutcome();

    if (outcome) {
      this.stopOrdering();
      this.battle = undefined;
      this.context.events.publish(new BattleEndedEvent(outcome));
    }
  }
}

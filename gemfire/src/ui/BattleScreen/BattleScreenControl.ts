import type { Battle } from '@/core/domain/Battle';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import type { Cell } from '@/core/domain/Cell';
import type { MoveRange } from '@/core/domain/MoveRange';
import { TacticalPolicy } from '@/core/domain/TacticalPolicy';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { Control } from '@/lib/Control';

import { BattleBoardControl } from './BattleBoard/BattleBoardControl';
import { BattleScreenView } from './BattleScreenView';
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
  private ordering?: ReturnType<typeof setTimeout> | undefined;
  private walking = false;

  public constructor(context: BattleScreenContext) {
    super(BattleScreenView, context, {
      sky: new SkyControl(),
      board: new BattleBoardControl(),
    });
  }

  public play(battle: Battle): void {
    this.battle = battle;
    this.selected = undefined;
    this.range = undefined;

    if (battle.isOver) {
      this.endBattle(battle);
    } else {
      this.view.showBattle(battle);
      this.controls.board.showBattle(battle);
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
    this.subscribe(UnitWaitedEvent, () => this.holdSelected());
    this.subscribe(TurnDoneEvent, () => this.finishTurn());
  }

  private pickCell(cell: Cell): void {
    const battle = this.battle;

    if (battle && !this.walking && battle.turn === PLAYER_SIDE) {
      this.actOn(battle, cell);
    }
  }

  private actOn(battle: Battle, cell: Cell): void {
    const standing = battle.getUnit(cell);

    if (standing?.side === PLAYER_SIDE && !standing.hasActed) {
      this.select(battle, standing);
    } else if (this.selected && this.range?.includes(cell)) {
      this.moveSelected(battle, cell);
    }
  }

  private select(battle: Battle, unit: BattleUnit): void {
    const range = battle.getMoveRange(unit);

    this.selected = unit;
    this.range = range;
    this.controls.board.showRange(unit, range);
    this.view.askForMove(unit);
  }

  private moveSelected(battle: Battle, cell: Cell): void {
    const unit = this.selected;
    const range = this.range;

    if (unit && range) {
      const from = unit.cell;
      const path = range.findPath(cell);

      unit.moveAlong(path);
      this.clearSelection();
      this.view.showWalking();
      this.walking = true;
      this.controls.board.walk(unit, from, path, () => {
        this.walking = false;
        this.view.askForUnit();
        this.settleOrEnd(battle);
      });
    }
  }

  private holdSelected(): void {
    const unit = this.selected;

    if (this.battle && unit) {
      unit.wait();
      this.controls.board.place(unit);
      this.clearSelection();
      this.view.askForUnit();
    }
  }

  private clearSelection(): void {
    this.selected = undefined;
    this.range = undefined;
    this.controls.board.clearRange();
  }

  private finishTurn(): void {
    const battle = this.battle;

    if (battle && !this.walking && battle.turn === PLAYER_SIDE) {
      battle.endTurn();
      this.clearSelection();
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
        const from = unit.cell;
        const walked = this.enemy.orderUnit(unit, battle);

        this.controls.board.walk(unit, from, walked, () =>
          this.resumeEnemy(battle),
        );
      }
    }, ENEMY_ORDER_DELAY_MS);
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
    this.walking = false;
    this.controls.board.stopWalking();

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

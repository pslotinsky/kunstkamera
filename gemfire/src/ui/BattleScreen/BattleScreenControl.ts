import type { Battle } from '@/core/domain/Battle';
import { BattleSide } from '@/core/domain/BattleSide';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { TacticalPolicy } from '@/core/domain/battle-ai/TacticalPolicy';
import type { Cell } from '@/core/domain/Cell';
import type { Invasion } from '@/core/domain/Invasion';
import type { MoveRange } from '@/core/domain/MoveRange';
import type { Province } from '@/core/domain/Province';
import type { UnitOrder } from '@/core/domain/UnitOrder';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { Control } from '@/lib/Control';
import { DropdownControl } from '@/ui/Dropdown/DropdownControl';
import {
  findOptionProvince,
  toProvinceOptions,
} from '@/ui/Dropdown/dropdown-options';

import { ActionCancelledEvent } from './ActionCancelledEvent';
import { AutoChosenEvent } from './AutoChosenEvent';
import { AutoConfirmedEvent } from './AutoConfirmedEvent';
import { BattleBoardControl } from './BattleBoard/BattleBoardControl';
import { BattleScreenView } from './BattleScreenView';
import { ClashControl } from './Clash/ClashControl';
import { FenceChosenEvent } from './FenceChosenEvent';
import { RetreatChosenEvent } from './RetreatChosenEvent';
import { RetreatConfirmedEvent } from './RetreatConfirmedEvent';
import { SkipChosenEvent } from './SkipChosenEvent';
import { SkyControl } from './Sky/SkyControl';
import { TurnDoneEvent } from './TurnDoneEvent';
import type { BattleScreenContext, BattleScreenControls } from './types';
import { UnitWaitedEvent } from './UnitWaitedEvent';

const ENEMY_ORDER_DELAY_MS = 420;

type Asking = 'unit' | 'site' | 'retreat' | 'handover';

export class BattleScreenControl extends Control<
  BattleScreenView,
  BattleScreenControls
> {
  private side: BattleSide = BattleSide.attacker;
  private enemy = new TacticalPolicy(BattleSide.defender);
  private refuges: readonly Province[] = [];
  private auto?: TacticalPolicy | undefined;
  private battle?: Battle | undefined;
  private selected?: BattleUnit | undefined;
  private range?: MoveRange | undefined;
  private targets: readonly BattleUnit[] = [];
  private breakable: readonly Cell[] = [];
  private asking: Asking = 'unit';
  private ordering?: ReturnType<typeof setTimeout> | undefined;
  private skipping = false;
  private busy = false;

  public constructor(context: BattleScreenContext) {
    super(BattleScreenView, context, {
      sky: new SkyControl(),
      board: new BattleBoardControl(),
      clash: new ClashControl(),
      refuge: new DropdownControl({ name: 'refuge' }),
    });
  }

  public play(battle: Battle, invasion?: Invasion): void {
    const defends = invasion?.target.belongsTo(this.context.world.player);

    this.side = defends ? BattleSide.defender : BattleSide.attacker;
    this.enemy = new TacticalPolicy(this.side.opposite);
    this.refuges = defends ? invasion!.refuges : [];
    this.battle = battle;
    this.auto = undefined;
    this.offerRefuges(invasion?.chooseRefuge());
    this.skipping = false;
    this.clearOrder();

    if (battle.isOver) {
      this.endBattle(battle);
    } else {
      this.view.showBattle(battle);
      this.controls.board.showBattle(battle);
      this.controls.clash.showLandscape(battle.field.landscape);
      this.view.show();
      this.openTurn(battle);
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
    this.subscribe(AutoChosenEvent, () => this.askToHandOver());
    this.subscribe(AutoConfirmedEvent, () => this.handOver());
    this.subscribe(SkipChosenEvent, () => this.skipAhead());
    this.subscribe(TurnDoneEvent, () => this.finishTurn());
  }

  private pickCell(cell: Cell): void {
    const battle = this.battle;

    if (battle && !this.busy && battle.turn.isEqual(this.side)) {
      this.actOn(battle, cell);
    }
  }

  private actOn(battle: Battle, cell: Cell): void {
    const standing = battle.getUnit(cell);
    const ordered = this.selected;

    if (this.asking === 'site') {
      this.buildAt(battle, cell);
    } else if (standing && this.targets.includes(standing)) {
      this.strikeAt(battle, standing);
    } else if (this.breakable.includes(cell)) {
      this.breakAt(battle, cell);
    } else if (standing?.side.isEqual(this.side) && !standing.hasActed) {
      this.turnTo(battle, standing);
    } else if (ordered && this.range?.includes(cell)) {
      this.moveSelected(battle, cell);
    }
  }

  private siteFence(): void {
    const battle = this.battle;
    const unit = this.selected;

    if (battle && unit?.canBuild) {
      this.asking = 'site';
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
    this.asking = 'unit';
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

    if (this.asking === 'retreat' || this.asking === 'handover') {
      this.asking = 'unit';
      this.view.askForUnit();
    } else if (this.asking === 'site' && battle && unit) {
      this.select(battle, unit);
    }
  }

  private askToHandOver(): void {
    if (this.battle?.turn.isEqual(this.side)) {
      this.asking = 'handover';
      this.view.askToHandOver();
    }
  }

  private handOver(): void {
    const battle = this.battle;

    if (battle) {
      this.asking = 'unit';
      this.auto = new TacticalPolicy(this.side);
      this.clearOrder();
      this.startPlayerTurn(battle);
    }
  }

  private skipAhead(): void {
    const battle = this.battle;

    if (battle && this.auto && !this.skipping) {
      this.skipping = true;
      this.stopOrdering();
      this.playSide(battle, battle.turn);
    }
  }

  private askToLeave(): void {
    if (this.battle?.turn.isEqual(this.side)) {
      this.asking = 'retreat';

      if (this.side.isAttacker) {
        this.view.askToRetreat();
      } else {
        this.view.askToFlee();
      }
    }
  }

  private offerRefuges(preferred: Province | undefined): void {
    this.controls.refuge.setOptions(toProvinceOptions(this.refuges));
    this.controls.refuge.setValue(preferred ? String(preferred.number) : '');
    this.view.allowRetreat(this.side.isAttacker || this.refuges.length > 0);
  }

  private findChosenRefuge(): Province | undefined {
    return findOptionProvince(this.refuges, this.controls.refuge.value);
  }

  private leave(): void {
    const battle = this.battle;

    if (battle) {
      this.asking = 'unit';
      battle.retreat(this.side);
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
    this.asking = 'unit';
    this.controls.board.clearRange();
  }

  private clearOrder(): void {
    this.selected = undefined;
    this.clearMarks();
  }

  private finishTurn(): void {
    const battle = this.battle;

    if (battle && !this.busy && battle.turn.isEqual(this.side)) {
      battle.endTurn();
      this.clearOrder();
      this.startEnemyTurn(battle);
    }
  }

  private startPlayerTurn(battle: Battle): void {
    this.showRound(battle);

    if (this.auto) {
      this.openSide(battle, this.side);
    } else {
      this.view.askForUnit();
    }
  }

  private startEnemyTurn(battle: Battle): void {
    this.showRound(battle);
    this.openSide(battle, this.side.opposite);
  }

  private openSide(battle: Battle, side: BattleSide): void {
    const policy = this.findPolicy(side);

    if (policy?.chooseRetreat(battle)) {
      battle.retreat(side);
      this.endBattle(battle);
    } else {
      this.announce(battle, side);
      this.playSide(battle, side);
    }
  }

  private showRound(battle: Battle): void {
    this.view.showClock(battle.clock);
    this.view.showArmies(battle);
    this.controls.sky.showPhase(battle.clock.phase);
    this.controls.clash.showPhase(battle.clock.phase);
    this.controls.board.showPhase(battle.clock.phase);
    this.controls.board.placeAll(battle.units);
  }

  private playSide(battle: Battle, side: BattleSide): void {
    const pending = battle.getUnits(side).filter((unit) => !unit.hasActed);
    const next = pending[0];

    if (next) {
      this.orderNext(battle, side, next);
    } else {
      battle.endTurn();
      this.settleOrEnd(battle);

      if (this.battle === battle) {
        this.openTurn(battle);
      }
    }
  }

  private openTurn(battle: Battle): void {
    if (battle.turn.isEqual(this.side)) {
      this.startPlayerTurn(battle);
    } else {
      this.startEnemyTurn(battle);
    }
  }

  private orderNext(battle: Battle, side: BattleSide, unit: BattleUnit): void {
    if (this.skipping) {
      this.giveOrder(battle, side, unit);
    } else {
      this.ordering = setTimeout(() => {
        this.ordering = undefined;

        if (this.battle === battle) {
          this.giveOrder(battle, side, unit);
        }
      }, ENEMY_ORDER_DELAY_MS);
    }
  }

  private giveOrder(battle: Battle, side: BattleSide, unit: BattleUnit): void {
    const policy = this.findPolicy(side);

    if (policy) {
      this.announce(battle, side);
      this.followOrder(battle, side, unit, policy.orderUnit(unit, battle));
    }
  }

  private followOrder(
    battle: Battle,
    side: BattleSide,
    unit: BattleUnit,
    order: UnitOrder,
  ): void {
    const path = battle.getMoveRange(unit).findPath(order.destination);

    unit.moveAlong(path);

    if (this.skipping) {
      this.controls.board.place(unit);
      this.actOnOrder(battle, side, unit, order);
    } else {
      this.controls.board.walk(unit, path, () =>
        this.actOnOrder(battle, side, unit, order),
      );
    }
  }

  private actOnOrder(
    battle: Battle,
    side: BattleSide,
    unit: BattleUnit,
    order: UnitOrder,
  ): void {
    const target = order.target;
    const fence = order.fence;

    if (this.battle !== battle) {
      this.stopOrdering();
    } else if (battle.isOver) {
      this.endBattle(battle);
    } else if (target?.isStanding) {
      this.clashInto(battle, side, unit, target);
    } else if (fence) {
      this.workAt(battle, side, unit, fence);
    } else {
      this.holdUnit(unit);
      this.resume(battle, side);
    }
  }

  private clashInto(
    battle: Battle,
    side: BattleSide,
    unit: BattleUnit,
    target: BattleUnit,
  ): void {
    this.view.showClashing();

    const clash = battle.strike(unit, target);

    if (this.skipping) {
      this.showRound(battle);
      this.resume(battle, side);
    } else {
      this.controls.clash.play(clash, () => {
        this.showRound(battle);
        this.announce(battle, side);
        this.resume(battle, side);
      });
    }
  }

  private workAt(
    battle: Battle,
    side: BattleSide,
    unit: BattleUnit,
    cell: Cell,
  ): void {
    const breaking = cell.terrain === 'fence';
    const done = breaking
      ? battle.breakDown(unit, cell)
      : battle.build(unit, cell);

    this.controls.board.redraw(battle, cell);
    this.controls.board.place(unit);

    if (breaking) {
      this.view.showBreaking(unit, done, true);
    } else {
      this.view.showWork(unit, done, true);
    }

    this.resume(battle, side);
  }

  private announce(battle: Battle, side: BattleSide): void {
    if (side.isEqual(this.side)) {
      this.view.showHandedOver(battle.getArmy(side).commander.name);
    } else {
      this.view.showEnemyTurn();
    }
  }

  private findPolicy(side: BattleSide): TacticalPolicy | undefined {
    return side.isEqual(this.side.opposite) ? this.enemy : this.auto;
  }

  private resume(battle: Battle, side: BattleSide): void {
    if (this.battle === battle) {
      this.settleOrEnd(battle);
    }

    if (this.battle === battle) {
      this.playSide(battle, side);
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
      this.context.events.publish(
        new BattleEndedEvent(outcome, this.findChosenRefuge()),
      );
    }
  }
}

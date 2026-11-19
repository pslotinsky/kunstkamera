import type { Battle } from '../Battle';
import { BattleSide } from '../BattleSide';
import type { BattleUnit } from '../BattleUnit';
import type { Cell } from '../Cell';
import type { UnitOrder } from '../UnitOrder';
import { SCORE_WIN } from './BattleScore';
import { TacticalSearch } from './TacticalSearch';

const RETREAT_FLOOR = 40;
const RETREAT_SALVAGE = 0.4;

export class TacticalPolicy {
  private readonly side: BattleSide;
  private readonly enemySide: BattleSide;
  private readonly search: TacticalSearch;

  public constructor(side: BattleSide, depth?: number) {
    this.side = side;
    this.enemySide = side.opposite;
    this.search = new TacticalSearch(side, depth);
  }

  public get nodes(): number {
    return this.search.nodes;
  }

  public orderUnit(unit: BattleUnit, battle: Battle): UnitOrder {
    return this.search.chooseOrder(unit, battle);
  }

  public chooseRetreat(battle: Battle): boolean {
    if (battle.isOver || this.isFlagThreatened(battle)) {
      return false;
    }

    return this.measureLeaving(battle) > this.search.measureBest(battle);
  }

  private measureLeaving(battle: Battle): number {
    const saved = battle.getStrength(this.side);

    if (saved < RETREAT_FLOOR) {
      return -SCORE_WIN;
    }

    const committed = battle
      .getUnits(this.side)
      .reduce((total, unit) => total + unit.committedStrength, 0);
    const share = committed > 0 ? Math.min(saved / committed, 1) : 0;

    return -SCORE_WIN * (1 - RETREAT_SALVAGE * share);
  }

  private isFlagThreatened(battle: Battle): boolean {
    const flag = battle.field.getFlag(this.side);

    return battle
      .getUnits(this.enemySide)
      .some((unit) => this.measureDistance(unit, flag) <= unit.move);
  }

  private measureDistance(unit: BattleUnit, flag: Cell): number {
    const columns = Math.abs(unit.cell.column - flag.column);
    const rows = Math.abs(unit.cell.row - flag.row);

    return columns + rows;
  }
}

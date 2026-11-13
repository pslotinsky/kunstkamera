import type { SquadId } from '@/domain/battle/battle-squad.entity';
import { Control } from '@/lib/control';

import {
  BattleTimelineTemplate,
  ElementClass,
  ModifierClass,
  type Params,
} from './battle-timeline.template';

export class BattleTimelineControl extends Control<Params> {
  public async showTurn(squadId: SquadId): Promise<void> {
    this.clearCurrentTurn();

    const cell = this.findCell(squadId);

    if (cell) {
      cell.classList.add(ModifierClass.CellCurrent);

      await this.moveToFront(cell);
    }
  }

  public async playDeath(squadId: SquadId): Promise<void> {
    const cell = this.findCell(squadId);

    if (cell) {
      await this.dom.animateClass(ModifierClass.CellLeaving, cell);
      cell.remove();
      await this.dom.transition(() => this.updatePositions());
    }
  }

  public clearCurrentTurn(): void {
    const cell = this.dom.root.querySelector(`.${ModifierClass.CellCurrent}`);
    cell?.classList.remove(ModifierClass.CellCurrent);
  }

  public select(squadId: SquadId): void {
    const cell = this.findCell(squadId);
    cell?.classList.add(ModifierClass.CellSelected);
  }

  public deselect(squadId: SquadId): void {
    const cell = this.findCell(squadId);
    cell?.classList.remove(ModifierClass.CellSelected);
  }

  protected override onAttach(): void {
    this.updatePositions();
  }

  protected createTemplate(): BattleTimelineTemplate {
    return new BattleTimelineTemplate();
  }

  private async moveToFront(current: HTMLElement): Promise<void> {
    const cells = Array.from(
      this.dom.root.querySelectorAll<HTMLElement>(`.${ElementClass.Cell}`),
    );
    const completed = cells.slice(0, cells.indexOf(current));

    if (completed.length > 0) {
      this.dom.root.append(...completed);
      await this.dom.transition(() => this.updatePositions());
    }
  }

  private updatePositions(): void {
    const cells = this.dom.root.querySelectorAll<HTMLElement>(
      `.${ElementClass.Cell}`,
    );

    cells.forEach((cell, index) => {
      cell.style.setProperty('--position', String(index));
    });
    this.dom.setStyleProperty('--cell-count', String(cells.length));
  }

  private findCell(squadId: SquadId): HTMLElement | null {
    return this.dom.root.querySelector<HTMLElement>(
      `[data-squad-id="${squadId}"]`,
    );
  }
}

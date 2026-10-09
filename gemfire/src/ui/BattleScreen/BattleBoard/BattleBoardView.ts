import { html, type TemplateResult } from 'lit-html';

import type { Battle } from '@/core/domain/Battle';
import type { Phase } from '@/core/domain/BattleClock';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import type { Cell } from '@/core/domain/Cell';
import { Facing } from '@/core/domain/Facing';
import { View } from '@/lib/View';
import type { SoundBoard } from '@/ui/sound/SoundBoard';

import { unitPiece } from '../../art/unitPiece';
import { CellPickedEvent } from './CellPickedEvent';

import styles from './BattleBoard.module.scss';

const FIRST_TRACK = 1;
const CELL_SPAN = 100;

export interface Offset {
  readonly columns: number;
  readonly rows: number;
}

function toFrame(offset: Offset): Keyframe {
  return {
    translate: `${offset.columns * CELL_SPAN}% ${offset.rows * CELL_SPAN}%`,
  };
}

const TINTS: Readonly<Record<Phase, string>> = {
  sunrise: styles.sunrise!,
  noon: styles.noon!,
  sunset: styles.sunset!,
  midnight: styles.midnight!,
};

export interface BattleBoardContext {
  readonly sounds: SoundBoard;
}

export class BattleBoardView extends View<BattleBoardContext> {
  protected readonly rootClass = styles.root!;

  private readonly cellElements = new Map<Cell, HTMLElement>();
  private readonly cellsByElement = new Map<HTMLElement, Cell>();
  private readonly pieces = new Map<BattleUnit, HTMLElement>();
  private readonly standings = new Map<BattleUnit, Cell>();
  private readonly daylight = document.createElement('div');
  private readonly marked = new Set<HTMLElement>();
  private readonly sliding = new Map<BattleUnit, Animation>();

  public get template(): TemplateResult {
    return html`
      <div
        class=${styles.root}
        data-board
        @click=${(event: Event) => this.pickCell(event)}
      ></div>
    `;
  }

  public draw(battle: Battle): void {
    this.forget();

    for (const cell of battle.field.allCells) {
      this.addCell(cell, battle.field.getSprite(cell));
    }

    for (const unit of battle.units) {
      this.addPiece(unit);
    }

    this.element.replaceChildren(
      ...this.cellElements.values(),
      ...this.pieces.values(),
      this.daylight,
    );

    this.warmPieces(battle.units);
  }

  public showPhase(phase: Phase): void {
    this.daylight.className = `${styles.daylight!} ${TINTS[phase]}`;
  }

  public redraw(cell: Cell, sprite: string): void {
    const element = this.cellElements.get(cell);

    if (element) {
      element.style.backgroundImage = `url(/battle-map/${sprite}.webp)`;
    }
  }

  public place(unit: BattleUnit): void {
    const piece = this.pieces.get(unit);

    if (piece) {
      this.turn(unit, unit.facing);
      this.putOn(piece, unit.cell);
      this.standings.set(unit, unit.cell);
      this.countOf(piece).textContent = String(unit.strength);
      piece.classList.toggle(styles.spent!, unit.hasActed);
      piece.classList.toggle(styles.fallen!, !unit.isStanding);
    }
  }

  public findStanding(unit: BattleUnit): Cell | undefined {
    return this.standings.get(unit);
  }

  public turn(unit: BattleUnit, facing: Facing): void {
    const piece = this.pieces.get(unit);
    const source = unitPiece(unit, facing);

    if (piece) {
      const portrait = this.portraitOf(piece);

      if (portrait.getAttribute('src') !== source) {
        portrait.setAttribute('src', source);
      }

      portrait.classList.toggle(styles.mirrored!, facing.isMirrored);
    }
  }

  public slideAlong(
    unit: BattleUnit,
    offsets: readonly Offset[],
    stepMs: number,
  ): void {
    const piece = this.pieces.get(unit);

    if (piece && typeof piece.animate === 'function') {
      const frames = [{ translate: '0% 0%' }, ...offsets.map(toFrame)];

      this.sliding.get(unit)?.cancel();
      this.sliding.set(
        unit,
        piece.animate(frames, {
          duration: offsets.length * stepMs,
          easing: 'linear',
          fill: 'forwards',
        }),
      );
    }
  }

  public stopSliding(unit: BattleUnit): void {
    this.sliding.get(unit)?.cancel();
    this.sliding.delete(unit);
  }

  public markChoices(
    standing: Cell,
    reachable: readonly Cell[],
    targets: readonly Cell[],
  ): void {
    this.clearMarks();
    this.mark(standing, styles.selected!);

    for (const cell of reachable) {
      this.mark(cell, styles.reachable!);
    }

    for (const cell of targets) {
      this.mark(cell, styles.target!);
    }
  }

  public clearMarks(): void {
    for (const element of this.marked) {
      element.classList.remove(
        styles.selected!,
        styles.reachable!,
        styles.target!,
      );
    }

    this.marked.clear();
  }

  private pickCell(event: Event): void {
    const clicked =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>(`.${styles.cell}`)
        : undefined;
    const cell = clicked ? this.cellsByElement.get(clicked) : undefined;

    if (cell) {
      this.publish(new CellPickedEvent(cell));
    }
  }

  private warmPieces(units: readonly BattleUnit[]): void {
    for (const unit of units) {
      for (const facing of Facing.all) {
        const warm = new Image();

        warm.src = unitPiece(unit, facing);
      }
    }
  }

  private forget(): void {
    this.cellElements.clear();
    this.cellsByElement.clear();
    this.pieces.clear();
    this.standings.clear();
    this.marked.clear();
  }

  private addCell(cell: Cell, sprite: string): void {
    const element = document.createElement('div');

    element.className = styles.cell!;
    element.dataset.column = String(cell.column);
    element.dataset.row = String(cell.row);
    element.style.backgroundImage = `url(/battle-map/${sprite}.webp)`;
    this.putOn(element, cell);

    this.cellElements.set(cell, element);
    this.cellsByElement.set(element, cell);
  }

  private addPiece(unit: BattleUnit): void {
    const piece = document.createElement('div');
    const portrait = document.createElement('img');
    const count = document.createElement('span');

    piece.className = styles.piece!;
    portrait.className = styles.portrait!;
    portrait.alt = unit.name;
    count.className = styles.count!;
    piece.append(portrait, count);

    this.pieces.set(unit, piece);
  }

  private portraitOf(piece: HTMLElement): HTMLImageElement {
    return piece.querySelector<HTMLImageElement>(`.${styles.portrait}`)!;
  }

  private countOf(piece: HTMLElement): HTMLElement {
    return piece.querySelector<HTMLElement>(`.${styles.count}`)!;
  }

  private putOn(element: HTMLElement, cell: Cell): void {
    element.style.gridColumn = String(cell.column + FIRST_TRACK);
    element.style.gridRow = String(cell.row + FIRST_TRACK);
  }

  private mark(cell: Cell, style: string): void {
    const element = this.cellElements.get(cell);

    if (element) {
      element.classList.add(style);
      this.marked.add(element);
    }
  }
}

import { html, render, type TemplateResult } from 'lit-html';

import foodIconUrl from '@/assets/icons/food.webp';
import type { Army } from '@/core/domain/Army';
import type { Battle } from '@/core/domain/Battle';
import type { BattleClock } from '@/core/domain/BattleClock';
import { BattleSide } from '@/core/domain/BattleSide';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { Facing } from '@/core/domain/Facing';
import { countTo } from '@/lib/dom/countTo';
import { View } from '@/lib/View';
import { getFamilyCrestUrl } from '@/ui/art/getFamilyCrestUrl';
import { getGeneralPortraitUrl } from '@/ui/art/getGeneralPortraitUrl';
import { unitPiece } from '@/ui/art/unitPiece';

import { ActionCancelledEvent } from './ActionCancelledEvent';
import { AutoChosenEvent } from './AutoChosenEvent';
import { AutoConfirmedEvent } from './AutoConfirmedEvent';
import { FenceChosenEvent } from './FenceChosenEvent';
import { RetreatChosenEvent } from './RetreatChosenEvent';
import { RetreatConfirmedEvent } from './RetreatConfirmedEvent';
import { SkipChosenEvent } from './SkipChosenEvent';
import { TurnDoneEvent } from './TurnDoneEvent';
import type { BattleScreenContext, BattleScreenViews } from './types';
import { UnitWaitedEvent } from './UnitWaitedEvent';

import styles from './BattleScreen.module.scss';

type Order =
  | 'retreat'
  | 'auto'
  | 'confirm'
  | 'hand-over'
  | 'stay'
  | 'fence'
  | 'cancel'
  | 'wait'
  | 'done'
  | 'skip';

const IDLE: readonly Order[] = ['retreat', 'auto', 'done'];
const ORDERING: readonly Order[] = ['retreat', 'auto', 'wait', 'done'];
const BUILDING: readonly Order[] = ['retreat', 'auto', 'fence', 'wait', 'done'];
const SITING: readonly Order[] = ['cancel'];
const LEAVING: readonly Order[] = ['confirm', 'stay'];
const HANDING_OVER: readonly Order[] = ['hand-over', 'stay'];
const PLAYING_ITSELF: readonly Order[] = ['skip'];
const WATCHING: readonly Order[] = [];
const SIDES: readonly BattleSide[] = [BattleSide.attacker, BattleSide.defender];

const DEFAULT_COLUMNS = 10;
const DEFAULT_ROWS = 8;
const BOARD_HEIGHT = 832;
const FOOTER_HEIGHT = 64;
const SIDE_MIN_WIDTH = 270;
const SIDE_MAX_WIDTH = 400;
const GAP = 16;
const MARGIN = 16;

export class BattleScreenView extends View<
  BattleScreenContext,
  BattleScreenViews
> {
  protected readonly rootClass = styles.root!;

  private retreatable = true;
  private columns = DEFAULT_COLUMNS;
  private rows = DEFAULT_ROWS;

  public get template(): TemplateResult {
    return html`
      <section class="${styles.root} ${styles.hidden}">
        <div class=${styles.stage}>
          ${this.renderSide(BattleSide.attacker, styles.mine!)}
          <div class=${styles.field}>${this.views.board.template}</div>
          ${this.renderSide(BattleSide.defender, styles.theirs!)}
          <div class="${styles.box} ${styles.placeBox}">
            <span class=${styles.place} data-place></span>
          </div>
          <div class="${styles.box} ${styles.bar}">
            ${this.renderOrders()}
            <span class=${styles.center}>
              <span class=${styles.prompt} data-prompt></span>
              <span class="${styles.refuge} ${styles.gone}" data-refuge>
                ${this.views.refuge.template}
              </span>
            </span>
            ${this.renderActions()}
          </div>
          <div class="${styles.box} ${styles.dayBox}">
            <span class=${styles.clock} data-clock></span>
            ${this.views.sky.template}
          </div>
        </div>
        ${this.views.clash.template}
      </section>
    `;
  }

  private renderOrders(): TemplateResult {
    return html`
          <span class=${styles.orders}>
            <button
              type="button"
              data-order="retreat"
              @click=${() => this.publish(new RetreatChosenEvent())}
            >
              Retreat
            </button>
            <button
              type="button"
              data-order="confirm"
              @click=${() => this.publish(new RetreatConfirmedEvent())}
            >
              Retreat
            </button>
            <button
              type="button"
              data-order="auto"
              @click=${() => this.publish(new AutoChosenEvent())}
            >
              Auto
            </button>
            <button
              type="button"
              data-order="hand-over"
              @click=${() => this.publish(new AutoConfirmedEvent())}
            >
              Auto
            </button>
            <button
              type="button"
              data-order="stay"
              @click=${() => this.publish(new ActionCancelledEvent())}
            >
              Stay
            </button>
          </span>
    `;
  }

  private renderActions(): TemplateResult {
    return html`
          <span class=${styles.actions}>
            <button
              type="button"
              data-order="fence"
              @click=${() => this.publish(new FenceChosenEvent())}
            >
              Fence
            </button>
            <button
              type="button"
              data-order="cancel"
              @click=${() => this.publish(new ActionCancelledEvent())}
            >
              Cancel
            </button>
            <button
              type="button"
              data-order="wait"
              @click=${() => this.publish(new UnitWaitedEvent())}
            >
              Wait
            </button>
            <button
              type="button"
              data-order="done"
              @click=${() => this.publish(new TurnDoneEvent())}
            >
              Done
            </button>
            <button
              type="button"
              data-order="skip"
              @click=${() => this.publish(new SkipChosenEvent())}
            >
              Skip
            </button>
          </span>
    `;
  }

  public show(): void {
    this.element.classList.remove(styles.hidden!);
    this.fitStage();
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  public showBattle(battle: Battle): void {
    this.columns = battle.field.columns;
    this.rows = battle.field.rows;
    this.element.style.setProperty('--columns', String(this.columns));
    this.element.style.setProperty('--rows', String(this.rows));
    this.fitStage();
    this.place.textContent = battle.field.name;
    for (const side of SIDES) {
      this.showCommander(side, battle.getArmy(side));
    }
  }

  public showClock(clock: BattleClock): void {
    this.clock.textContent = `Day ${clock.day}`;
  }

  public showArmies(battle: Battle): void {
    for (const side of SIDES) {
      this.showArmy(side, battle);
    }
  }

  public askForUnit(): void {
    this.ask('Choose a unit to order.', IDLE);
  }

  public askForOrder(unit: BattleUnit, armed: boolean, builds: boolean): void {
    const asked = armed ? 'move, or strike whom?' : 'move where?';

    this.ask(
      `${unit.name} at ${unit.cell.name} — ${asked}`,
      builds ? BUILDING : ORDERING,
    );
  }

  public askForStrike(unit: BattleUnit, builds: boolean): void {
    this.ask(
      `${unit.name} at ${unit.cell.name} — strike whom?`,
      builds ? BUILDING : ORDERING,
    );
  }

  public askForSite(unit: BattleUnit): void {
    this.ask(`${unit.name} at ${unit.cell.name} — fence where?`, SITING);
  }

  public showWork(unit: BattleUnit, done: boolean, watching = false): void {
    const told = done
      ? 'The fence is up.'
      : `${unit.name} could not manage it.`;

    this.ask(told, watching ? WATCHING : IDLE);
  }

  public showBreaking(unit: BattleUnit, done: boolean, watching = false): void {
    const told = done
      ? 'The fence comes down.'
      : `${unit.name} could not manage it.`;

    this.ask(told, watching ? WATCHING : IDLE);
  }

  public allowRetreat(allowed: boolean): void {
    this.retreatable = allowed;
  }

  public askToRetreat(): void {
    this.ask('Abandon the field and go home?', LEAVING);
  }

  public askToFlee(): void {
    this.ask('Abandon the field and flee to', LEAVING);
    this.refuge.classList.remove(styles.gone!);
  }

  public askToHandOver(): void {
    this.ask('Let the computer fight the rest of this battle?', HANDING_OVER);
  }

  public showHandedOver(commander: string): void {
    this.ask(`${commander} fights on alone…`, PLAYING_ITSELF);
  }

  public showWalking(): void {
    this.ask('Moving…', WATCHING);
  }

  public showClashing(): void {
    this.ask('Blows fall…', WATCHING);
  }

  public showEnemyTurn(): void {
    this.ask('The enemy is moving…', WATCHING);
  }

  private fitStage(): void {
    const boardWidth = (BOARD_HEIGHT * this.columns) / this.rows;
    const roomWidth = this.element.clientWidth - 2 * MARGIN;
    const roomHeight = this.element.clientHeight - 2 * MARGIN;
    const height = BOARD_HEIGHT + GAP + FOOTER_HEIGHT;
    const narrowest = boardWidth + 2 * (SIDE_MIN_WIDTH + GAP);
    const scale = Math.min(roomHeight / height, roomWidth / narrowest);
    const side = (roomWidth / scale - boardWidth) / 2 - GAP;

    if (scale > 0) {
      this.element.style.setProperty('--stage-scale', String(scale));
      this.element.style.setProperty('--footer', `${FOOTER_HEIGHT}px`);
      this.element.style.setProperty(
        '--side',
        `${Math.min(side, SIDE_MAX_WIDTH)}px`,
      );
    }
  }

  private renderSide(side: BattleSide, tone: string): TemplateResult {
    return html`
      <aside class="${styles.side} ${tone}">
        <div class=${styles.heraldry}>
          <img class=${styles.crest} data-crest=${side} alt="" />
          <img class=${styles.portrait} data-portrait=${side} alt="" />
        </div>
        <span class=${styles.commander} data-commander=${side}></span>
        <span class=${styles.supply} data-supply=${side}>
          <img class=${styles.foodIcon} src=${foodIconUrl} alt="Food" title="Food" />
          <span data-food=${side}></span> ·
          <span data-days=${side}></span> days
        </span>
        <hr class=${styles.divider} />
        <ul class=${styles.roster} data-roster=${side}></ul>
      </aside>
    `;
  }

  private showRoster(side: BattleSide, battle: Battle): void {
    render(
      battle.getUnits(side).map((unit) => this.renderUnit(unit)),
      this.rosterOf(side),
    );
  }

  private renderUnit(unit: BattleUnit): TemplateResult {
    const fallen = unit.isStanding ? '' : styles.fallen;

    return html`
      <li class="${styles.unit} ${fallen}">
        <img class=${styles.unitIcon} src=${unitPiece(unit, Facing.south)} alt="" />
        <span class=${styles.unitName}>${unit.name}</span>
        <span class=${styles.strength}>${unit.strength}</span>
      </li>
    `;
  }

  private ask(prompt: string, offered: readonly Order[]): void {
    this.prompt.textContent = prompt;
    this.refuge.classList.add(styles.gone!);

    for (const button of this.orderButtons) {
      const order = button.dataset.order as Order;
      const shown =
        offered.includes(order) && (order !== 'retreat' || this.retreatable);

      button.classList.toggle(styles.gone!, !shown);
    }
  }

  private showCommander(side: BattleSide, army: Army): void {
    const family = this.context.world.findFamilyOf(army.commander);
    const crest = this.crestOf(side);

    this.commanderOf(side).textContent = army.commander.name;
    this.portraitOf(side).src = getGeneralPortraitUrl(army.commander);
    crest.classList.toggle(styles.gone!, !family);

    if (family) {
      crest.src = getFamilyCrestUrl(family);
    }
  }

  private showArmy(side: BattleSide, battle: Battle): void {
    const army = battle.getArmy(side);

    this.spendFood(side, army.food);
    this.daysOf(side).textContent = String(army.supplyDays);
    this.showRoster(side, battle);
  }

  private spendFood(side: BattleSide, food: number): void {
    const element = this.foodOf(side);
    const shown = element.textContent ?? '';

    if (shown === '') {
      element.textContent = String(food);
    } else if (Number(shown) !== food) {
      this.flashSupply(side);
      countTo(element, Number(shown), food);
    }
  }

  private flashSupply(side: BattleSide): void {
    const supply = this.supplyOf(side);

    supply.classList.remove(styles.changed!);
    supply.getBoundingClientRect();
    supply.classList.add(styles.changed!);
  }

  private commanderOf(side: BattleSide): HTMLElement {
    return this.element.querySelector<HTMLElement>(
      `[data-commander="${side}"]`,
    )!;
  }

  private crestOf(side: BattleSide): HTMLImageElement {
    return this.element.querySelector<HTMLImageElement>(
      `[data-crest="${side}"]`,
    )!;
  }

  private portraitOf(side: BattleSide): HTMLImageElement {
    return this.element.querySelector<HTMLImageElement>(
      `[data-portrait="${side}"]`,
    )!;
  }

  private rosterOf(side: BattleSide): HTMLElement {
    return this.element.querySelector<HTMLElement>(`[data-roster="${side}"]`)!;
  }

  private supplyOf(side: BattleSide): HTMLElement {
    return this.element.querySelector<HTMLElement>(`[data-supply="${side}"]`)!;
  }

  private foodOf(side: BattleSide): HTMLElement {
    return this.element.querySelector<HTMLElement>(`[data-food="${side}"]`)!;
  }

  private daysOf(side: BattleSide): HTMLElement {
    return this.element.querySelector<HTMLElement>(`[data-days="${side}"]`)!;
  }

  private get orderButtons(): readonly HTMLButtonElement[] {
    return [
      ...this.element.querySelectorAll<HTMLButtonElement>('[data-order]'),
    ];
  }

  private get place(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-place]')!;
  }

  private get clock(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-clock]')!;
  }

  private get prompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-prompt]')!;
  }

  private get refuge(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-refuge]')!;
  }
}

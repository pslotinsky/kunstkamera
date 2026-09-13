import { html, type TemplateResult } from 'lit-html';

import type { Army } from '@/core/domain/Army';
import type { Battle } from '@/core/domain/Battle';
import type { BattleClock } from '@/core/domain/BattleClock';
import type { BattleSide } from '@/core/domain/BattleOutcome';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { countTo } from '@/lib/dom/countTo';
import { View } from '@/lib/View';

import { ActionCancelledEvent } from './ActionCancelledEvent';
import { FenceChosenEvent } from './FenceChosenEvent';
import { RetreatChosenEvent } from './RetreatChosenEvent';
import { RetreatConfirmedEvent } from './RetreatConfirmedEvent';
import { ENEMY_SIDE, PLAYER_SIDE } from './sides';
import { TurnDoneEvent } from './TurnDoneEvent';
import type { BattleScreenContext, BattleScreenViews } from './types';
import { UnitWaitedEvent } from './UnitWaitedEvent';

import styles from './BattleScreen.module.scss';

type Order =
  | 'retreat'
  | 'confirm'
  | 'stay'
  | 'fence'
  | 'cancel'
  | 'wait'
  | 'done';

const IDLE: readonly Order[] = ['retreat', 'done'];
const ORDERING: readonly Order[] = ['retreat', 'wait', 'done'];
const BUILDING: readonly Order[] = ['retreat', 'fence', 'wait', 'done'];
const SITING: readonly Order[] = ['cancel'];
const LEAVING: readonly Order[] = ['confirm', 'stay'];
const WATCHING: readonly Order[] = [];

export class BattleScreenView extends View<
  BattleScreenContext,
  BattleScreenViews
> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <section class="${styles.root} ${styles.hidden}">
        <header class=${styles.header}>
          <span class="${styles.army} ${styles.mine}">
            <span class=${styles.commander} data-commander="attacker"></span>
            <span class=${styles.supply} data-supply="attacker">
              food <span data-food="attacker"></span>,
              <span data-days="attacker"></span> days
            </span>
          </span>
          <span class=${styles.almanac}>
            <span class=${styles.when}>
              <span class=${styles.clock} data-clock></span>
              <span class=${styles.place} data-place></span>
            </span>
            ${this.views.sky.template}
          </span>
          <span class="${styles.army} ${styles.theirs}">
            <span class=${styles.commander} data-commander="defender"></span>
            <span class=${styles.supply} data-supply="defender">
              food <span data-food="defender"></span>,
              <span data-days="defender"></span> days
            </span>
          </span>
        </header>
        <div class=${styles.field}>${this.views.board.template}</div>
        <footer class=${styles.footer}>
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
              data-order="stay"
              @click=${() => this.publish(new ActionCancelledEvent())}
            >
              Stay
            </button>
          </span>
          <span class=${styles.prompt} data-prompt></span>
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
          </span>
        </footer>
        ${this.views.clash.template}
      </section>
    `;
  }

  public show(): void {
    this.element.classList.remove(styles.hidden!);
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  public showBattle(battle: Battle): void {
    this.element.style.setProperty('--columns', String(battle.field.columns));
    this.element.style.setProperty('--rows', String(battle.field.rows));
    this.place.textContent = battle.field.name;
    this.showCommander(PLAYER_SIDE, battle.getArmy(PLAYER_SIDE));
    this.showCommander(ENEMY_SIDE, battle.getArmy(ENEMY_SIDE));
  }

  public showClock(clock: BattleClock): void {
    this.clock.textContent = `Day ${clock.day}`;
  }

  public showArmies(battle: Battle): void {
    this.showArmy(PLAYER_SIDE, battle);
    this.showArmy(ENEMY_SIDE, battle);
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

  public showWork(unit: BattleUnit, done: boolean): void {
    const told = done
      ? 'The fence is up.'
      : `${unit.name} could not manage it.`;

    this.ask(told, IDLE);
  }

  public showBreaking(unit: BattleUnit, done: boolean): void {
    const told = done
      ? 'The fence comes down.'
      : `${unit.name} could not manage it.`;

    this.ask(told, IDLE);
  }

  public askToRetreat(): void {
    this.ask('Abandon the field and go home?', LEAVING);
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

  private ask(prompt: string, offered: readonly Order[]): void {
    this.prompt.textContent = prompt;

    for (const button of this.orderButtons) {
      const order = button.dataset.order as Order;

      button.classList.toggle(styles.gone!, !offered.includes(order));
    }
  }

  private showCommander(side: BattleSide, army: Army): void {
    this.commanderOf(side).textContent = army.commander.name;
  }

  private showArmy(side: BattleSide, battle: Battle): void {
    const army = battle.getArmy(side);

    this.spendFood(side, army.food);
    this.daysOf(side).textContent = String(army.supplyDays);
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
}

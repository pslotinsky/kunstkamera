import { html, type TemplateResult } from 'lit-html';

import type { Army } from '@/core/domain/Army';
import type { Battle } from '@/core/domain/Battle';
import type { BattleClock } from '@/core/domain/BattleClock';
import type { BattleSide } from '@/core/domain/BattleOutcome';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { countTo } from '@/lib/dom/countTo';
import { View } from '@/lib/View';

import { ENEMY_SIDE, PLAYER_SIDE } from './sides';
import { TurnDoneEvent } from './TurnDoneEvent';
import type { BattleScreenContext, BattleScreenViews } from './types';
import { UnitWaitedEvent } from './UnitWaitedEvent';

import styles from './BattleScreen.module.scss';

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
          <span class=${styles.prompt} data-prompt></span>
          <span class=${styles.actions}>
            <button
              type="button"
              data-wait
              @click=${() => this.publish(new UnitWaitedEvent())}
            >
              Wait
            </button>
            <button
              type="button"
              data-done
              @click=${() => this.publish(new TurnDoneEvent())}
            >
              Done
            </button>
          </span>
        </footer>
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
    this.prompt.textContent = 'Choose a unit to order.';
    this.waitButton.disabled = true;
    this.doneButton.disabled = false;
  }

  public askForMove(unit: BattleUnit): void {
    this.prompt.textContent = `${unit.name} at ${unit.cell.name} — move where?`;
    this.waitButton.disabled = false;
    this.doneButton.disabled = false;
  }

  public showWalking(): void {
    this.prompt.textContent = 'Moving…';
    this.waitButton.disabled = true;
    this.doneButton.disabled = true;
  }

  public showEnemyTurn(): void {
    this.prompt.textContent = 'The enemy is moving…';
    this.waitButton.disabled = true;
    this.doneButton.disabled = true;
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

  private get place(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-place]')!;
  }

  private get clock(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-clock]')!;
  }

  private get prompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-prompt]')!;
  }

  private get waitButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('[data-wait]')!;
  }

  private get doneButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('[data-done]')!;
  }
}

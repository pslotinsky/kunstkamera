import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';
import { OptionsChosenEvent } from '@/ui/Options/events/OptionsChosenEvent';

import { MenuClosedEvent } from './events/MenuClosedEvent';
import { QuitChosenEvent } from './events/QuitChosenEvent';
import { QuitConfirmedEvent } from './events/QuitConfirmedEvent';
import type { GameMenuContext, GameMenuViews } from './types';

import styles from './GameMenu.module.scss';

export class GameMenuView extends View<GameMenuContext, GameMenuViews> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root}>
        <dialog class=${styles.dialog} aria-labelledby="game-menu-heading"
          @close=${() => this.publish(new MenuClosedEvent())}>
          <h2 id="game-menu-heading" class=${styles.heading}>Menu</h2>
          <nav class=${styles.choices} aria-label="Game menu" data-choices>
            <button class=${styles.choice} type="button" data-resume
              @click=${() => this.close()}>
              Resume
            </button>
            <button class=${styles.choice} type="button"
              @click=${() => this.publish(new OptionsChosenEvent())}>
              Options
            </button>
            <button class=${styles.choice} type="button"
              @click=${() => this.publish(new QuitChosenEvent())}>
              Quit to Title
            </button>
          </nav>
          <section class="${styles.confirm} ${styles.hidden}" data-confirm>
            <p class=${styles.warning}>
              Return to the title? This campaign will not be saved.
            </p>
            <div class=${styles.actions}>
              <button class=${styles.action} type="button" data-stay
                @click=${() => this.showChoices()}>
                Stay
              </button>
              <button class=${styles.action} type="button"
                @click=${() => this.publish(new QuitConfirmedEvent())}>
                Quit
              </button>
            </div>
          </section>
        </dialog>
        ${this.views.options.template}
      </div>
    `;
  }

  public get isOpen(): boolean {
    return this.dialog.open;
  }

  public open(): void {
    this.dialog.showModal();
    this.showChoices();
  }

  public close(): void {
    this.dialog.close();
  }

  public askToConfirm(): void {
    this.choices.classList.add(styles.hidden!);
    this.confirm.classList.remove(styles.hidden!);
    this.focus('[data-stay]');
  }

  private showChoices(): void {
    this.confirm.classList.add(styles.hidden!);
    this.choices.classList.remove(styles.hidden!);
    this.focus('[data-resume]');
  }

  private focus(selector: string): void {
    this.element.querySelector<HTMLButtonElement>(selector)!.focus();
  }

  private get dialog(): HTMLDialogElement {
    return this.element.querySelector<HTMLDialogElement>(`.${styles.dialog}`)!;
  }

  private get choices(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-choices]')!;
  }

  private get confirm(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-confirm]')!;
  }
}

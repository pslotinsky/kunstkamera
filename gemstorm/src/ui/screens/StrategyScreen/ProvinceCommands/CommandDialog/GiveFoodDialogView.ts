import { html, type TemplateResult } from 'lit-html';

import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';

import { CommandDialogView } from './CommandDialogView';
import { FoodAmountChosenEvent } from './FoodAmountChosenEvent';

import styles from './CommandDialog.module.scss';

interface GiveFoodDialogContext {
  readonly name: string;
}

export class GiveFoodDialogView extends CommandDialogView<GiveFoodDialogContext> {
  public showAmounts(food: number): void {
    const minimum = Math.min(...GiveFoodCommand.AMOUNTS);
    const prompt = this.element.querySelector<HTMLElement>('[data-prompt]')!;

    this.amounts.hidden = false;
    this.confirmation.hidden = true;
    prompt.textContent =
      food >= minimum ? 'Give how much food?' : "You don't have enough food";

    const buttons =
      this.element.querySelectorAll<HTMLButtonElement>('[data-amount]');

    for (const button of buttons) {
      button.disabled = Number(button.dataset.amount) > food;
    }
  }

  public showTrainingConfirmation(amount: number): void {
    const prompt = this.element.querySelector<HTMLElement>(
      '[data-training-prompt]',
    )!;

    this.amounts.hidden = true;
    this.confirmation.hidden = false;
    prompt.textContent = `Give ${amount} Food to train the governor's Charisma?`;
  }

  protected renderBody(): TemplateResult {
    return html`
      <div data-gift-amounts>
        <p class=${styles.prompt} data-prompt>Give how much food?</p>
        <div class=${styles.options}>
          ${GiveFoodCommand.AMOUNTS.map(
            (amount) => html`<button
              class=${styles.button}
              type="button"
              data-amount=${amount}
              @click=${() => this.publish(new FoodAmountChosenEvent(amount))}
            >
              ${amount}
            </button>`,
          )}
        </div>
      </div>
      <div data-gift-confirmation hidden>
        <p class=${styles.prompt} data-training-prompt></p>
        <div class="${styles.actions} ${styles.footer}">
          <button class=${styles.button} type="button" data-action="confirm" @click=${() => this.confirm()}>
            Yea
          </button>
          <button class=${styles.button} type="button" @click=${() => this.cancel()}>
            Nay
          </button>
        </div>
      </div>
    `;
  }

  private get amounts(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-gift-amounts]')!;
  }

  private get confirmation(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-gift-confirmation]')!;
  }
}

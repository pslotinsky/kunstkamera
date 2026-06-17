import { html, type TemplateResult } from 'lit-html';

import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

const AMOUNTS = [20, 50, 80, 100];

interface GiveFoodDialogContext {
  readonly name: string;
}

export class GiveFoodDialogView extends CommandDialogView<GiveFoodDialogContext> {
  private chosen = 0;

  public get amount(): number {
    return this.chosen;
  }

  public setStock(food: number): void {
    const prompt = this.element.querySelector('[data-prompt]');

    if (prompt) {
      prompt.textContent =
        food >= Math.min(...AMOUNTS)
          ? 'Give how much food?'
          : "You don't have enough food";
    }

    const buttons =
      this.element.querySelectorAll<HTMLButtonElement>('[data-amount]');

    for (const button of buttons) {
      button.disabled = Number(button.dataset.amount) > food;
    }
  }

  protected renderBody(): TemplateResult {
    return html`
      <p class=${styles.prompt} data-prompt>Give how much food?</p>
      <div class=${styles.options}>
        ${AMOUNTS.map(
          (amount) => html`<button
            class=${styles.button}
            type="button"
            data-amount=${amount}
            @click=${() => this.choose(amount)}
          >
            ${amount}
          </button>`,
        )}
      </div>
    `;
  }

  private choose(amount: number): void {
    this.chosen = amount;
    this.confirm();
  }
}

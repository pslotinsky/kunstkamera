import { CommandDialogView } from './CommandDialogView';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';

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

  protected renderBody(): string {
    const options = AMOUNTS.map(
      (amount) =>
        `<button class="${styles.button}" type="button" data-amount="${amount}">${amount}</button>`,
    ).join('');

    return `
      <p class="${styles.prompt}" data-prompt>Give how much food?</p>
      <div class="${styles.actions}">${options}</div>
    `;
  }

  protected override onMount(): void {
    this.element.addEventListener(
      'click',
      (event) => {
        const button = (event.target as Element).closest<HTMLButtonElement>(
          'button',
        );

        if (button?.dataset.amount) {
          this.chosen = Number(button.dataset.amount);
          this.publish(new ConfirmClickedEvent());
        }
      },
      { signal: this.lifetime.signal },
    );
  }
}

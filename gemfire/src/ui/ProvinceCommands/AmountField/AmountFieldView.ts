import { View } from '@/lib/View';

import { AmountChangedEvent } from './AmountChangedEvent';
import { FRACTIONS } from './fractions';

import styles from './AmountField.module.scss';

export interface AmountFieldContext {
  readonly name: string;
}

export class AmountFieldView extends View<AmountFieldContext> {
  protected readonly rootClass = styles.options!;

  protected override get rootSelector(): string {
    return `[data-amount-field="${this.context.name}"]`;
  }

  public render(): string {
    const fractions = FRACTIONS.map(
      (fraction) =>
        `<button class="${styles.button}" type="button" data-fraction>${fraction.label}</button>`,
    ).join('');

    return `
      <div class="${styles.options}" data-amount-field="${this.context.name}">
        ${fractions}
        <input class="${styles.input}" type="number" min="0" data-amount-input />
      </div>
    `;
  }

  public showValue(value: number): void {
    this.input.value = value ? String(value) : '';
  }

  public applyConstraints(max: number, amounts: readonly number[]): void {
    this.input.max = String(max);
    this.input.disabled = max <= 0;

    this.fractionButtons.forEach((button, index) => {
      const amount = amounts[index] ?? 0;

      button.dataset.amount = String(amount);
      button.disabled = amount <= 0;
    });
  }

  protected override onMount(): void {
    this.element.addEventListener(
      'click',
      (event) => {
        const button = (event.target as Element).closest<HTMLButtonElement>(
          '[data-fraction]',
        );

        if (button) {
          this.publish(new AmountChangedEvent(Number(button.dataset.amount)));
        }
      },
      { signal: this.lifetime.signal },
    );

    this.input.addEventListener(
      'input',
      () => this.publish(new AmountChangedEvent(Number(this.input.value))),
      { signal: this.lifetime.signal },
    );
  }

  private get fractionButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-fraction]');
  }

  private get input(): HTMLInputElement {
    return this.element.querySelector<HTMLInputElement>('[data-amount-input]')!;
  }
}

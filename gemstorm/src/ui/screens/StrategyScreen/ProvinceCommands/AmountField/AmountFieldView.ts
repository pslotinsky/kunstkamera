import { html, type TemplateResult } from 'lit-html';

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

  public get template(): TemplateResult {
    return html`
      <div class=${styles.options} data-amount-field=${this.context.name}>
        ${FRACTIONS.map(
          (fraction) => html`<button
            class=${styles.button}
            type="button"
            data-fraction
            @click=${(event: Event) => this.handleFractionClick(event)}
          >
            ${fraction.label}
          </button>`,
        )}
        <input
          class=${styles.input}
          type="number"
          min="0"
          data-amount-input
          @input=${(event: Event) => this.handleInputChange(event)}
        />
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

  private handleFractionClick(event: Event): void {
    const button = event.currentTarget as HTMLButtonElement;

    this.publish(new AmountChangedEvent(Number(button.dataset.amount)));
  }

  private handleInputChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;

    this.publish(new AmountChangedEvent(Number(input.value)));
  }

  private get fractionButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-fraction]');
  }

  private get input(): HTMLInputElement {
    return this.element.querySelector<HTMLInputElement>('[data-amount-input]')!;
  }
}

import { html, type TemplateResult } from 'lit-html';

import type { TradeDirection } from '@/core/commands/province/TradeCommand';

import type { AmountFieldView } from '../AmountField/AmountFieldView';
import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

const TITLES: Record<TradeDirection, string> = {
  buy: 'Buy food',
  sell: 'Sell food',
};

interface TradeDialogContext {
  readonly name: string;
}

export class TradeDialogView extends CommandDialogView<
  TradeDialogContext,
  { amount: AmountFieldView }
> {
  public showDirection(direction: TradeDirection | undefined): void {
    this.title.textContent = direction ? TITLES[direction] : '';
  }

  public setRange(direction: TradeDirection | undefined, max: number): void {
    const verb = direction === 'sell' ? 'Sell' : 'Buy';

    this.range.textContent =
      max > 0 ? `${verb} how much (1-${max})?` : `${verb} how much?`;
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): TemplateResult {
    return html`
      <h2 class=${styles.title} data-title></h2>
      <p class=${styles.prompt} data-range></p>
      ${this.views.amount.template}
      <div class="${styles.actions} ${styles.footer}">
        <button
          class=${styles.button}
          type="button"
          data-action="confirm"
          disabled
          @click=${() => this.confirm()}
        >
          Yea
        </button>
        <button
          class=${styles.button}
          type="button"
          @click=${() => this.cancel()}
        >
          Nay
        </button>
      </div>
    `;
  }

  private get title(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-title]')!;
  }

  private get range(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-range]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}

import { html, type TemplateResult } from 'lit-html';

import type { TransportDirection } from '@/core/commands/province/TransportCommand';

import type { AmountFieldView } from '../AmountField/AmountFieldView';
import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

type Resource = 'gold' | 'food';

export interface TransportTarget {
  readonly number: number;
  readonly name: string;
  readonly gold: number;
  readonly food: number;
}

interface TransportDialogContext {
  readonly name: string;
}

export class TransportDialogView extends CommandDialogView<
  TransportDialogContext,
  { gold: AmountFieldView; food: AmountFieldView }
> {
  public showTarget(
    direction: TransportDirection | undefined,
    target: TransportTarget | undefined,
  ): void {
    const place = target ? `${target.number}: ${target.name}` : '';

    this.title.textContent =
      direction === 'receive'
        ? `Transport from ${place}`
        : `Transport to ${place}`;
  }

  public setRange(resource: Resource, max: number): void {
    this.range(resource).textContent = `How much ${resource} (0-${max})?`;
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): TemplateResult {
    return html`
      <h2 class=${styles.title} data-title></h2>
      <div>
        ${this.renderAmount('gold')} ${this.renderAmount('food')}
      </div>
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

  private renderAmount(resource: Resource): TemplateResult {
    return html`
      <div class=${styles.section}>
        <p class=${styles.prompt} data-range=${resource}></p>
        ${this.views[resource].template}
      </div>
    `;
  }

  private range(resource: Resource): HTMLElement {
    return this.element.querySelector<HTMLElement>(
      `[data-range="${resource}"]`,
    )!;
  }

  private get title(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-title]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}

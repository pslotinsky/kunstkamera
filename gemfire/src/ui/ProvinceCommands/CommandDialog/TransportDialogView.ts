import { html, type TemplateResult } from 'lit-html';

import type { TransportDirection } from '@/core/commands/province/TransportCommand';

import type { AmountFieldView } from '../AmountField/AmountFieldView';
import { CommandDialogView } from './CommandDialogView';
import { DirectionSelectedEvent } from './DirectionSelectedEvent';

import styles from './CommandDialog.module.scss';

const DIRECTIONS: {
  readonly direction: TransportDirection;
  readonly label: string;
}[] = [
  { direction: 'send', label: 'Send' },
  { direction: 'receive', label: 'Receive' },
];

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
  public showDirection(direction: TransportDirection | undefined): void {
    for (const button of this.directionButtons) {
      button.classList.toggle(
        styles.selected!,
        button.dataset.direction === direction,
      );
    }
  }

  public showTarget(
    direction: TransportDirection | undefined,
    target: TransportTarget | undefined,
  ): void {
    this.targetPrompt.classList.toggle(styles.hidden!, direction === undefined);

    if (direction) {
      if (target) {
        this.targetPrompt.textContent =
          direction === 'receive'
            ? `From ${target.number} ${target.name}`
            : `To ${target.number} ${target.name}`;
      } else {
        this.targetPrompt.textContent =
          direction === 'receive'
            ? 'Transport from where?'
            : 'Transport to where?';
      }
    }
  }

  public showAmounts(visible: boolean): void {
    this.amounts.classList.toggle(styles.hidden!, !visible);
    this.footer.classList.toggle(styles.hidden!, !visible);
  }

  public setRange(resource: Resource, max: number): void {
    this.range(resource).textContent = `How much ${resource} (0-${max})?`;
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): TemplateResult {
    return html`
      <div class=${styles.actions}>
        ${DIRECTIONS.map(
          ({ direction, label }) => html`<button
            class=${styles.button}
            type="button"
            data-direction=${direction}
            @click=${() => this.publish(new DirectionSelectedEvent(direction))}
          >
            ${label}
          </button>`,
        )}
      </div>
      <p
        class="${styles.prompt} ${styles.section} ${styles.hidden}"
        data-target
      ></p>
      <div class="${styles.section} ${styles.hidden}" data-amounts>
        ${this.renderAmount('gold')} ${this.renderAmount('food')}
      </div>
      <div
        class="${styles.actions} ${styles.section} ${styles.hidden}"
        data-footer
      >
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

  private get directionButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-direction]');
  }

  private range(resource: Resource): HTMLElement {
    return this.element.querySelector<HTMLElement>(
      `[data-range="${resource}"]`,
    )!;
  }

  private get amounts(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-amounts]')!;
  }

  private get footer(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-footer]')!;
  }

  private get targetPrompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-target]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}

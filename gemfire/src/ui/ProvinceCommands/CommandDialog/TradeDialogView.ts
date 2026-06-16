import type { TradeDirection } from '@/core/commands/province/TradeCommand';
import type { MarketRateName } from '@/core/domain/MarketRate';

import type { AmountFieldView } from '../AmountField/AmountFieldView';
import { CommandDialogView } from './CommandDialogView';
import { DirectionSelectedEvent } from './DirectionSelectedEvent';

import styles from './CommandDialog.module.scss';

const DIRECTIONS: {
  readonly direction: TradeDirection;
  readonly label: string;
}[] = [
  { direction: 'buy', label: 'Buy' },
  { direction: 'sell', label: 'Sell' },
];

const FLAVOR: Record<MarketRateName, string> = {
  low: 'The prices are low.',
  average: 'The prices are average.',
  high: 'The prices are high.',
};

interface TradeDialogContext {
  readonly name: string;
}

export class TradeDialogView extends CommandDialogView<
  TradeDialogContext,
  { amount: AmountFieldView }
> {
  public showFlavor(rate: MarketRateName): void {
    this.prompt.textContent = FLAVOR[rate];
  }

  public showDirection(direction: TradeDirection | undefined): void {
    for (const button of this.directionButtons) {
      button.classList.toggle(
        styles.selected!,
        button.dataset.direction === direction,
      );
    }
  }

  public showAmounts(visible: boolean): void {
    this.amounts.classList.toggle(styles.hidden!, !visible);
    this.footer.classList.toggle(styles.hidden!, !visible);
  }

  public setRange(direction: TradeDirection | undefined, max: number): void {
    const verb = direction === 'sell' ? 'Sell' : 'Buy';

    this.range.textContent =
      max > 0 ? `${verb} how much (1-${max})?` : `${verb} how much?`;
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): string {
    const directions = DIRECTIONS.map(
      ({ direction, label }) =>
        `<button class="${styles.button}" type="button" data-direction="${direction}">${label}</button>`,
    ).join('');

    return `
      <p class="${styles.prompt}" data-prompt></p>
      <div class="${styles.actions}">${directions}</div>
      <div class="${styles.section} ${styles.hidden}" data-amounts>
        <p class="${styles.prompt}" data-range></p>
        ${this.views.amount.render()}
      </div>
      <div class="${styles.actions} ${styles.section} ${styles.hidden}" data-footer>
        <button class="${styles.button}" type="button" data-action="confirm" disabled>Yea</button>
        <button class="${styles.button}" type="button" data-action="cancel">Nay</button>
      </div>
    `;
  }

  protected override onMount(): void {
    super.onMount();

    this.element.addEventListener(
      'click',
      (event) => {
        const button = (event.target as Element).closest<HTMLButtonElement>(
          '[data-direction]',
        );

        if (button?.dataset.direction) {
          this.publish(new DirectionSelectedEvent(button.dataset.direction));
        }
      },
      { signal: this.lifetime.signal },
    );
  }

  private get prompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-prompt]')!;
  }

  private get range(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-range]')!;
  }

  private get amounts(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-amounts]')!;
  }

  private get footer(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-footer]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }

  private get directionButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-direction]');
  }
}

import type { TradeDirection } from '@/core/commands/province/TradeCommand';
import type { MarketRateName } from '@/core/domain/MarketRate';

import { CommandDialogView } from './CommandDialogView';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';

import styles from './CommandDialog.module.scss';

const FRACTIONS = [
  { label: 'Some', value: 0.25 },
  { label: 'Half', value: 0.5 },
  { label: 'Most', value: 0.75 },
  { label: 'All', value: 1 },
];

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

export interface TradeLimits {
  readonly rate: MarketRateName;
  readonly buyMax: number;
  readonly sellMax: number;
}

interface TradeDialogContext {
  readonly name: string;
}

export class TradeDialogView extends CommandDialogView<TradeDialogContext> {
  private active: TradeDirection | undefined = undefined;
  private chosenAmount = 0;
  private buyMax = 0;
  private sellMax = 0;

  public get direction(): TradeDirection {
    return this.active ?? 'buy';
  }

  public get amount(): number {
    return this.chosenAmount;
  }

  public setLimits({ rate, buyMax, sellMax }: TradeLimits): void {
    this.buyMax = buyMax;
    this.sellMax = sellMax;

    const prompt = this.element.querySelector('[data-prompt]');

    if (prompt) {
      prompt.textContent = FLAVOR[rate];
    }

    this.applyAmountLimits();
  }

  public reset(): void {
    this.active = undefined;
    this.amounts.classList.add(styles.hidden!);

    for (const button of this.directionButtons) {
      button.classList.remove(styles.selected!);
    }
  }

  protected renderBody(): string {
    const directions = DIRECTIONS.map(
      ({ direction, label }) =>
        `<button class="${styles.button}" type="button" data-direction="${direction}">${label}</button>`,
    ).join('');
    const fractions = FRACTIONS.map(
      (fraction) =>
        `<button class="${styles.button}" type="button" data-fraction="${fraction.value}">${fraction.label}</button>`,
    ).join('');

    return `
      <p class="${styles.prompt}" data-prompt>${FLAVOR.average}</p>
      <div class="${styles.actions}">${directions}</div>
      <div class="${styles.section} ${styles.hidden}" data-amounts>
        <p class="${styles.prompt}">
          <span data-range></span>
          <span class="${styles.hover}" data-hover></span>
        </p>
        <div class="${styles.options}">
          ${fractions}
          <input class="${styles.input}" type="number" min="0" data-amount-input />
        </div>
      </div>
    `;
  }

  protected override onMount(): void {
    this.element.addEventListener(
      'click',
      (event) => {
        const target = event.target as Element;
        const direction = target.closest<HTMLButtonElement>('[data-direction]');

        if (direction) {
          this.selectDirection(direction.dataset.direction as TradeDirection);
          return;
        }

        const fraction = target.closest<HTMLButtonElement>('[data-fraction]');

        if (fraction) {
          this.trade(this.amountFor(Number(fraction.dataset.fraction)));
        }
      },
      { signal: this.lifetime.signal },
    );

    this.element.addEventListener(
      'keydown',
      (event) => {
        const input = event.target as HTMLInputElement;

        if (event.key === 'Enter' && input.dataset.amountInput !== undefined) {
          const amount = Math.min(Math.max(Number(input.value), 0), this.max());

          this.trade(amount);
        }
      },
      { signal: this.lifetime.signal },
    );

    this.element.addEventListener(
      'mouseover',
      (event) => this.previewHover(event.target, true),
      { signal: this.lifetime.signal },
    );

    this.element.addEventListener(
      'mouseout',
      (event) => this.previewHover(event.target, false),
      { signal: this.lifetime.signal },
    );
  }

  private previewHover(target: EventTarget | null, entering: boolean): void {
    if (!(target instanceof Element)) {
      return;
    }

    const fraction = target.closest<HTMLButtonElement>('[data-fraction]');

    if (fraction) {
      this.hover.textContent = entering
        ? String(this.amountFor(Number(fraction.dataset.fraction)))
        : '';
    }
  }

  private selectDirection(direction: TradeDirection): void {
    this.active = direction;
    this.amounts.classList.remove(styles.hidden!);

    for (const button of this.directionButtons) {
      button.classList.toggle(
        styles.selected!,
        button.dataset.direction === direction,
      );
    }

    this.applyAmountLimits();
  }

  private applyAmountLimits(): void {
    const max = this.max();

    for (const button of this.fractionButtons) {
      button.disabled = this.amountFor(Number(button.dataset.fraction)) <= 0;
    }

    this.input.max = String(max);
    this.input.disabled = max <= 0;
    this.input.value = '';

    const range = this.element.querySelector('[data-range]');

    if (range) {
      const verb = this.active === 'sell' ? 'Sell' : 'Buy';

      range.textContent =
        max > 0 ? `${verb} how much (1-${max})?` : `${verb} how much?`;
    }
  }

  private trade(amount: number): void {
    if (this.active && amount > 0) {
      this.chosenAmount = amount;
      this.publish(new ConfirmClickedEvent());
    }
  }

  private amountFor(fraction: number): number {
    return Math.floor(this.max() * fraction);
  }

  private max(): number {
    return this.active === 'sell' ? this.sellMax : this.buyMax;
  }

  private get amounts(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-amounts]')!;
  }

  private get input(): HTMLInputElement {
    return this.element.querySelector<HTMLInputElement>('[data-amount-input]')!;
  }

  private get hover(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-hover]')!;
  }

  private get directionButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-direction]');
  }

  private get fractionButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-fraction]');
  }
}

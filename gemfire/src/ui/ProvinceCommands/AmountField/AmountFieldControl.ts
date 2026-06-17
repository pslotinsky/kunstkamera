import { Control } from '@/lib/Control';

import { AmountChangedEvent } from './AmountChangedEvent';
import { type AmountFieldContext, AmountFieldView } from './AmountFieldView';
import { FRACTIONS } from './fractions';

export class AmountFieldControl extends Control<AmountFieldView> {
  private maximum = 0;
  private chosen = 0;

  public constructor(context: AmountFieldContext) {
    super(AmountFieldView, context);
  }

  public get value(): number {
    return this.chosen;
  }

  public onChange(handler: () => void): void {
    this.subscribe(AmountChangedEvent, handler);
  }

  public setMax(maximum: number): void {
    this.maximum = maximum;
    this.chosen = this.clamp(this.chosen);
    this.refresh();
  }

  public reset(): void {
    this.chosen = 0;
    this.refresh();
  }

  protected override onMount(): void {
    this.subscribe(AmountChangedEvent, (event) => {
      this.chosen = this.clamp(event.value);
      this.view.showValue(this.chosen);
    });
  }

  private refresh(): void {
    const amounts = FRACTIONS.map((fraction) =>
      Math.floor(this.maximum * fraction.value),
    );

    this.view.applyConstraints(this.maximum, amounts);
    this.view.showValue(this.chosen);
  }

  private clamp(amount: number): number {
    return Math.min(Math.max(Math.floor(amount || 0), 0), this.maximum);
  }
}

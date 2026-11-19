import { Control } from '@/lib/Control';

import { DropdownChangedEvent } from './DropdownChangedEvent';
import {
  type DropdownContext,
  type DropdownOption,
  DropdownView,
} from './DropdownView';

export class DropdownControl extends Control<DropdownView> {
  private options: readonly DropdownOption[] = [];
  private selected = '';

  public constructor(context: DropdownContext) {
    super(DropdownView, context);
  }

  public get value(): string {
    return this.selected;
  }

  public setOptions(options: readonly DropdownOption[]): void {
    this.options = options;
    this.view.showOptions(options, this.selected);
  }

  public setValue(value: string): void {
    this.selected = value;
    this.view.showOptions(this.options, value);
  }

  public reset(): void {
    this.setValue('');
  }

  public onChange(handler: () => void): void {
    this.subscribe(DropdownChangedEvent, handler);
  }

  protected override onMount(): void {
    this.subscribe(DropdownChangedEvent, (event) => {
      this.selected = event.value;
      this.view.showOptions(this.options, this.selected);
    });
  }
}

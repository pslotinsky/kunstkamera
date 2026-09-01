import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import { DropdownChangedEvent } from './DropdownChangedEvent';

import styles from './Dropdown.module.scss';

export interface DropdownOption {
  readonly value: string;
  readonly label: string;
  readonly icon?: string;
  readonly note?: string;
}

export interface DropdownContext {
  readonly name: string;
}

export class DropdownView extends View<DropdownContext> {
  protected readonly rootClass = styles.dropdown!;

  protected override get rootSelector(): string {
    return `[data-dropdown="${this.context.name}"]`;
  }

  public get template(): TemplateResult {
    return html`
      <div class=${styles.dropdown} data-dropdown=${this.context.name}>
        <button class=${styles.trigger} type="button" data-dropdown-trigger>
          <span class=${styles.triggerLabel} data-dropdown-label></span>
          <span class=${styles.caret}>▾</span>
        </button>
        <div class="${styles.menu} ${styles.hidden}" data-dropdown-menu></div>
      </div>
    `;
  }

  public showOptions(
    options: readonly DropdownOption[],
    selected: string,
  ): void {
    this.menu.innerHTML = options
      .map((option) => this.renderOption(option))
      .join('');

    for (const button of this.optionButtons) {
      button.classList.toggle(
        styles.selected!,
        button.dataset.value === selected,
      );
    }

    const chosen =
      options.find((option) => option.value === selected) ?? options[0];

    this.label.innerHTML = chosen ? this.renderContent(chosen) : '';
  }

  protected override onMount(): void {
    document.addEventListener('click', (event) => this.onClick(event), {
      signal: this.lifetime.signal,
    });
  }

  private onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const option = target.closest<HTMLElement>('[data-dropdown-option]');
    const trigger = target.closest<HTMLElement>('[data-dropdown-trigger]');

    if (option && this.element.contains(option)) {
      this.publish(new DropdownChangedEvent(option.dataset.value ?? ''));
      this.setOpen(false);
    } else if (trigger && this.element.contains(trigger)) {
      this.toggle();
    } else {
      this.setOpen(false);
    }
  }

  private toggle(): void {
    this.menu.classList.toggle(styles.hidden!);
  }

  private setOpen(open: boolean): void {
    this.menu.classList.toggle(styles.hidden!, !open);
  }

  private renderOption(option: DropdownOption): string {
    return `<button class=${styles.option} type="button" data-dropdown-option data-value="${option.value}">${this.renderContent(option)}</button>`;
  }

  private renderContent(option: DropdownOption): string {
    const icon = option.icon
      ? `<img class=${styles.icon} src="${option.icon}" alt="" />`
      : '';
    const note = option.note
      ? `<span class=${styles.note}>${option.note}</span>`
      : '';

    return `${icon}<span class=${styles.name}>${option.label}</span>${note}`;
  }

  private get menu(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-dropdown-menu]')!;
  }

  private get label(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-dropdown-label]')!;
  }

  private get optionButtons(): NodeListOf<HTMLElement> {
    return this.menu.querySelectorAll<HTMLElement>('[data-dropdown-option]');
  }
}

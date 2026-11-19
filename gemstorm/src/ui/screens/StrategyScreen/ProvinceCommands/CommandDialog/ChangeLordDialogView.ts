import { html, type TemplateResult } from 'lit-html';

import type { Province } from '@/core/domain/Province';
import { isDefined } from '@/lib/value/isDefined';

import { CommandDialogView } from './CommandDialogView';
import { type LordMode, LordModeEvent } from './LordModeEvent';
import { LordSelectedEvent } from './LordSelectedEvent';

import styles from './CommandDialog.module.scss';

export interface LordItem {
  readonly name: string;
  readonly selected: boolean;
}

export interface MovableLord extends LordItem {
  readonly from: string;
}

interface ChangeLordDialogContext {
  readonly name: string;
}

export class ChangeLordDialogView extends CommandDialogView<ChangeLordDialogContext> {
  public showTarget(province: Province | undefined): void {
    this.target.textContent = province ? `Change lord of ${province}` : '';
    this.question.classList.toggle(styles.hidden!, !province);
  }

  public clearOptions(): void {
    this.options.innerHTML = '';
  }

  public showMenu(ruler: LordItem | undefined): void {
    const you = ruler
      ? this.renderSelect(ruler.name, 'You', ruler.selected)
      : '';

    this.options.innerHTML = `
      ${you}
      ${this.renderMode('vassals', 'Vassal')}
      ${this.renderMode('lords', 'Lord')}
    `;
  }

  public showVassals(vassals: readonly LordItem[]): void {
    this.options.innerHTML = this.renderList(
      vassals.map((vassal) =>
        this.renderSelect(vassal.name, vassal.name, vassal.selected),
      ),
      'No vassals.',
    );
  }

  public showLords(lords: readonly MovableLord[]): void {
    this.options.innerHTML = this.renderList(
      lords.map((lord) =>
        this.renderSelect(
          lord.name,
          `${lord.name} — ${lord.from}`,
          lord.selected,
        ),
      ),
      'No lords to move.',
    );
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected override onMount(): void {
    this.element.addEventListener('click', (event) => this.onClick(event), {
      signal: this.lifetime.signal,
    });
  }

  protected renderBody(): TemplateResult {
    return html`
      <h2 class=${styles.title} data-target></h2>
      <p
        class="${styles.prompt} ${styles.section} ${styles.hidden}"
        data-question
      >
        Who shall rule?
      </p>
      <div class="${styles.lords} ${styles.section}" data-options></div>
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

  private renderList(items: readonly string[], empty: string): string {
    const back = this.renderMode('you', '‹ Back');
    const body = items.length
      ? items.join('')
      : `<p class=${styles.prompt}>${empty}</p>`;

    return `${back}${body}`;
  }

  private renderSelect(name: string, label: string, selected: boolean): string {
    const active = selected ? styles.selected : '';

    return `<button class="${styles.button} ${active}" type="button" data-select="${name}">${label}</button>`;
  }

  private renderMode(mode: LordMode, label: string): string {
    return `<button class="${styles.button}" type="button" data-mode="${mode}">${label}</button>`;
  }

  private onClick(event: MouseEvent): void {
    const button = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-select], [data-mode]',
    );

    if (isDefined(button?.dataset.select)) {
      this.publish(new LordSelectedEvent(button.dataset.select));
    } else if (isDefined(button?.dataset.mode)) {
      this.publish(new LordModeEvent(button.dataset.mode as LordMode));
    }
  }

  private get target(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-target]')!;
  }

  private get question(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-question]')!;
  }

  private get options(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-options]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}

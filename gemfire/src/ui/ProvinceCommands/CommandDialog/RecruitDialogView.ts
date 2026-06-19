import { html, type TemplateResult } from 'lit-html';

import type { AmountFieldView } from '../AmountField/AmountFieldView';
import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

interface RecruitDialogContext {
  readonly name: string;
}

export class RecruitDialogView extends CommandDialogView<
  RecruitDialogContext,
  { troops: AmountFieldView }
> {
  public setRange(max: number): void {
    this.prompt.textContent =
      max > 0 ? `How many troops (0-${max})?` : 'Not enough gold to recruit';
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): TemplateResult {
    return html`
      <p class=${styles.prompt} data-prompt></p>
      <div class=${styles.section}>${this.views.troops.template}</div>
      <div class="${styles.actions} ${styles.section}">
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

  private get prompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-prompt]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}

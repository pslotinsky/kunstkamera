import { html, type TemplateResult } from 'lit-html';

import type { Province } from '@/core/domain/Province';

import {
  type CommandDialogContext,
  CommandDialogView,
} from './CommandDialogView';

import styles from './CommandDialog.module.scss';

export interface InfiltrationDialogContext extends CommandDialogContext {
  readonly question: string;
  readonly aim: (target: Province) => string;
}

export class InfiltrationDialogView extends CommandDialogView<InfiltrationDialogContext> {
  public showTarget(target: Province | undefined): void {
    this.targetPrompt.textContent = target
      ? this.context.aim(target)
      : this.context.question;
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): TemplateResult {
    return html`
      <p class=${styles.prompt} data-target>${this.context.question}</p>
      <p class="${styles.prompt} ${styles.section}">
        Your agents take the rest of the month.
      </p>
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

  private get targetPrompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-target]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}

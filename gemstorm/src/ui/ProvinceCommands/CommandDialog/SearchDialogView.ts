import { html, type TemplateResult } from 'lit-html';

import type { Province } from '@/core/domain/Province';

import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

export class SearchDialogView extends CommandDialogView {
  public showTarget(target: Province | undefined): void {
    this.targetPrompt.textContent = target ? `Spy on ${target}` : '';
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): TemplateResult {
    return html`
      <h2 class=${styles.title} data-target></h2>
      <p class="${styles.prompt} ${styles.section}">
        A spy takes 5 gold and the rest of the month.
      </p>
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

  private get targetPrompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-target]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}

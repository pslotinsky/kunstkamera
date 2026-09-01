import { html, type TemplateResult } from 'lit-html';

import type { Province } from '@/core/domain/Province';

import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

export class SearchDialogView extends CommandDialogView {
  public showTarget(target: Province | undefined): void {
    this.targetPrompt.textContent = target
      ? `Send a spy into ${target}`
      : 'Spy on whose land?';
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): TemplateResult {
    return html`
      <p class=${styles.prompt} data-target>Spy on whose land?</p>
      <p class="${styles.prompt} ${styles.section}">
        A spy takes 5 gold and the rest of the month.
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

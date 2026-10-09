import { html, type TemplateResult } from 'lit-html';

import type { EntrustMode } from '@/core/commands/province/EntrustCommand';
import type { Province } from '@/core/domain/Province';

import { CommandDialogView } from './CommandDialogView';
import { EntrustModeSelectedEvent } from './EntrustModeSelectedEvent';

import styles from './CommandDialog.module.scss';

const MODES: readonly { readonly mode: EntrustMode; readonly label: string }[] =
  [
    { mode: 'entrust', label: 'Entrust' },
    { mode: 'cancel', label: 'Cancel' },
  ];

interface EntrustDialogContext {
  readonly name: string;
}

export class EntrustDialogView extends CommandDialogView<EntrustDialogContext> {
  public showTarget(province: Province | undefined): void {
    const lord = province?.governor?.name;

    this.target.textContent = province
      ? `Entrust ${province} to Lord ${lord}`
      : '';
    this.modes.classList.toggle(styles.hidden!, !province);
    this.footer.classList.toggle(styles.hidden!, !province);
  }

  public showMode(mode: EntrustMode, entrusted: boolean): void {
    for (const button of this.modeButtons) {
      const shown = button.dataset.mode as EntrustMode;

      button.classList.toggle(styles.selected!, shown === mode);
      button.disabled = (shown === 'entrust') === entrusted;
    }
  }

  protected renderBody(): TemplateResult {
    return html`
      <h2 class=${styles.title} data-target></h2>
      <div class="${styles.actions} ${styles.hidden}" data-modes>
        ${MODES.map(
          ({ mode, label }) => html`<button
            class=${styles.button}
            type="button"
            data-mode=${mode}
            @click=${() => this.publish(new EntrustModeSelectedEvent(mode))}
          >
            ${label}
          </button>`,
        )}
      </div>
      <div
        class="${styles.actions} ${styles.footer} ${styles.hidden}"
        data-footer
      >
        <button
          class=${styles.button}
          type="button"
          data-action="confirm"
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

  private get target(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-target]')!;
  }

  private get modes(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-modes]')!;
  }

  private get footer(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-footer]')!;
  }

  private get modeButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-mode]');
  }
}

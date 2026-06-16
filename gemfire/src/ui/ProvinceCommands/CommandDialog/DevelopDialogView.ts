import { html, type TemplateResult } from 'lit-html';

import {
  DevelopCommand,
  type DevelopTarget,
} from '@/core/commands/province/DevelopCommand';

import { CommandDialogView } from './CommandDialogView';
import { DevelopTargetSelectedEvent } from './DevelopTargetSelectedEvent';

import styles from './CommandDialog.module.scss';

const TARGETS: {
  readonly target: DevelopTarget;
  readonly label: string;
}[] = [
  { target: 'cultivation', label: 'Cultivation' },
  { target: 'protection', label: 'Protection' },
];

interface DevelopDialogContext {
  readonly name: string;
}

export class DevelopDialogView extends CommandDialogView<DevelopDialogContext> {
  public showTarget(target: DevelopTarget | undefined): void {
    for (const button of this.targetButtons) {
      button.classList.toggle(
        styles.selected!,
        button.dataset.develop === target,
      );
    }

    this.confirmPrompt.classList.toggle(styles.hidden!, target === undefined);
    this.footer.classList.toggle(styles.hidden!, target === undefined);

    if (target) {
      this.confirmPrompt.textContent = `Invest ${DevelopCommand.COST} gold for ${target}?`;
    }
  }

  protected renderBody(): TemplateResult {
    return html`
      <p class=${styles.prompt}>Which one?</p>
      <div class=${styles.actions}>
        ${TARGETS.map(
          ({ target, label }) => html`<button
            class=${styles.button}
            type="button"
            data-develop=${target}
            @click=${() => this.publish(new DevelopTargetSelectedEvent(target))}
          >
            ${label}
          </button>`,
        )}
      </div>
      <p
        class="${styles.prompt} ${styles.section} ${styles.hidden}"
        data-confirm-prompt
      ></p>
      <div
        class="${styles.actions} ${styles.section} ${styles.hidden}"
        data-footer
      >
        <button
          class=${styles.button}
          type="button"
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

  private get targetButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-develop]');
  }

  private get confirmPrompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-confirm-prompt]')!;
  }

  private get footer(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-footer]')!;
  }
}

import { html, type TemplateResult } from 'lit-html';

import type { Province } from '@/core/domain/Province';

import type { AmountFieldView } from '../AmountField/AmountFieldView';
import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

type Resource = 'troops' | 'food';

const RESOURCES: readonly Resource[] = ['troops', 'food'];

const QUANTIFIERS: Record<Resource, string> = {
  troops: 'many',
  food: 'much',
};

interface MoveTroopsDialogContext {
  readonly name: string;
}

export class MoveTroopsDialogView extends CommandDialogView<
  MoveTroopsDialogContext,
  { troops: AmountFieldView; food: AmountFieldView }
> {
  public showTarget(target: Province | undefined): void {
    if (target) {
      const claim = target.isNeutral() ? ' (claim)' : '';

      this.targetPrompt.textContent = `To ${target.number} ${target.name}${claim}`;
    } else {
      this.targetPrompt.textContent = 'Move troops where?';
    }
  }

  public showAmounts(visible: boolean): void {
    this.amounts.classList.toggle(styles.hidden!, !visible);
    this.footer.classList.toggle(styles.hidden!, !visible);
  }

  public setRange(resource: Resource, max: number): void {
    this.range(resource).textContent =
      `How ${QUANTIFIERS[resource]} ${resource} (0-${max})?`;
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): TemplateResult {
    return html`
      <p class="${styles.prompt} ${styles.section}" data-target>
        Move troops where?
      </p>
      <div class="${styles.section} ${styles.hidden}" data-amounts>
        ${RESOURCES.map((resource) => this.renderAmount(resource))}
      </div>
      <div
        class="${styles.actions} ${styles.section} ${styles.hidden}"
        data-footer
      >
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

  private renderAmount(resource: Resource): TemplateResult {
    return html`
      <div class=${styles.section}>
        <p class=${styles.prompt} data-range=${resource}></p>
        ${this.views[resource].template}
      </div>
    `;
  }

  private range(resource: Resource): HTMLElement {
    return this.element.querySelector<HTMLElement>(
      `[data-range="${resource}"]`,
    )!;
  }

  private get amounts(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-amounts]')!;
  }

  private get footer(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-footer]')!;
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

import { html, type TemplateResult } from 'lit-html';

import type { Province } from '@/core/domain/Province';
import type { DropdownView } from '@/ui/common/Dropdown/DropdownView';

import type { AmountFieldView } from '../AmountField/AmountFieldView';
import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

interface AttackDialogContext {
  readonly name: string;
}

type AttackViews = {
  readonly troops: AmountFieldView;
  readonly days: DropdownView;
  readonly unit: DropdownView;
};

export class AttackDialogView extends CommandDialogView<
  AttackDialogContext,
  AttackViews
> {
  public showTarget(target: Province | undefined): void {
    this.targetPrompt.textContent = target ? `Attack ${target}` : '';
  }

  public showForm(visible: boolean): void {
    this.form.classList.toggle(styles.hidden!, !visible);
  }

  public setTroopsRange(max: number): void {
    this.troopsPrompt.textContent = `How many troops (1-${max})?`;
  }

  public showCommander(name: string, remote: boolean): void {
    this.commander.textContent = remote
      ? `Orders from ${name}`
      : `Led by ${name}`;
  }

  public showFigures(gold: number, food: number): void {
    this.figures.textContent = `Deployment ${gold} Gold · ${food} Food`;
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected renderBody(): TemplateResult {
    return html`
      <h2 class=${styles.title} data-target></h2>
      <div class=${styles.hidden} data-form>
        <p class="${styles.prompt} ${styles.section}" data-commander></p>
        <div class=${styles.section}>
          <p class=${styles.prompt} data-troops-prompt></p>
          ${this.views.troops.template}
        </div>
        <div class=${styles.section}>
          <p class=${styles.prompt}>Days of supplies</p>
          ${this.views.days.template}
        </div>
        <div class=${styles.section}>
          <p class=${styles.prompt}>Bring a 5th unit?</p>
          ${this.views.unit.template}
        </div>
        <p class="${styles.prompt} ${styles.section}" data-figures></p>
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
      </div>
    `;
  }

  private get targetPrompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-target]')!;
  }

  private get form(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-form]')!;
  }

  private get troopsPrompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-troops-prompt]')!;
  }

  private get commander(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-commander]')!;
  }

  private get figures(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-figures]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}

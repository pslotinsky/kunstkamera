import { html, type TemplateResult } from 'lit-html';

import type { Family } from '@/core/domain/Family';

import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

export class AllyDialogView extends CommandDialogView {
  public askForFamily(): void {
    this.showLines('Ally with which family?', '');
    this.confirmButton.disabled = true;
  }

  public showProposal(
    family: Family,
    provinces: number,
    proposer: Family,
  ): void {
    this.showLines(
      `Ally with ${family.name}`,
      `${family.ruler.name} — Fame ${family.fame}, ${provinces} provinces. Peace between ${proposer.name} and ${family.name}: neither house may attack the other.`,
    );
    this.confirmButton.disabled = false;
  }

  public showPact(family: Family, ally: Family): void {
    this.showLines(
      `Peace holds between ${family.name} and ${ally.name}.`,
      'Break the alliance?',
    );
    this.confirmButton.disabled = false;
  }

  protected renderBody(): TemplateResult {
    return html`
      <h2 class=${styles.title} data-headline></h2>
      <p class="${styles.prompt} ${styles.section}" data-detail></p>
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

  private showLines(headline: string, detail: string): void {
    this.headline.textContent = headline;
    this.detail.textContent = detail;
    this.detail.classList.toggle(styles.hidden!, detail === '');
  }

  private get headline(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-headline]')!;
  }

  private get detail(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-detail]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}

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

  protected renderBody(): string {
    const targets = TARGETS.map(
      ({ target, label }) =>
        `<button class="${styles.button}" type="button" data-develop="${target}">${label}</button>`,
    ).join('');

    return `
      <p class="${styles.prompt}">Which one?</p>
      <div class="${styles.actions}">${targets}</div>
      <p class="${styles.prompt} ${styles.section} ${styles.hidden}" data-confirm-prompt></p>
      <div class="${styles.actions} ${styles.section} ${styles.hidden}" data-footer>
        <button class="${styles.button}" type="button" data-action="confirm">Yea</button>
        <button class="${styles.button}" type="button" data-action="cancel">Nay</button>
      </div>
    `;
  }

  protected override onMount(): void {
    super.onMount();

    this.element.addEventListener(
      'click',
      (event) => {
        const button = (event.target as Element).closest<HTMLButtonElement>(
          '[data-develop]',
        );

        if (button?.dataset.develop) {
          this.publish(new DevelopTargetSelectedEvent(button.dataset.develop));
        }
      },
      { signal: this.lifetime.signal },
    );
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

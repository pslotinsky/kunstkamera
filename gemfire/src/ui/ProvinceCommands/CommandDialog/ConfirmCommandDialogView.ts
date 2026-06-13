import { CancelClickedEvent } from './CancelClickedEvent';
import { CommandDialogView } from './CommandDialogView';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';

import styles from './CommandDialog.module.scss';

interface ConfirmCommandDialogContext {
  readonly name: string;
  readonly prompt: string;
}

export class ConfirmCommandDialogView extends CommandDialogView<ConfirmCommandDialogContext> {
  protected readonly rootClass = styles.root!;

  protected override get rootSelector(): string {
    return `[data-dialog="${this.context.name}"]`;
  }

  public render(): string {
    return `
      <div class="${styles.root} ${styles.hidden}" data-dialog="${this.context.name}">
        <p class="${styles.prompt}">${this.context.prompt}</p>
        <div class="${styles.actions}">
          <button class="${styles.button}" type="button" data-action="confirm">Yea</button>
          <button class="${styles.button}" type="button" data-action="cancel">Nay</button>
        </div>
      </div>
    `;
  }

  protected override onMount(): void {
    this.element.addEventListener(
      'click',
      (event) => {
        const button = (event.target as Element).closest<HTMLButtonElement>(
          'button',
        );

        if (button?.dataset.action === 'confirm') {
          this.publish(new ConfirmClickedEvent());
        } else if (button?.dataset.action === 'cancel') {
          this.publish(new CancelClickedEvent());
        }
      },
      { signal: this.lifetime.signal },
    );
  }
}

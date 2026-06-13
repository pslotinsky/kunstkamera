import { CommandDialogView } from './CommandDialogView';

import styles from './CommandDialog.module.scss';

interface ConfirmCommandDialogContext {
  readonly name: string;
  readonly prompt: string;
}

export class ConfirmCommandDialogView extends CommandDialogView<ConfirmCommandDialogContext> {
  protected renderBody(): string {
    return `
      <p class="${styles.prompt}">${this.context.prompt}</p>
      <div class="${styles.actions}">
        <button class="${styles.button}" type="button" data-action="confirm">Yea</button>
        <button class="${styles.button}" type="button" data-action="cancel">Nay</button>
      </div>
    `;
  }
}

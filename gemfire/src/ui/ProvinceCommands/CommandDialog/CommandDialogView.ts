import { html, type TemplateResult } from 'lit-html';

import { View, type ViewRecord } from '@/lib/View';

import { CancelClickedEvent } from './CancelClickedEvent';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';

import styles from './CommandDialog.module.scss';

export interface CommandDialogContext {
  readonly name: string;
}

export type AnyCommandDialogView = CommandDialogView<
  CommandDialogContext,
  ViewRecord
>;

export abstract class CommandDialogView<
  Context extends CommandDialogContext = CommandDialogContext,
  Views extends ViewRecord = Record<string, never>,
> extends View<Context, Views> {
  protected readonly rootClass = styles.root!;

  protected override get rootSelector(): string {
    return `[data-dialog="${this.context.name}"]`;
  }

  public show(): void {
    this.element.classList.remove(styles.hidden!);
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  public get template(): TemplateResult {
    return html`
      <div
        class="${styles.root} ${styles.hidden}"
        data-dialog=${this.context.name}
      >
        ${this.renderBody()}
      </div>
    `;
  }

  protected abstract renderBody(): TemplateResult;

  protected confirm(): void {
    this.publish(new ConfirmClickedEvent());
  }

  protected cancel(): void {
    this.publish(new CancelClickedEvent());
  }
}

import { View, type ViewRecord } from '@/lib/View';

import styles from './CommandDialog.module.scss';

export type AnyCommandDialogView = CommandDialogView<unknown, ViewRecord>;

export abstract class CommandDialogView<
  Context = Record<string, never>,
  Views extends ViewRecord = Record<string, never>,
> extends View<Context, Views> {
  public show(): void {
    this.element.classList.remove(styles.hidden!);
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }
}

import { Control } from '@/lib/Control';

import type { AnyCommandDialogView } from './CommandDialogView';

export abstract class CommandDialogControl<
  TView extends AnyCommandDialogView,
> extends Control<TView> {
  public open(): void {
    this.view.show();
  }

  public close(): void {
    this.view.hide();
  }
}

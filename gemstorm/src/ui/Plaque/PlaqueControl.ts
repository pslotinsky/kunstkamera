import { Control } from '@/lib/Control';

import { type PlaqueContext, PlaqueView } from './PlaqueView';

export class PlaqueControl extends Control<PlaqueView> {
  public constructor(context: PlaqueContext) {
    super(PlaqueView, context);
  }

  public showTitle(title: string): void {
    this.view.showTitle(title);
  }

  public showCaption(caption: string): void {
    this.view.showCaption(caption);
  }
}

import type { Family } from '@/core/domain/Family';
import { Control } from '@/lib/Control';

import { RulerPreviewView } from './RulerPreviewView';

export class RulerPreviewControl extends Control<RulerPreviewView> {
  public constructor() {
    super(RulerPreviewView, {});
  }

  public showRuler(family: Family, rulerAge: number): void {
    this.view.showRuler(family, rulerAge);
  }
}

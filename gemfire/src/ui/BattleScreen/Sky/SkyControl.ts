import type { Phase } from '@/core/domain/BattleClock';
import { Control } from '@/lib/Control';

import { SkyView } from './SkyView';

export class SkyControl extends Control<SkyView> {
  public constructor() {
    super(SkyView, {});
  }

  public showPhase(phase: Phase): void {
    this.view.showPhase(phase);
  }
}

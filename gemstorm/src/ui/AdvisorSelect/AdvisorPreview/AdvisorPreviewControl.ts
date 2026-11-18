import type { Advisor } from '@/core/domain/Advisor';
import { Control } from '@/lib/Control';

import { AdvisorPreviewView } from './AdvisorPreviewView';

export class AdvisorPreviewControl extends Control<AdvisorPreviewView> {
  public constructor() {
    super(AdvisorPreviewView, {});
  }

  public showAdvisor(advisor: Advisor): void {
    this.view.showAdvisor(advisor);
  }
}

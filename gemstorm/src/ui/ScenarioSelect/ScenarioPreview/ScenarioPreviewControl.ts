import type { Scenario } from '@/config/scenarios';
import { Control } from '@/lib/Control';

import { ScenarioPreviewView } from './ScenarioPreviewView';

export class ScenarioPreviewControl extends Control<ScenarioPreviewView> {
  public constructor() {
    super(ScenarioPreviewView, {});
  }

  public showScenario(scenario: Scenario): void {
    this.view.showScenario(scenario);
  }
}

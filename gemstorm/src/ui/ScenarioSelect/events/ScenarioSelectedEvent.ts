import type { Scenario } from '@/config/scenarios';

export class ScenarioSelectedEvent {
  public constructor(public readonly scenario: Scenario) {}
}

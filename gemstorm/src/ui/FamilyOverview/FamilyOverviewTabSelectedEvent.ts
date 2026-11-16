import type { FamilyOverviewMode } from './FamilyOverviewView';

export class FamilyOverviewTabSelectedEvent {
  public constructor(public readonly mode: FamilyOverviewMode) {}
}

import type { CampaignOutcome } from '@/core/domain/CampaignOutcome';

export class CampaignEndedEvent {
  public constructor(public readonly outcome: CampaignOutcome) {}
}

import type { CalendarDate } from './CalendarDate';

export type DefeatReason = 'last-province-lost' | 'absorption' | 'no-heir';
export type CampaignReason = 'unification' | DefeatReason;

export interface CampaignOutcomeParams {
  readonly reason: CampaignReason;
  readonly date: CalendarDate;
  readonly house: string;
  readonly ruler: string;
  readonly rival?: string | undefined;
}

export class CampaignOutcome {
  public readonly reason: CampaignReason;
  public readonly date: CalendarDate;
  public readonly house: string;
  public readonly ruler: string;
  public readonly rival: string | undefined;

  public constructor(params: CampaignOutcomeParams) {
    this.reason = params.reason;
    this.date = params.date;
    this.house = params.house;
    this.ruler = params.ruler;
    this.rival = params.rival;
  }

  public get isVictory(): boolean {
    return this.reason === 'unification';
  }
}

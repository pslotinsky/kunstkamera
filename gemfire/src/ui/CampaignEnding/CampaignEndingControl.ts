import type { CampaignOutcome } from '@/core/domain/CampaignOutcome';
import { CampaignEndedEvent } from '@/core/events/CampaignEndedEvent';
import { TurnHeldEvent } from '@/core/events/TurnHeldEvent';
import { TurnReleasedEvent } from '@/core/events/TurnReleasedEvent';
import { WarReportedEvent } from '@/core/events/WarReportedEvent';
import { Control } from '@/lib/Control';
import { BattleReportClosedEvent } from '@/ui/BattleReport/BattleReportClosedEvent';

import {
  type CampaignEndingContext,
  CampaignEndingView,
} from './CampaignEndingView';
import { EndingInspectedEvent } from './EndingInspectedEvent';
import { EndingOpenedEvent } from './EndingOpenedEvent';

export class CampaignEndingControl extends Control<CampaignEndingView> {
  private readonly holders = new Set<object>();
  private outcome: CampaignOutcome | undefined;
  private reportingWar = false;
  private presented = false;

  public constructor(context: CampaignEndingContext) {
    super(CampaignEndingView, context);
  }

  protected override onMount(): void {
    const { events, world } = this.context;

    events.subscribe(
      TurnHeldEvent,
      (event) => this.holders.add(event.holder),
      this.signal,
    );
    events.subscribe(
      TurnReleasedEvent,
      (event) => {
        this.holders.delete(event.holder);
        this.scheduleEnding();
      },
      this.signal,
    );
    events.subscribe(
      WarReportedEvent,
      () => {
        this.reportingWar = true;
      },
      this.signal,
    );
    events.subscribe(
      BattleReportClosedEvent,
      () => {
        this.reportingWar = false;
        this.scheduleEnding();
      },
      this.signal,
    );
    events.subscribe(
      CampaignEndedEvent,
      (event) => {
        this.outcome ??= event.outcome;
        this.scheduleEnding();
      },
      this.signal,
    );
    this.subscribe(EndingInspectedEvent, () => this.view.inspect());
    this.subscribe(EndingOpenedEvent, () => {
      if (this.outcome) {
        this.view.show(this.outcome);
      }
    });

    this.outcome = world.campaign.outcome;
    this.scheduleEnding();
  }

  private scheduleEnding(): void {
    queueMicrotask(() => {
      if (
        !this.signal.aborted &&
        this.outcome &&
        !this.presented &&
        !this.reportingWar &&
        this.holders.size === 0
      ) {
        this.presented = true;
        this.view.show(this.outcome);
      }
    });
  }
}

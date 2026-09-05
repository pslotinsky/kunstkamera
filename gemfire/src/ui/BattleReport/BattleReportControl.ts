import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { Control } from '@/lib/Control';

import { BattleReportClosedEvent } from './BattleReportClosedEvent';
import { BattleReportDismissedEvent } from './BattleReportDismissedEvent';
import { type BattleReportContext, BattleReportView } from './BattleReportView';

export class BattleReportControl extends Control<BattleReportView> {
  public constructor(context: BattleReportContext) {
    super(BattleReportView, context);
  }

  protected override onMount(): void {
    this.context.events.subscribe(
      BattleReportedEvent,
      (event) => this.view.showReport(event.report),
      this.signal,
    );
    this.subscribe(BattleReportDismissedEvent, () => this.close());
  }

  private close(): void {
    this.view.hide();
    this.context.events.publish(new BattleReportClosedEvent());
  }
}

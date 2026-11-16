import type { InvasionReport } from '@/core/domain/InvasionReport';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { Control } from '@/lib/Control';
import { TurnHold } from '@/ui/TurnHold';

import { BattleReportClosedEvent } from './BattleReportClosedEvent';
import { BattleReportDismissedEvent } from './BattleReportDismissedEvent';
import { type BattleReportContext, BattleReportView } from './BattleReportView';

export class BattleReportControl extends Control<BattleReportView> {
  private readonly turnHold: TurnHold;

  private isWar = false;

  public constructor(context: BattleReportContext) {
    super(BattleReportView, context);
    this.turnHold = new TurnHold(context.events);
  }

  public showWar(report: InvasionReport): void {
    this.isWar = true;
    this.show(report);
  }

  protected override onMount(): void {
    this.context.events.subscribe(
      BattleReportedEvent,
      (event) => this.show(event.report),
      this.signal,
    );
    this.subscribe(BattleReportDismissedEvent, () => this.close());
  }

  private show(report: InvasionReport): void {
    this.turnHold.hold();
    this.soundOutcome(report);
    this.view.showReport(report);
  }

  private soundOutcome(report: InvasionReport): void {
    const { player } = this.context.world;

    if (report.hasSide(player)) {
      const isAttacker = report.source.family?.isEqual(player) ?? false;
      const isWon = isAttacker === report.isTaken;

      if (isWon) {
        this.context.sounds.playFanfare();
      } else {
        this.context.sounds.playDirge();
      }
    }
  }

  private close(): void {
    const { world, events } = this.context;

    this.view.hide();
    events.publish(new BattleReportClosedEvent());

    if (this.isWar) {
      this.isWar = false;
      events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
    }

    this.turnHold.release();
  }
}

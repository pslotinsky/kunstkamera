import type { Captive } from '@/core/domain/Captive';
import { Captivity } from '@/core/domain/Captivity';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { SuccessionReportedEvent } from '@/core/events/SuccessionReportedEvent';
import { Control } from '@/lib/Control';
import { BattleReportClosedEvent } from '@/ui/BattleReport/BattleReportClosedEvent';

import {
  type CaptiveDialogContext,
  CaptiveDialogView,
} from './CaptiveDialogView';
import { CaptiveDismissedEvent } from './CaptiveDismissedEvent';
import {
  type Disposal,
  DisposalChosenEvent,
  type DisposalOutcome,
} from './DisposalChosenEvent';

export class CaptiveDialogControl extends Control<CaptiveDialogView> {
  private readonly captivity: Captivity;

  public constructor(context: CaptiveDialogContext) {
    super(CaptiveDialogView, context);
    this.captivity = new Captivity(context.world);
  }

  protected override onMount(): void {
    this.context.events.subscribe(
      BattleReportClosedEvent,
      () => this.open(),
      this.signal,
    );
    this.subscribe(DisposalChosenEvent, (event) =>
      this.dispose(event.disposal),
    );
    this.subscribe(CaptiveDismissedEvent, () => this.view.hide());
  }

  private open(): void {
    const captive = this.findCaptive();

    if (captive) {
      this.view.showDisposals(captive);
    }
  }

  private dispose(disposal: Disposal): void {
    const captive = this.findCaptive();

    if (!captive) {
      return;
    }

    const outcome = this.carryOut(disposal, captive);

    this.context.world.free(captive);
    this.view.showOutcome(captive, outcome);
  }

  private carryOut(disposal: Disposal, captive: Captive): DisposalOutcome {
    if (disposal === 'recruit') {
      return this.captivity.recruit(captive) ? 'joined' : 'refused';
    }

    if (disposal === 'release') {
      this.captivity.release(captive);

      return 'released';
    }

    this.banish(captive);

    return 'banished';
  }

  private banish(captive: Captive): void {
    const outcome = this.captivity.banish(captive);

    if (outcome) {
      this.context.events.publish(
        new SuccessionReportedEvent(outcome, 'banishment'),
      );

      for (const province of outcome.provinces) {
        this.context.events.publish(new ProvinceUpdatedEvent(province));
      }
    }
  }

  private findCaptive(): Captive | undefined {
    return this.context.world.findCaptiveOf(this.context.world.player);
  }
}

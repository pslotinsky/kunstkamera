import { CommandExecutor } from '@/core/CommandExecutor';
import { JudgeCaptiveCommand } from '@/core/commands/JudgeCaptiveCommand';
import type { Captive } from '@/core/domain/Captive';
import type { Disposal } from '@/core/domain/Captivity';
import { Control } from '@/lib/Control';
import { BattleReportClosedEvent } from '@/ui/BattleReport/BattleReportClosedEvent';
import { TurnHold } from '@/ui/TurnHold';

import {
  type CaptiveDialogContext,
  CaptiveDialogView,
} from './CaptiveDialogView';
import { CaptiveDismissedEvent } from './CaptiveDismissedEvent';
import { DisposalChosenEvent } from './DisposalChosenEvent';

export class CaptiveDialogControl extends Control<CaptiveDialogView> {
  private readonly executor: CommandExecutor;
  private readonly judge: JudgeCaptiveCommand;
  private readonly turnHold: TurnHold;

  public constructor(context: CaptiveDialogContext) {
    super(CaptiveDialogView, context);
    this.executor = new CommandExecutor(context);
    this.judge = new JudgeCaptiveCommand(context);
    this.turnHold = new TurnHold(context.events);
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
    this.subscribe(CaptiveDismissedEvent, () => this.close());
  }

  private open(): void {
    const captive = this.findCaptive();

    if (captive) {
      this.turnHold.hold();
      this.view.showDisposals(captive);
    }
  }

  private close(): void {
    this.view.hide();
    this.turnHold.release();
  }

  private dispose(disposal: Disposal): void {
    const captive = this.findCaptive();

    if (captive) {
      this.judge.judge(captive, disposal);
      this.executor.execute(this.judge);
      this.view.showOutcome(captive, this.judge.outcome!);
    }
  }

  private findCaptive(): Captive | undefined {
    const { world } = this.context;

    return world.campaign.isEnded
      ? undefined
      : world.findCaptiveOf(world.player);
  }
}

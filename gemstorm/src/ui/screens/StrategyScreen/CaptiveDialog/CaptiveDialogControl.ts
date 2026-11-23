import { CommandExecutor } from '@/core/CommandExecutor';
import { JudgeCaptiveCommand } from '@/core/commands/JudgeCaptiveCommand';
import { RansomCommand } from '@/core/commands/RansomCommand';
import type { Captive } from '@/core/domain/Captive';
import type { Disposal } from '@/core/domain/Captivity';
import type { RansomCurrency } from '@/core/domain/Ransom';
import { TurnReleasedEvent } from '@/core/events/TurnReleasedEvent';
import { Control } from '@/lib/Control';
import { isDefined } from '@/lib/value/isDefined';
import { BattleReportClosedEvent } from '@/ui/screens/StrategyScreen/BattleReport/BattleReportClosedEvent';
import { TurnHold } from '@/ui/screens/StrategyScreen/TurnHold';

import { CaptiveDialogToggledEvent } from './CaptiveDialogToggledEvent';
import {
  type CaptiveDialogContext,
  CaptiveDialogView,
} from './CaptiveDialogView';
import { CaptiveDismissedEvent } from './CaptiveDismissedEvent';
import { DisposalChosenEvent } from './DisposalChosenEvent';
import { RansomAnsweredEvent } from './RansomAnsweredEvent';
import { RansomCurrencyChosenEvent } from './RansomCurrencyChosenEvent';

export class CaptiveDialogControl extends Control<CaptiveDialogView> {
  private readonly executor: CommandExecutor;
  private readonly judge: JudgeCaptiveCommand;
  private readonly ransom: RansomCommand;
  private readonly turnHold: TurnHold;
  private captive: Captive | undefined;
  private waitingForDecision = false;

  public constructor(context: CaptiveDialogContext) {
    super(CaptiveDialogView, context);
    this.executor = new CommandExecutor(context);
    this.judge = new JudgeCaptiveCommand(context);
    this.ransom = new RansomCommand(context);
    this.turnHold = new TurnHold(context.events);
  }

  protected override onMount(): void {
    this.context.events.subscribe(
      BattleReportClosedEvent,
      () => this.open(),
      this.signal,
    );
    this.context.events.subscribe(
      TurnReleasedEvent,
      () => this.resume(),
      this.signal,
    );
    this.subscribe(DisposalChosenEvent, (event) =>
      this.dispose(event.disposal),
    );
    this.subscribe(CaptiveDismissedEvent, () => this.close());
    this.subscribe(RansomCurrencyChosenEvent, ({ currency }) =>
      this.demand(currency),
    );
    this.subscribe(RansomAnsweredEvent, ({ accepted }) =>
      this.answer(accepted),
    );
  }

  private open(): void {
    const { world } = this.context;
    const { player } = world;

    if (world.campaign.canProgress && !isDefined(this.captive)) {
      const captive =
        world.findRansomFor(player) ?? world.findCaptiveOf(player);

      if (isDefined(captive)) {
        this.captive = captive;
        this.turnHold.hold();
        this.context.events.publish(new CaptiveDialogToggledEvent(true));
        this.showChoices(captive);
      }
    }
  }

  private close(): void {
    this.captive = undefined;
    this.waitingForDecision = this.context.world.campaign.isAwaitingDecision;
    this.view.hide();
    this.context.events.publish(new CaptiveDialogToggledEvent(false));
    this.turnHold.release();
    this.open();
  }

  private resume(): void {
    if (this.waitingForDecision && this.context.world.campaign.canProgress) {
      this.waitingForDecision = false;
      this.open();
    }
  }

  private dispose(disposal: Disposal): void {
    const { captive } = this;

    if (
      isDefined(captive) &&
      captive.captor.isEqual(this.context.world.player)
    ) {
      this.judge.judge(captive, disposal);
      this.executor.execute(this.judge);

      const { outcome } = this.judge;

      if (isDefined(outcome)) {
        this.view.showOutcome(captive, outcome);
      } else {
        this.showChoices(captive);
      }
    }
  }

  private showChoices(captive: Captive): void {
    const { ransom, demand } = captive;

    if (isDefined(ransom) && isDefined(demand)) {
      const amount = ransom[demand];
      const canPay = this.ransom.canPay(captive);

      this.view.showRansomAnswer(captive, demand, amount, canPay);
    } else if (isDefined(ransom)) {
      this.view.showRansomDemand(captive, ransom);
    } else {
      this.view.showDisposals(captive, this.judge.canRecruit(captive));
    }
  }

  private demand(currency: RansomCurrency): void {
    const { captive } = this;

    if (
      isDefined(captive) &&
      captive.captor.isEqual(this.context.world.player)
    ) {
      this.ransom.demand(captive, currency);
      this.executor.execute(this.ransom);

      if (this.ransom.outcome === 'paid') {
        this.view.showOutcome(captive, 'ransomed');
      } else if (this.ransom.outcome === 'declined') {
        this.view.showDisposals(
          captive,
          this.judge.canRecruit(captive),
          `${captive.house.name} refused the ransom`,
        );
      }
    }
  }

  private answer(accepted: boolean): void {
    const { captive } = this;

    if (
      isDefined(captive) &&
      captive.house.isEqual(this.context.world.player)
    ) {
      this.ransom.answer(captive, accepted);
      this.executor.execute(this.ransom);

      if (this.ransom.outcome === 'paid') {
        this.view.showOutcome(captive, 'ransomed');
      } else if (this.ransom.outcome === 'declined') {
        this.close();
      } else {
        this.showChoices(captive);
      }
    }
  }
}

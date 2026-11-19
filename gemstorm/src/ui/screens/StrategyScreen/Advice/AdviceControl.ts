import { AdviceRule } from '@/core/domain/AdviceRule';
import { Control } from '@/lib/Control';
import { isDefined } from '@/lib/value/isDefined';

import { type AdviceContext, AdviceView } from './AdviceView';
import { AdviceDismissedEvent } from './events/AdviceDismissedEvent';

export class AdviceControl extends Control<AdviceView> {
  private readonly rule: AdviceRule;

  public constructor(context: AdviceContext) {
    super(AdviceView, context);
    this.rule = new AdviceRule(context.world);
  }

  public get isAvailable(): boolean {
    const { world } = this.context;
    const province = world.turnQueue.current;

    return (
      isDefined(world.campaign.advisor) &&
      isDefined(province) &&
      this.rule.canAdvise(province)
    );
  }

  public consult(): void {
    const { world } = this.context;
    const advisor = world.campaign.advisor;
    const province = world.turnQueue.current;

    if (advisor && province) {
      this.view.show(advisor, this.rule.advise(province));
    }
  }

  public onDismiss(handler: () => void): void {
    this.subscribe(AdviceDismissedEvent, handler);
  }

  public close(): void {
    this.view.hide();
  }

  protected override onMount(): void {
    this.subscribe(AdviceDismissedEvent, () => this.close());
  }
}

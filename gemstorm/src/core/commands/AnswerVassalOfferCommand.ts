import type { VassalOffer } from '@/core/domain/WanderingGenerals';
import { isDefined } from '@/lib/value/isDefined';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

interface OfferAnswer {
  readonly offer: VassalOffer;
  readonly accepted: boolean;
}

export class AnswerVassalOfferCommand extends WorldCommand {
  private choice: OfferAnswer | undefined;

  public constructor(context: WorldCommandContext) {
    super('Answer Vassal Offer', context);
  }

  public answer(offer: VassalOffer, accepted: boolean): void {
    this.choice = { offer, accepted };
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public override isBlocked(): boolean {
    return this.context.world.campaign.isEnded;
  }

  public execute(): void {
    const { world } = this.context;
    const { choice } = this;

    if (isDefined(choice) && world.wanderers.offer === choice.offer) {
      const { offer, accepted } = choice;

      world.wanderers.answer(offer, accepted);
      if (accepted) {
        this.publishUpdates([offer.court.homeProvince]);
      }
      this.publishVassalOffer();
    }
  }
}

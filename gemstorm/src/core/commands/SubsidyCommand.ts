import type { Province } from '@/core/domain/Province';
import type { ResourceGains } from '@/core/domain/Resources';
import { Shipment } from '@/core/domain/Shipment';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

const SUBSIDY_SHARE = 4;

export class SubsidyCommand extends WorldCommand {
  private donor: Province | undefined;
  private recipient: Province | undefined;

  public constructor(context: WorldCommandContext) {
    super('Subsidy', context);
  }

  public grant(donor: Province, recipient: Province): void {
    this.donor = donor;
    this.recipient = recipient;
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {
    const { donor, recipient } = this;

    if (isDefined(donor) && isDefined(recipient)) {
      const cargo = this.measureCargo(donor, recipient);
      const shipment = new Shipment({
        source: donor,
        target: recipient,
        cargo,
      });

      shipment.deliver();
      this.publish(new ProvinceUpdatedEvent(donor));
      this.publish(new ProvinceUpdatedEvent(recipient));
    }
  }

  private measureCargo(donor: Province, recipient: Province): ResourceGains {
    const { gold, food } = donor.resources;
    const goldShare = Math.floor(gold / SUBSIDY_SHARE);
    const foodShare = Math.floor(food / SUBSIDY_SHARE);
    const goldRoom = Shipment.getMaximum(donor, recipient, 'gold');
    const foodRoom = Shipment.getMaximum(donor, recipient, 'food');

    return {
      gold: Math.min(goldShare, goldRoom),
      food: Math.min(foodShare, foodRoom),
    };
  }
}

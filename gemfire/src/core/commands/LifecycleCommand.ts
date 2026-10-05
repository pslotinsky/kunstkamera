import type { CalendarDate } from '@/core/domain/CalendarDate';
import type { General } from '@/core/domain/General';
import { Succession } from '@/core/domain/Succession';
import { GeneralDiedEvent } from '@/core/events/GeneralDiedEvent';
import { SuccessionReportedEvent } from '@/core/events/SuccessionReportedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

const JANUARY = 1;
const GROWTH_ODDS = 1 / 3;

export class LifecycleCommand extends WorldCommand {
  private readonly succession: Succession;

  public constructor(context: WorldCommandContext) {
    super('Lifecycle', context);
    this.succession = new Succession(context.world);
  }

  public execute(): void {
    const { date } = this.context.world;

    if (date.isMonth(JANUARY)) {
      this.turnYear(date);
    }

    for (const general of this.chooseTheDead(date)) {
      this.mourn(general);
    }
  }

  private turnYear(date: CalendarDate): void {
    const { world } = this.context;

    for (const general of world.generals.all) {
      if (Math.random() < GROWTH_ODDS) {
        general.age(general.getYearlyChange(date, world.isRuler(general)));
      }
    }
  }

  private chooseTheDead(date: CalendarDate): readonly General[] {
    return this.context.world.generals.all.filter(
      (general) => Math.random() < general.getDeathRisk(date),
    );
  }

  private mourn(general: General): void {
    const { world } = this.context;
    const family = world.findFamilyOf(general);
    const wasRuler = world.isRuler(general);

    world.bury(general);

    if (family && wasRuler) {
      const outcome = this.succession.replace(family);

      this.publish(new SuccessionReportedEvent(outcome, 'death'));
      this.publishUpdates(outcome.provinces);
    } else {
      this.publish(new GeneralDiedEvent(general, family));
    }
  }
}

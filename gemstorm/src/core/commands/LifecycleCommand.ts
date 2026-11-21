import { CommandExecutor } from '@/core/CommandExecutor';
import type { CalendarDate } from '@/core/domain/CalendarDate';
import { DEVELOPMENT_MAXES } from '@/core/domain/Development';
import type { General } from '@/core/domain/General';
import type { Province } from '@/core/domain/Province';
import { Succession } from '@/core/domain/Succession';
import { GeneralDiedEvent } from '@/core/events/GeneralDiedEvent';
import { SuccessionReportedEvent } from '@/core/events/SuccessionReportedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

const JANUARY = 1;
const DEVELOPMENT_DECAY_DIVISOR = 20;
const LOYALTY_DEFICIT_DIVISOR = 35;
const BASE_DEVELOPMENT_DECAY = 1;

export class LifecycleCommand extends WorldCommand {
  private readonly executor: CommandExecutor;
  private readonly succession: Succession;
  private remaining: General[] | undefined;
  private processedYear: number | undefined;

  public constructor(context: WorldCommandContext) {
    super('Lifecycle', context);
    this.executor = new CommandExecutor(context);
    this.succession = new Succession(context.world);
  }

  public get isComplete(): boolean {
    return !isDefined(this.remaining);
  }

  public execute(): void {
    const { date } = this.context.world;

    if (date.isMonth(JANUARY) && this.processedYear !== date.year) {
      this.processJanuary(date);
    }
  }

  private processJanuary(date: CalendarDate): void {
    const { campaign } = this.context.world;

    this.remaining ??= this.beginYear(date);
    this.processDeaths(this.remaining);

    if (campaign.canProgress) {
      this.ageSurvivors(date);
    }

    if (!campaign.isAwaitingDecision) {
      this.processedYear = date.year;
      this.remaining = undefined;
    }
  }

  private beginYear(date: CalendarDate): General[] {
    const { provinces } = this.context.world.map;

    for (const province of provinces) {
      this.decayDevelopment(province);
    }
    this.publishUpdates(provinces);

    return this.chooseTheDead(date);
  }

  private decayDevelopment(province: Province): void {
    const { loyalty, cultivation, protection } = province.development;
    const loyaltyDeficit = DEVELOPMENT_MAXES.loyalty - loyalty;
    const loyaltyLoss =
      Math.floor(loyalty / DEVELOPMENT_DECAY_DIVISOR) +
      Math.floor(loyaltyDeficit / LOYALTY_DEFICIT_DIVISOR);
    const cultivationLoss =
      Math.floor(cultivation / DEVELOPMENT_DECAY_DIVISOR) +
      BASE_DEVELOPMENT_DECAY;
    const protectionLoss =
      Math.floor(protection / DEVELOPMENT_DECAY_DIVISOR) +
      BASE_DEVELOPMENT_DECAY;

    province.reduceDevelopment({
      loyalty: loyaltyLoss,
      cultivation: cultivationLoss,
      protection: protectionLoss,
    });
  }

  private processDeaths(remaining: General[]): void {
    const { world } = this.context;
    const { campaign } = world;

    while (remaining.length && campaign.canProgress) {
      const general = remaining.shift()!;

      if (world.generals.all.includes(general)) {
        this.mourn(general);
        this.executor.assess();
      }
    }
  }

  private ageSurvivors(date: CalendarDate): void {
    const { world } = this.context;

    for (const general of world.generals.all) {
      const family = world.findFamilyOf(general);
      const rank = isDefined(family)
        ? world.getGeneralRank(family, general)
        : 'vassal';

      general.ageYear(date, rank);
    }
  }

  private chooseTheDead(date: CalendarDate): General[] {
    return this.context.world.generals.all.filter((general) => {
      const risk = general.getDeathRisk(date);

      return risk > 0 && Math.random() < risk;
    });
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
      this.publishVassalOffer();
    } else {
      this.publish(new GeneralDiedEvent(general, family));
    }
  }
}

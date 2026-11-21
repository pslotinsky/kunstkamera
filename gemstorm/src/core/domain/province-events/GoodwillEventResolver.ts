import {
  BAD_EVENTS,
  EVENT_BALANCE,
  GOOD_EVENTS,
  type GoodwillEventDefinition,
} from '@/config/province-events';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import type {
  CharacteristicsKey,
  CharacteristicsValues,
} from '../Characteristics';
import type { DevelopmentKey } from '../Development';
import type { Family } from '../Family';
import type { General } from '../General';
import { Nerith } from '../Nerith';
import type { Province } from '../Province';
import type { ResourceKey } from '../Resources';
import type { World } from '../World';
import type { Incident } from './Incident';
import { IncidentBuilder } from './IncidentBuilder';

const GOODWILL_EVENTS = [...GOOD_EVENTS, ...BAD_EVENTS];
const MAX_FAME_REWARD = 4;
const RESOURCE_EVENT_RANGE = [25, 50] as const;
const DEVELOPMENT_EVENT_RANGE = [2, 7] as const;
const CHARACTER_EVENT_RANGE = [3, 8] as const;

type CharacterReward = Extract<
  GoodwillEventDefinition['effect'],
  { kind: 'character' }
>;

export class GoodwillEventResolver {
  public constructor(
    private readonly world: World,
    private readonly random: () => number,
  ) {}

  public resolve(provinces: readonly Province[]): readonly Incident[] {
    const incidents: Incident[] = [];

    for (const province of provinces) {
      const incident = this.resolveProvince(province);

      if (isDefined(incident)) {
        incidents.push(incident);
      }
    }

    return incidents;
  }

  private resolveProvince(province: Province): Incident | undefined {
    let incident: Incident | undefined;

    if (province.isEventDue) {
      const definition = this.rollEvent(province.goodwill);

      if (isDefined(definition)) {
        incident = this.apply(definition, province);
      }

      province.resetActionCycle();
    }

    return incident;
  }

  private rollEvent(goodwill: number): GoodwillEventDefinition | undefined {
    const candidates = GOODWILL_EVENTS.filter(
      (event) => event.goodwill === goodwill,
    );

    const occurs =
      candidates.length > 0 &&
      this.random() < EVENT_BALANCE.goodwillEventChance;

    return occurs ? sample(candidates, this.random) : undefined;
  }

  private apply(
    definition: GoodwillEventDefinition,
    province: Province,
  ): Incident | undefined {
    const { effect } = definition;
    let incident: Incident | undefined;

    switch (effect.kind) {
      case 'nerith':
        incident = this.applyNerith(definition, province);
        break;
      case 'banshee':
        incident = this.applyBanshee(definition, province);
        break;
      case 'character':
        incident = this.applyCharacterReward(definition, province, effect);
        break;
      case 'resources':
        incident = this.applyResourceChange(definition, province, effect.stat);
        break;
      case 'development':
        incident = this.applyDevelopmentChange(
          definition,
          province,
          effect.stat,
        );
        break;
    }

    return incident;
  }

  private applyResourceChange(
    definition: GoodwillEventDefinition,
    province: Province,
    stat: ResourceKey,
  ): Incident {
    const incidentBuilder = new IncidentBuilder(province);
    const amount = this.rollBetween(...RESOURCE_EVENT_RANGE);
    const change = { [stat]: amount };

    if (definition.kind === 'good') {
      province.addResources(change);
    } else {
      province.reduceResources(change);
    }

    return incidentBuilder.build(definition, this.world.date);
  }

  private applyDevelopmentChange(
    definition: GoodwillEventDefinition,
    province: Province,
    stat: DevelopmentKey,
  ): Incident {
    const incidentBuilder = new IncidentBuilder(province);
    const amount = this.rollBetween(...DEVELOPMENT_EVENT_RANGE);
    const change = { [stat]: amount };

    if (definition.kind === 'good') {
      province.addDevelopment(change);
    } else {
      province.reduceDevelopment(change);
    }

    return incidentBuilder.build(definition, this.world.date);
  }

  private applyCharacterReward(
    definition: GoodwillEventDefinition,
    province: Province,
    reward: CharacterReward,
  ): Incident {
    const { family } = province;
    const recipient = province.governor ?? family?.ruler;
    const incidentBuilder = new IncidentBuilder(province, recipient);

    if (isDefined(recipient)) {
      this.improveRecipient(recipient, reward.stats);
    }
    if (reward.raisesFame && isDefined(family)) {
      this.rewardFamily(family);
    }

    return incidentBuilder.build(definition, this.world.date);
  }

  private improveRecipient(
    recipient: General,
    stats: readonly CharacteristicsKey[],
  ): void {
    const gains: CharacteristicsValues = {};

    for (const stat of stats) {
      gains[stat] = this.rollBetween(...CHARACTER_EVENT_RANGE);
    }

    recipient.stats = recipient.stats.increase(gains);
  }

  private rewardFamily(family: Family): void {
    const fame = this.rollBetween(0, MAX_FAME_REWARD);

    family.gainFame(fame);
  }

  private applyBanshee(
    definition: GoodwillEventDefinition,
    province: Province,
  ): Incident | undefined {
    const court = this.findCourt(province);
    let incident: Incident | undefined;

    if (court.length > 0) {
      const victim = sample(court, this.random);
      const incidentBuilder = new IncidentBuilder(province);

      this.world.bury(victim);
      incident = incidentBuilder.build(definition, this.world.date, {
        recipient: victim.name,
      });
    }

    return incident;
  }

  private findCourt(province: Province): readonly General[] {
    const { family } = province;

    return isDefined(family) &&
      province.isHome &&
      province.ruledBy(family.ruler)
      ? family.vassals.filter(
          (general) =>
            !this.world.isHeld(general) &&
            this.world.getResidence(family, general) === province,
        )
      : [];
  }

  private applyNerith(
    definition: GoodwillEventDefinition,
    province: Province,
  ): Incident | undefined {
    let incident: Incident | undefined;

    if (this.canGrantNerith(province)) {
      const incidentBuilder = new IncidentBuilder(province);

      province.fifthUnits.addUnit(new Nerith());
      incident = incidentBuilder.build(definition, this.world.date);
    }

    return incident;
  }

  private canGrantNerith(province: Province): boolean {
    const { fifthUnits, family } = province;

    const hasMonster = fifthUnits.hiredUnits.some(
      (unit) => unit.category === 'monster',
    );
    const hasNerith = fifthUnits.units.some((unit) => unit instanceof Nerith);
    const hasRoom = fifthUnits.hasRoomForUnit;

    return !family?.royal && !hasMonster && !hasNerith && hasRoom;
  }

  private rollBetween(minimum: number, maximum: number): number {
    return minimum + Math.floor(this.random() * (maximum - minimum + 1));
  }
}

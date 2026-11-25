import type { Captive } from '@/core/domain/Captive';
import type { Family } from '@/core/domain/Family';
import type { FifthUnit } from '@/core/domain/FifthUnit';
import type { General } from '@/core/domain/General';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

import type {
  SaveData,
  SavedCaptive,
  SavedFamily,
  SavedGeneral,
  SavedProvince,
  SavedUnit,
} from './SaveFile';

export class CampaignSnapshot {
  private readonly families: readonly Family[];
  private readonly generals: readonly General[];

  public constructor(private readonly world: World) {
    this.families = this.collectFamilies();
    this.generals = this.collectGenerals();
  }

  public capture(): SaveData {
    const { world, families, generals } = this;
    const { scenario, captives, exiles, turnQueue } = world;

    if (!isDefined(scenario)) {
      throw new Error('Missing campaign scenario');
    }
    if (world.hasUnansweredRansom) {
      throw new Error('A ransom is awaiting an answer');
    }

    return {
      scenario,
      date: world.date,
      advisor: world.campaign.advisor?.name ?? null,
      player: world.player.name,
      market: world.market.rate.name,
      artifacts: world.campaign.remainingArtifacts.map(({ name }) => name),
      provinces: world.map.provinces.map((province) =>
        this.captureProvince(province),
      ),
      families: families.map((family) => this.captureFamily(family)),
      activeFamilies: world.families.all.map(({ name }) => name),
      generals: generals.map((general) => this.captureGeneral(general)),
      activeGenerals: world.generals.all.map(({ name }) => name),
      exiles: exiles.map(({ name }) => name),
      captives: captives.map((captive) => this.captureCaptive(captive)),
      order: turnQueue.provinceOrder.map(({ number }) => number),
      turnIndex: turnQueue.turnNumber - 1,
    };
  }

  private collectFamilies(): readonly Family[] {
    const { captives, families } = this.world;
    const houses = [
      ...captives.flatMap(({ house, captor }) => [house, captor]),
      ...families.all,
    ];

    return this.uniqueByName(houses);
  }

  private collectGenerals(): readonly General[] {
    const { captives, exiles, generals, map } = this.world;
    const roster = [
      ...generals.all,
      ...exiles,
      ...this.families.flatMap(({ ruler, members }) => [ruler, ...members]),
      ...map.provinces.map(({ governor }) => governor).filter(isDefined),
      ...captives.map(({ general }) => general),
    ];

    return this.uniqueByName(roster);
  }

  private uniqueByName<Named extends { readonly name: string }>(
    values: readonly Named[],
  ): readonly Named[] {
    const byName = new Map(values.map((value) => [value.name, value]));

    return [...byName.values()];
  }

  private captureGeneral(general: General): SavedGeneral {
    const { intelligence, war, charisma } = general.stats;

    return {
      name: general.name,
      birth: general.birth,
      stats: { intelligence, war, charisma },
      lineage: general.lineage ?? null,
      houseMembership: general.hasHouseMembership,
      recruitClass: general.recruitClass,
      defectionClass: general.defectionClass,
      captureImmune: general.captureImmune,
    };
  }

  private captureFamily(family: Family): SavedFamily {
    const { name, fame, royal, homeProvince, ally, ruler, members, gems } =
      family;
    return {
      name,
      fame,
      royal,
      home: homeProvince.number,
      ruler: ruler.name,
      members: members.map(({ name }) => name),
      ally: ally?.name ?? null,
      gems: gems.map(({ name, readyOn }) => ({
        name,
        readyOn: readyOn ?? null,
      })),
    };
  }

  private captureProvince(province: Province): SavedProvince {
    const {
      number,
      family,
      governor,
      resources,
      development,
      goodwill,
      actionCount,
      fifthUnits,
    } = province;
    const { gold, food, troops } = resources;
    const { cultivation, loyalty, protection } = development;

    return {
      number,
      family: family?.name ?? null,
      governor: governor?.name ?? null,
      resources: { gold, food, troops },
      development: { cultivation, loyalty, protection },
      goodwill,
      actionCount,
      entrusted: province.isEntrusted,
      stationed: fifthUnits.units.map((unit) => this.captureUnit(unit)),
      offers: fifthUnits.hirePool.map((unit) => this.captureUnit(unit)),
    };
  }

  private captureUnit({ name, strength }: FifthUnit): SavedUnit {
    return { name, strength };
  }

  private captureCaptive(captive: Captive): SavedCaptive {
    return {
      general: captive.general.name,
      house: captive.house.name,
      captor: captive.captor.name,
      battlefield: captive.battlefield.number,
      ransom: captive.ransom ?? null,
    };
  }
}

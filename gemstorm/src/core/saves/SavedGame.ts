import { PROVINCES } from '@/config/provinces';
import { SCENARIOS } from '@/config/scenarios';
import { CalendarDate } from '@/core/domain/CalendarDate';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

import { CampaignSnapshot } from './CampaignSnapshot';
import { SavedWorldFactory } from './SavedWorldFactory';
import { SaveFile } from './SaveFile';

export interface SaveSummary {
  readonly family: string;
  readonly ruler: string;
  readonly scenario: string;
  readonly date: string;
  readonly province: string;
  readonly savedAt: number;
}

export class SavedGame {
  public static capture(world: World): SavedGame {
    const snapshot = new CampaignSnapshot(world);
    const file = new SaveFile(snapshot.capture(), Date.now());

    return new SavedGame(file);
  }

  public static parse(serialized: string): SavedGame {
    return new SavedGame(SaveFile.parse(serialized));
  }

  private readonly file: SaveFile;

  private constructor(file: SaveFile) {
    this.file = file;
  }

  public get summary(): SaveSummary {
    const { data, savedAt } = this.file;
    const scenario = SCENARIOS.find(({ number }) => number === data.scenario);
    const activeProvince = data.order[data.turnIndex];
    const province = PROVINCES.find(({ number }) => number === activeProvince);
    const house = data.families.find(({ name }) => name === data.player);

    if (!isDefined(scenario) || !isDefined(province) || !isDefined(house)) {
      throw new Error('Invalid saved game');
    }

    return {
      family: data.player,
      ruler: house.ruler,
      scenario: scenario.name,
      date: new CalendarDate(data.date.year, data.date.month).toString(),
      province: province.name,
      savedAt,
    };
  }

  public serialize(): string {
    return this.file.serialize();
  }

  public restore(): World {
    const factory = new SavedWorldFactory();

    return factory.create(this.file.data);
  }
}

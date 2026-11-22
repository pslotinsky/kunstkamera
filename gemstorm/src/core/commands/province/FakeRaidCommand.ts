import type { Province } from '@/core/domain/Province';
import {
  type MissionOutcome,
  MissionReportedEvent,
} from '@/core/events/MissionReportedEvent';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class FakeRaidCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Raid', context);
  }

  public execute(): void {
    const raider = this.currentProvince;

    if (isDefined(raider)) {
      const watchers = this.findWatchers(raider);

      if (watchers.length > 0) {
        const watcher = sample(watchers);
        const outcome = this.inventCaughtOutcome(watcher);

        this.publish(new MissionReportedEvent(raider, outcome));
      }

      this.complete(raider);
    }
  }

  private findWatchers(raider: Province): readonly Province[] {
    const { world } = this.context;
    const raiderSkill = this.measureSkill(raider);

    return world.map
      .getNeighbors(raider)
      .filter(
        (neighbor) =>
          world.isPlayerRun(neighbor) &&
          this.measureSkill(neighbor) > raiderSkill,
      );
  }

  private measureSkill(province: Province): number {
    const { intelligence, war } = province.effectiveStats;

    return intelligence + war;
  }

  private inventCaughtOutcome(target: Province): MissionOutcome {
    const isPlunder = sample([true, false]);

    return isPlunder
      ? { kind: 'plunder', target, loot: undefined }
      : { kind: 'sabotage', target, damage: undefined };
  }
}

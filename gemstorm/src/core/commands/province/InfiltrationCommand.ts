import { Infiltration } from '@/core/domain/Infiltration';
import type { Province } from '@/core/domain/Province';
import type { MissionOutcome } from '@/core/events/MissionReportedEvent';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand } from '../ProvinceCommand';

const INFILTRATION_GOODWILL = -1;

export abstract class InfiltrationCommand extends ProvinceCommand {
  private target: Province | undefined;

  public aimAt(target: Province): void {
    this.target = target;
  }

  public override canExecute(): boolean {
    return this.requiresTarget;
  }

  public override get selectableTargets(): readonly number[] {
    const source = this.currentProvince;

    return isDefined(source)
      ? this.context.world.map.provinces
          .filter((target) => this.canTarget(source, target))
          .map((province) => province.number)
      : [];
  }

  public execute(): void {
    const { map } = this.context.world;
    const source = this.currentProvince;
    const target = this.target;

    if (
      isDefined(source) &&
      isDefined(target) &&
      map.provinces.includes(target) &&
      this.canTarget(source, target)
    ) {
      const outcome = this.infiltrate(
        new Infiltration({ source, target }),
        target,
      );

      this.publish(new MissionReportedEvent(source, outcome));
      this.publish(new ProvinceUpdatedEvent(target));
      this.complete(source, INFILTRATION_GOODWILL);
    }
  }

  protected canTarget(source: Province, target: Province): boolean {
    return source.family?.isHostileTo(target.family) ?? false;
  }

  protected abstract infiltrate(
    infiltration: Infiltration,
    target: Province,
  ): MissionOutcome;
}

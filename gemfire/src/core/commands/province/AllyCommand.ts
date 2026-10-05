import { Envoy } from '@/core/domain/Envoy';
import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';
import { AllianceOfferedEvent } from '@/core/events/AllianceOfferedEvent';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const ALLY_GOODWILL = 1;

export class AllyCommand extends ProvinceCommand {
  private proposed: Family | undefined;
  private offered = false;

  public constructor(context: WorldCommandContext) {
    super('Ally', context);
  }

  public get ally(): Family | undefined {
    return this.currentProvince?.family?.ally;
  }

  public proposeTo(family: Family): void {
    this.proposed = family;
  }

  public override suspendsTurn(): boolean {
    return this.offered;
  }

  public override canExecute(): boolean {
    return this.currentProvince?.isHome ?? false;
  }

  public override get selectableTargets(): readonly number[] {
    const family = this.currentProvince?.family;

    if (!family || family.ally || !this.canExecute()) {
      return [];
    }

    const envoy = this.createEnvoy(family);

    return this.context.world.map.provinces
      .filter(({ family }) => isDefined(family) && envoy.canAllyWith(family))
      .map((province) => province.number);
  }

  public execute(): void {
    const province = this.currentProvince;
    const family = province?.family;

    this.offered = false;

    if (province && family && this.canExecute()) {
      if (family.ally) {
        this.breakAlliance(province, family, family.ally);
      } else if (this.proposed) {
        this.propose(province, family, this.proposed);
      }
    }
  }

  private breakAlliance(
    province: Province,
    family: Family,
    ally: Family,
  ): void {
    family.breakAlliance();
    this.publish(
      new MissionReportedEvent(province, { kind: 'break', family: ally }),
    );
    this.complete(province);
  }

  private propose(province: Province, family: Family, other: Family): void {
    if (other.isEqual(this.context.world.player)) {
      this.offer(province, family);
    } else {
      this.send(province, family, other);
    }
  }

  private offer(province: Province, family: Family): void {
    const envoy = this.createEnvoy(family);

    if (envoy.canAllyWith(this.context.world.player)) {
      this.offered = true;
      this.publish(new AllianceOfferedEvent(province, family));
      this.complete(province, ALLY_GOODWILL);
    }
  }

  private send(province: Province, family: Family, other: Family): void {
    const accepted = this.createEnvoy(family).proposeAlliance(other);

    this.publish(
      new MissionReportedEvent(province, {
        kind: 'alliance',
        family: other,
        accepted,
      }),
    );
    this.complete(province, ALLY_GOODWILL);
  }

  private createEnvoy(family: Family): Envoy {
    return new Envoy({ world: this.context.world, family });
  }
}

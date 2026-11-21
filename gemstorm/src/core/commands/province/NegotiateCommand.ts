import { Envoy } from '@/core/domain/Envoy';
import type { Family } from '@/core/domain/Family';
import type { General } from '@/core/domain/General';
import type { Province } from '@/core/domain/Province';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export type NegotiationMission = 'defection' | 'surrender';

type Approach =
  | { readonly mission: 'defection'; readonly general: General }
  | { readonly mission: 'surrender'; readonly family: Family };

export class NegotiateCommand extends ProvinceCommand {
  private approach: Approach | undefined;

  public constructor(context: WorldCommandContext) {
    super('Negotiate', context);
  }

  public persuade(general: General): void {
    this.approach = { mission: 'defection', general };
  }

  public demandSurrender(family: Family): void {
    this.approach = { mission: 'surrender', family };
  }

  public override canExecute(): boolean {
    const province = this.currentProvince;

    return isDefined(province) && province.isHome && !province.family?.royal;
  }

  public canDemandSurrender(target: Family): boolean {
    const family = this.currentProvince?.family;

    return (
      isDefined(family) &&
      this.canExecute() &&
      this.createEnvoy(family).canDemandSurrender(target)
    );
  }

  public override get selectableTargets(): readonly number[] {
    const family = this.currentProvince?.family;

    return isDefined(family) && this.canExecute()
      ? this.context.world.map.provinces
          .filter((province) => family.isHostileTo(province.family))
          .map((province) => province.number)
      : [];
  }

  public getCandidates(target: Province): readonly General[] {
    const source = this.currentProvince?.family;
    const { family } = target;
    let candidates: readonly General[] = [];

    if (this.canExecute() && isDefined(source) && isDefined(family)) {
      const envoy = this.createEnvoy(source);

      candidates = this.getPostedGenerals(target, family).filter((general) =>
        envoy.canApproach(general),
      );
    }

    return candidates;
  }

  private getPostedGenerals(
    target: Province,
    family: Family,
  ): readonly General[] {
    const { governor } = target;
    let generals: readonly General[] = [];

    if (target.isHome) {
      generals = this.context.world.getVassals(family);
    } else if (isDefined(governor) && target.hasLord) {
      generals = [governor];
    }

    return generals;
  }

  public execute(): void {
    const province = this.currentProvince;
    const family = province?.family;
    const approach = this.approach;

    if (
      this.canExecute() &&
      isDefined(province) &&
      isDefined(family) &&
      isDefined(approach)
    ) {
      const envoy = this.createEnvoy(family);

      if (approach.mission === 'defection') {
        this.sendForDefection(province, envoy, approach.general);
      } else if (envoy.canDemandSurrender(approach.family)) {
        this.sendForSurrender(province, envoy, approach.family);
      }
    }
  }

  private sendForDefection(
    province: Province,
    envoy: Envoy,
    general: General,
  ): void {
    const { world } = this.context;
    const rival = world.findFamilyOf(general);
    const governed = world.getRuledProvince(general);

    if (isDefined(rival) && envoy.canApproach(general)) {
      const persuaded = envoy.persuade(general);

      this.publish(
        new MissionReportedEvent(province, {
          kind: 'defection',
          general,
          family: rival,
          province: governed,
          persuaded,
        }),
      );

      if (persuaded && governed) {
        this.publish(new ProvinceUpdatedEvent(governed));
      }

      this.complete(province);
    }
  }

  private sendForSurrender(
    province: Province,
    envoy: Envoy,
    family: Family,
  ): void {
    const { gems } = family;
    const provinces = this.context.world.getFamilyProvinces(family);
    const yielded = envoy.demandSurrender(family);

    this.publish(
      new MissionReportedEvent(province, {
        kind: 'surrender',
        family,
        gems,
        yielded,
      }),
    );

    if (yielded) {
      this.publishUpdates(provinces);
    }

    this.complete(province);
  }

  private createEnvoy(family: Family): Envoy {
    return new Envoy({ world: this.context.world, family });
  }
}

import type { Artifact } from '@/core/domain/Artifact';
import type { Province } from '@/core/domain/Province';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { SearchReportedEvent } from '@/core/events/SearchReportedEvent';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const SEARCH_COST = 5;
const DISCOVERY_CHANCE = 0.5;
const GOVERNOR_SEARCH_DIVISOR = 20;
const REMOTE_SEARCH_DIVISOR = 40;
const PERCENT_SCALE = 100;

export class SearchCommand extends ProvinceCommand {
  private target: Province | undefined;

  public constructor(context: WorldCommandContext) {
    super('Search', context);
  }

  public searchAt(target: Province): void {
    this.target = target;
  }

  public override canExecute(): boolean {
    return (this.currentProvince?.resources.gold ?? 0) >= SEARCH_COST;
  }

  public override get selectableTargets(): readonly number[] {
    return this.context.world.map.provinces
      .filter((province) => this.isForeign(province))
      .map((province) => province.number);
  }

  public execute(): void {
    const province = this.currentProvince;
    const target = this.target;

    if (province && target && this.canExecute() && this.isForeign(target)) {
      province.reduceResources({ gold: SEARCH_COST });
      this.reportResult(province, target);
      this.complete(province);
    }
  }

  private reportResult(province: Province, target: Province): void {
    const artifact = this.findArtifact(province);

    if (isDefined(artifact)) {
      this.publish(new ArtifactFoundEvent(province, target, artifact));
    } else {
      const hired = target.fifthUnits.hiredUnits;
      const revealed = hired.length > 0 ? [sample(hired)] : [];

      this.publish(new SearchReportedEvent(target, revealed));
    }
  }

  private findArtifact(province: Province): Artifact | undefined {
    const { campaign } = this.context.world;
    const found =
      campaign.hasUndiscoveredArtifacts &&
      Math.random() < DISCOVERY_CHANCE &&
      Math.random() < this.getSearchChance(province);

    return found ? campaign.discoverArtifact() : undefined;
  }

  private getSearchChance(province: Province): number {
    const { governor, family } = province;
    const total = governor?.stats.total ?? family?.ruler.stats.total ?? 0;
    const divisor =
      !isDefined(governor) || province.isRemotelyRuled
        ? REMOTE_SEARCH_DIVISOR
        : GOVERNOR_SEARCH_DIVISOR;
    const score = total / divisor;

    return score / PERCENT_SCALE;
  }

  private isForeign(province: Province): boolean {
    const searcher = this.currentProvince?.family;

    return province.hasOwner() && !!searcher && !province.belongsTo(searcher);
  }
}

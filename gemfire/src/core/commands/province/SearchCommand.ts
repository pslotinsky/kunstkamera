import { ARTIFACT_FIND_CHANCE } from '@/config/artifacts';
import { Artifact } from '@/core/domain/Artifact';
import type { Province } from '@/core/domain/Province';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { SearchReportedEvent } from '@/core/events/SearchReportedEvent';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const SEARCH_COST = 5;

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
      province.addResources({ gold: -SEARCH_COST });
      this.publish(new SearchReportedEvent(target, target.hiredUnits));
      this.reportFind(province, target);
      this.complete(province);
    }
  }

  private reportFind(province: Province, target: Province): void {
    if (Math.random() < ARTIFACT_FIND_CHANCE) {
      this.publish(
        new ArtifactFoundEvent(province, target, Artifact.createRandom()),
      );
    }
  }

  private isForeign(province: Province): boolean {
    const searcher = this.currentProvince?.family;

    return province.hasOwner() && !!searcher && !province.belongsTo(searcher);
  }
}

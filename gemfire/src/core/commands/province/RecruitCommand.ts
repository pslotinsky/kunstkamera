import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const GOLD_PER_TROOP = 2;

export class RecruitCommand extends ProvinceCommand {
  private troops = 0;

  public constructor(context: WorldCommandContext) {
    super('Recruit', context);
  }

  public recruit(troops: number): void {
    this.troops = troops;
  }

  public execute(): void {
    const province = this.currentProvince;

    if (province && this.troops > 0 && province.resources.gold >= this.cost) {
      province.addResources({ gold: -this.cost, troops: this.troops });
      this.complete(province, -1);
    }
  }

  private get cost(): number {
    return this.troops * GOLD_PER_TROOP;
  }
}

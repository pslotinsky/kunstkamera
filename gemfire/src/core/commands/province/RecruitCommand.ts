import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class RecruitCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Recruit', context);
  }

  public execute(): void {
    this.recordAction(-1);
  }
}

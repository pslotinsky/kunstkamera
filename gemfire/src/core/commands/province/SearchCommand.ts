import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class SearchCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Search', context);
  }

  public execute(): void {
    this.recordAction();
    this.endTurn();
  }
}

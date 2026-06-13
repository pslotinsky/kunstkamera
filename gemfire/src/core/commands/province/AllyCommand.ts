import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class AllyCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Ally', context);
  }

  public execute(): void {
    this.recordAction(1);
    this.endTurn();
  }
}

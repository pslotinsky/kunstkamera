import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class MoveTroopsCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Move Troops', context);
  }

  public execute(): void {
    this.recordAction();
    this.endTurn();
  }
}

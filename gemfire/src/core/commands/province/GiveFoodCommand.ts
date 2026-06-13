import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class GiveFoodCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Give Food', context);
  }

  public execute(): void {
    this.recordAction(1);
    this.endTurn();
  }
}

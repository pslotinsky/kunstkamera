import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class ViewCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('View', context);
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {}
}

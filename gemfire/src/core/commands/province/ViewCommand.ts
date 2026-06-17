import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class ViewCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('View', context);
  }

  public execute(): void {}
}

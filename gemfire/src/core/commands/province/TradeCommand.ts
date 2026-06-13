import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class TradeCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Trade', context);
  }

  public execute(): void {}
}

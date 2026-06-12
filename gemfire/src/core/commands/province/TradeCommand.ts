import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class TradeCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Trade', context);
  }

  public execute(): void {}
}

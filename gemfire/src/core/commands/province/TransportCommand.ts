import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class TransportCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Transport', context);
  }

  public execute(): void {
    this.recordAction();
    this.endTurn();
  }
}

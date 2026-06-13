import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class ProtectionCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Protection', context);
  }

  public execute(): void {
    this.recordAction(1);
    this.endTurn();
  }
}

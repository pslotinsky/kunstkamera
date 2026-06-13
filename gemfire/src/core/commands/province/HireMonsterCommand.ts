import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class HireMonsterCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Hire Monster', context);
  }

  public execute(): void {
    this.recordAction();
    this.endTurn();
  }
}

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class AttackCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Attack', context);
  }

  public execute(): void {
    this.recordAction(-1);
    this.endTurn();
  }
}

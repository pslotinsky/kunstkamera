import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class ViewCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('View', context);
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public override get selectableTargets(): readonly number[] {
    return this.context.world.map.provinces.map((province) => province.number);
  }

  public execute(): void {}
}

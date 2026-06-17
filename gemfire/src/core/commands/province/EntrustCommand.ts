import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class EntrustCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Entrust', context);
  }

  public execute(): void {}
}

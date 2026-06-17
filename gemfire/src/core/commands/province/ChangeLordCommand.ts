import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class ChangeLordCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Change Lord', context);
  }

  public execute(): void {}
}

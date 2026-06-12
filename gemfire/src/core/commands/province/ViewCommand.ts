import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class ViewCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('View', context);
  }

  public execute(): void {}
}

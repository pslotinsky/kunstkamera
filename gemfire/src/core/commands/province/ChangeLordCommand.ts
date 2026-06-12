import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class ChangeLordCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Change Lord', context);
  }

  public execute(): void {}
}

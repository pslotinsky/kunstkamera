import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class EntrustCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Entrust', context);
  }

  public execute(): void {}
}

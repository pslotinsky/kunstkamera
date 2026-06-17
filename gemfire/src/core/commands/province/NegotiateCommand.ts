import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class NegotiateCommand extends ProvinceCommand {
  public constructor(context: WorldCommandContext) {
    super('Negotiate', context);
  }

  public execute(): void {
    this.recordAction();
  }
}

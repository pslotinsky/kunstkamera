import { FifthUnit } from './FifthUnit';

export class Pastha extends FifthUnit {
  public constructor() {
    super({
      name: 'Pastha',
      description: 'Water dragon · one battle · no upkeep',
      strength: 160,
      move: 2,
      range: 'short',
    });
  }

  public override get isSpentAfterBattle(): boolean {
    return true;
  }
}

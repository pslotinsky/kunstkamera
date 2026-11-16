import { FifthUnit } from './FifthUnit';

export class Nerith extends FifthUnit {
  public constructor() {
    super({
      name: 'Nerith',
      description: 'Tide wyrm · one battle · no upkeep',
      strength: 160,
      move: 2,
      range: 'short',
    });
  }

  public override get isSpentAfterBattle(): boolean {
    return true;
  }
}

import { STANDARD_UNITS } from '@/config/standard-units';

import { Unit } from './Unit';

export class StandardUnit extends Unit {
  public static ofName(name: string): StandardUnit | undefined {
    const definition = STANDARD_UNITS.find((unit) => unit.name === name);

    return definition && new StandardUnit(definition);
  }

  public static createAll(): readonly StandardUnit[] {
    return STANDARD_UNITS.map((definition) => new StandardUnit(definition));
  }

  public override get consumesFood(): boolean {
    return true;
  }
}

import { GEMS } from '@/config/gems';

import { FifthUnit, type FifthUnitParams } from './FifthUnit';

export interface GemParams {
  readonly gemstone: string;
  readonly guardian: FifthUnitParams;
}

export class Gem {
  public static ofName(name: string): Gem {
    const definition = GEMS.find((gem) => gem.guardian.name === name);

    if (!definition) {
      throw new Error(`No gem named ${name}`);
    }

    return new Gem(definition);
  }

  public readonly gemstone: string;
  public readonly guardian: FifthUnit;

  public constructor(params: GemParams) {
    this.gemstone = params.gemstone;
    this.guardian = new FifthUnit(params.guardian);
  }

  public get name(): string {
    return this.guardian.name;
  }
}

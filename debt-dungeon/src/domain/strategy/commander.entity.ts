import type { CommanderDefinition } from '../content/commander-definition.entity';

interface Params {
  definition: CommanderDefinition;
  health?: number;
}

export class Commander {
  public static create(params: Params): Commander {
    return new Commander(params);
  }

  public readonly definition: CommanderDefinition;
  public readonly health: number;

  private constructor(params: Params) {
    this.definition = params.definition;
    this.health = params.health ?? params.definition.health;
  }

  public get maxHealth(): number {
    return this.definition.health;
  }
}

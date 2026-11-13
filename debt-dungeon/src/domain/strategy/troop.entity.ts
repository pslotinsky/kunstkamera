import type { UnitDefinition } from '../content/unit-definition.entity';

interface Params {
  unit: UnitDefinition;
  troops: number;
  health?: number;
}

export class Troop {
  public static create(params: Params): Troop {
    return new Troop(params);
  }

  public readonly unit: UnitDefinition;
  public readonly health: number;
  public readonly maxHealth: number;

  private constructor(params: Params) {
    this.unit = params.unit;
    this.maxHealth = params.troops * params.unit.health;
    this.health = params.health ?? this.maxHealth;
  }

  public get troops(): number {
    return Math.ceil(this.health / this.unit.health);
  }
}

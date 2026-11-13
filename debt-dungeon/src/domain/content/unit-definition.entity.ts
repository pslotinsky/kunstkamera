export type UnitDefinitionId = string;

interface Params {
  id: UnitDefinitionId;
  name: string;
  icon: string;
  portrait: string;
  image: string;
  attack: number;
  defense: number;
  initiative: number;
  health: number;
}

export class UnitDefinition {
  public static create(params: Params): UnitDefinition {
    return new UnitDefinition(params);
  }

  public readonly id: UnitDefinitionId;
  public readonly name: string;
  public readonly icon: string;
  public readonly portrait: string;
  public readonly image: string;
  public readonly attack: number;
  public readonly defense: number;
  public readonly initiative: number;
  public readonly health: number;

  private constructor(params: Params) {
    this.id = params.id;
    this.name = params.name;
    this.icon = params.icon;
    this.portrait = params.portrait;
    this.image = params.image;
    this.attack = params.attack;
    this.defense = params.defense;
    this.initiative = params.initiative;
    this.health = params.health;
  }
}

interface Params {
  attack: number;
  defense: number;
  initiative: number;
}

export type SquadStat = keyof Params;

export class SquadStats {
  public static create(params: Params): SquadStats {
    return new SquadStats(params);
  }

  public readonly attack: number;
  public readonly defense: number;
  public readonly initiative: number;

  private constructor(params: Params) {
    this.attack = params.attack;
    this.defense = params.defense;
    this.initiative = params.initiative;
  }

  public compareBy(stats: SquadStats, stat: SquadStat): number {
    return this[stat] - stats[stat];
  }
}

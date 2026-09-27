export type BattleSideName = 'attacker' | 'defender';

export class BattleSide {
  public static readonly attacker = new BattleSide('attacker');
  public static readonly defender = new BattleSide('defender');

  public static readonly all: readonly BattleSide[] = [
    BattleSide.attacker,
    BattleSide.defender,
  ];

  private constructor(public readonly name: BattleSideName) {}

  public get opposite(): BattleSide {
    return this.isAttacker ? BattleSide.defender : BattleSide.attacker;
  }

  public get isAttacker(): boolean {
    return this.isEqual(BattleSide.attacker);
  }

  public get isDefender(): boolean {
    return this.isEqual(BattleSide.defender);
  }

  public isEqual(other: BattleSide): boolean {
    return this.name === other.name;
  }

  public toString(): string {
    return this.name;
  }
}

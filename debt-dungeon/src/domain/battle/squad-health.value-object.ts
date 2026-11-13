import { assert } from '@/lib/utils/assert';

interface Params {
  commanderHealth: number;
  commanderMaxHealth: number;
  troopHealth: number;
  troopMaxHealth: number;
  healthPerTroop: number;
}

export class SquadHealth {
  public static create(params: Params): SquadHealth {
    return new SquadHealth(params);
  }

  public readonly commanderHealth: number;
  public readonly commanderMaxHealth: number;
  public readonly troopHealth: number;
  public readonly troopMaxHealth: number;

  private readonly healthPerTroop: number;

  private constructor(params: Params) {
    this.commanderHealth = params.commanderHealth;
    this.commanderMaxHealth = params.commanderMaxHealth;
    this.troopHealth = params.troopHealth;
    this.troopMaxHealth = params.troopMaxHealth;
    this.healthPerTroop = params.healthPerTroop;
  }

  public get current(): number {
    return this.commanderHealth + this.troopHealth;
  }

  public get max(): number {
    return this.commanderMaxHealth + this.troopMaxHealth;
  }

  public get troops(): number {
    return this.healthPerTroop > 0
      ? Math.ceil(this.troopHealth / this.healthPerTroop)
      : 0;
  }

  public get maxTroops(): number {
    return this.healthPerTroop > 0
      ? this.troopMaxHealth / this.healthPerTroop
      : 0;
  }

  public get isAlive(): boolean {
    return this.current > 0;
  }

  public takeDamage(damage: number): SquadHealth {
    assert(Number.isFinite(damage), 'Expected finite damage');
    assert(damage >= 0, 'Expected non-negative damage');

    const troopDamage = Math.min(damage, this.troopHealth);

    return new SquadHealth({
      commanderHealth: Math.max(
        0,
        this.commanderHealth - (damage - troopDamage),
      ),
      commanderMaxHealth: this.commanderMaxHealth,
      troopHealth: this.troopHealth - troopDamage,
      troopMaxHealth: this.troopMaxHealth,
      healthPerTroop: this.healthPerTroop,
    });
  }
}

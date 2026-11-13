import type { Squad as StrategySquad } from '@/domain/strategy/squad.entity';

import type { CommanderDefinition } from '../content/commander-definition.entity';
import type { UnitDefinition } from '../content/unit-definition.entity';
import { SquadHealth } from './squad-health.value-object';
import { type SquadStat, SquadStats } from './squad-stats.value-object';

export type SquadId = string;

export class BattleSquad {
  public static from(squad: StrategySquad): BattleSquad {
    return new BattleSquad(squad);
  }

  public readonly id: SquadId;
  public readonly commander: CommanderDefinition;
  public readonly troop: UnitDefinition | undefined;
  public readonly stats: SquadStats;
  private currentHealth: SquadHealth;

  private constructor(squad: StrategySquad) {
    this.id = squad.id;
    this.commander = squad.commander.definition;
    this.troop = squad.troop?.unit;
    this.stats = this.calculateStats();
    this.currentHealth = SquadHealth.create({
      commanderHealth: squad.commander.health,
      commanderMaxHealth: squad.commander.maxHealth,
      troopHealth: squad.troop?.health ?? 0,
      troopMaxHealth: squad.troop?.maxHealth ?? 0,
      healthPerTroop: this.troop?.health ?? 0,
    });
  }

  public get health(): SquadHealth {
    return this.currentHealth;
  }

  public get name(): string {
    return this.commander.name;
  }

  public get troops(): number {
    return this.health.troops;
  }

  public get isAlive(): boolean {
    return this.health.isAlive;
  }

  public isEqual(squad: BattleSquad): boolean {
    return this.id === squad.id;
  }

  public calculateDamage(target: BattleSquad): number {
    const commanderAttack =
      this.health.commanderHealth > 0 ? this.commander.attack : 0;
    const rawDamage = commanderAttack + this.troops * this.stats.attack;

    return Math.round((rawDamage * 100) / (100 + target.stats.defense));
  }

  public takeDamage(damage: number): number {
    const health = this.health.takeDamage(damage);
    const appliedDamage = this.health.current - health.current;

    this.currentHealth = health;

    return appliedDamage;
  }

  public compareByStat(squad: BattleSquad, stat: SquadStat): number {
    return this.stats.compareBy(squad.stats, stat);
  }

  private calculateStats(): SquadStats {
    return SquadStats.create({
      attack: this.troop?.attack ?? 0,
      defense: this.troop?.defense ?? this.commander.defense,
      initiative: this.troop?.initiative ?? this.commander.initiative,
    });
  }
}

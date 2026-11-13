import type { Army as StrategyArmy } from '@/domain/strategy/army.entity';

import { BattleSquad, type SquadId } from './battle-squad.entity';

export type ArmyId = string;

interface Params {
  readonly id: ArmyId;
  readonly squads: readonly BattleSquad[];
}

export class BattleArmy {
  public static from(army: StrategyArmy): BattleArmy {
    return new BattleArmy({
      id: army.id,
      squads: army.squads.map((squad) => BattleSquad.from(squad)),
    });
  }

  public readonly id: ArmyId;
  public readonly squads: readonly BattleSquad[];

  private constructor(params: Params) {
    this.id = params.id;
    this.squads = params.squads;
  }

  public get aliveSquads(): readonly BattleSquad[] {
    return this.squads.filter((squad) => squad.isAlive);
  }

  public get isDefeated(): boolean {
    return this.squads.every((squad) => !squad.isAlive);
  }

  public isEqual(army: BattleArmy): boolean {
    return this.id === army.id;
  }

  public hasSquad(squadId: SquadId): boolean {
    return this.squads.some((squad) => squad.id === squadId);
  }
}

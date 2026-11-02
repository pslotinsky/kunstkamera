import type { BattleArmy } from './battle-army.entity';
import type { SquadId } from './battle-squad.entity';
import { BattleTurn } from './battle-turn.value-object';

interface Params {
  order: readonly BattleTurn[];
  currentTurn?: number;
}

export class TurnOrder {
  public static create(armies: readonly BattleArmy[]): TurnOrder {
    const order = TurnOrder.toOrder(armies);

    return new TurnOrder({ order });
  }

  private static toOrder(armies: readonly BattleArmy[]): readonly BattleTurn[] {
    return armies
      .flatMap((army) =>
        army.aliveSquads.map((squad) => BattleTurn.create({ army, squad })),
      )
      .toSorted((a, b) => b.squad.compareByStat(a.squad, 'initiative'));
  }

  public readonly currentTurn: number;
  public readonly order: readonly BattleTurn[];

  private constructor({ order, currentTurn = 0 }: Params) {
    this.currentTurn = currentTurn;
    this.order = order;
  }

  public get current(): BattleTurn | undefined {
    return this.order[this.currentTurn];
  }

  public remove(squadId: SquadId): TurnOrder {
    const index = this.order.findIndex((turn) => turn.squad.id === squadId);

    return index > -1 ? this.removeByIndex(index) : this;
  }

  public next(): TurnOrder {
    const currentTurn =
      this.order.length > 0 ? (this.currentTurn + 1) % this.order.length : 0;

    return new TurnOrder({ order: this.order, currentTurn });
  }

  private removeByIndex(index: number): TurnOrder {
    const order = this.order.toSpliced(index, 1);
    const currentTurn =
      index < this.currentTurn ? this.currentTurn - 1 : this.currentTurn;

    return new TurnOrder({ order, currentTurn });
  }
}

import type { SquadAttackedEvent } from '@/domain/battle/events/squad-attacked.event';
import type { SquadDiedEvent } from '@/domain/battle/events/squad-died.event';
import type { TurnStartedEvent } from '@/domain/battle/events/turn-started.event';

import type { BattleControl } from './battle.control';

interface Params {
  ui: BattleControl;
}

export class BattleVisualizer {
  private readonly ui: BattleControl;
  private sequence: (() => void | Promise<void>)[] = [];

  constructor(params: Params) {
    this.ui = params.ui;
  }

  public queueAttack(event: SquadAttackedEvent): void {
    this.sequence.push(async () => {
      const source = this.ui.getSideBySquad(event.sourceId);
      const target = this.ui.getSideBySquad(event.targetId);

      await target.actor.playEnter(event.targetId);
      await source.actor.playAttack(event.sourceId);

      await Promise.all([
        target.actor.playHit(event.targetId, event.after, event.damage),
        target.roster.playHit(event.targetId, event.after),
      ]);
    });
  }

  public queueDeath(event: SquadDiedEvent): void {
    this.sequence.push(async () => {
      const side = this.ui.getSideBySquad(event.squadId);

      await Promise.all([
        side.actor.playDeath(event.squadId),
        side.roster.playDeath(event.squadId),
      ]);
      await this.ui.timeline.playDeath(event.squadId);
    });
  }

  public queueTurnStarted(event: TurnStartedEvent): void {
    this.sequence.push(() =>
      this.ui.showTurn(event.armyId, event.squadId, event.targetIds),
    );
  }

  public queueBattleEnded(): void {
    this.sequence.push(() => this.ui.showResult());
  }

  public async play(): Promise<void> {
    while (this.sequence.length > 0) {
      const reaction = this.sequence.shift()!;
      await reaction();
    }
  }

  public stop(): void {
    this.sequence = [];
  }
}

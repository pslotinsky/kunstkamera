import { Envoy } from '@/core/domain/Envoy';
import type { Family } from '@/core/domain/Family';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export class AllianceAnswerCommand extends WorldCommand {
  private proposer: Family | undefined;
  private accepted = false;

  public constructor(context: WorldCommandContext) {
    super('Answer Alliance', context);
  }

  public answer(proposer: Family, accepted: boolean): void {
    this.proposer = proposer;
    this.accepted = accepted;
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {
    const { player } = this.context.world;
    const proposer = this.proposer;
    const envoy = new Envoy({ world: this.context.world, family: player });

    if (proposer && this.accepted && envoy.canAllyWith(proposer)) {
      player.formAlliance(proposer);
    }
  }
}

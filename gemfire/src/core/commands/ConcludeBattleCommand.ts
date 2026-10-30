import type { BattleOutcome } from '@/core/domain/BattleOutcome';
import type { Invasion } from '@/core/domain/Invasion';
import type { Province } from '@/core/domain/Province';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

interface ConcludeBattleParams {
  readonly invasion: Invasion;
  readonly outcome: BattleOutcome;
  readonly refuge?: Province | undefined;
}

export class ConcludeBattleCommand extends WorldCommand {
  public constructor(
    context: WorldCommandContext,
    private readonly params: ConcludeBattleParams,
  ) {
    super('Conclude battle', context);
  }

  public execute(): void {
    const { invasion, outcome, refuge } = this.params;
    const report = invasion.conclude(outcome, refuge);

    this.publish(new BattleReportedEvent(report));
    this.publishUpdates(invasion.affected);
  }
}

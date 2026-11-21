import type { Infiltration } from '@/core/domain/Infiltration';
import type { Province } from '@/core/domain/Province';
import type { MissionOutcome } from '@/core/events/MissionReportedEvent';

import type { WorldCommandContext } from '../ProvinceCommand';
import { InfiltrationCommand } from './InfiltrationCommand';

export class PlunderCommand extends InfiltrationCommand {
  public constructor(context: WorldCommandContext) {
    super('Plunder', context);
  }

  protected override canTarget(source: Province, target: Province): boolean {
    return (
      super.canTarget(source, target) &&
      source.isNeighbor(target) &&
      !target.belongsTo(this.context.world.player)
    );
  }

  protected infiltrate(
    infiltration: Infiltration,
    target: Province,
  ): MissionOutcome {
    const loot = infiltration.plunder();

    return { kind: 'plunder', target, loot };
  }
}

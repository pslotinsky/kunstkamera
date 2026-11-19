import type { Infiltration } from '@/core/domain/Infiltration';
import type { Province } from '@/core/domain/Province';
import type { MissionOutcome } from '@/core/events/MissionReportedEvent';

import type { WorldCommandContext } from '../ProvinceCommand';
import { InfiltrationCommand } from './InfiltrationCommand';

export class PlunderCommand extends InfiltrationCommand {
  public constructor(context: WorldCommandContext) {
    super('Plunder', context);
  }

  protected infiltrate(
    infiltration: Infiltration,
    target: Province,
  ): MissionOutcome {
    return { kind: 'plunder', target, loot: infiltration.plunder() };
  }
}

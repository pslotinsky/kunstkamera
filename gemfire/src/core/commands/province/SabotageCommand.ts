import type { Infiltration } from '@/core/domain/Infiltration';
import type { Province } from '@/core/domain/Province';
import type { MissionOutcome } from '@/core/events/MissionReportedEvent';

import type { WorldCommandContext } from '../ProvinceCommand';
import { InfiltrationCommand } from './InfiltrationCommand';

export class SabotageCommand extends InfiltrationCommand {
  public constructor(context: WorldCommandContext) {
    super('Sabotage', context);
  }

  protected infiltrate(
    infiltration: Infiltration,
    target: Province,
  ): MissionOutcome {
    return { kind: 'sabotage', target, damage: infiltration.sabotage() };
  }
}

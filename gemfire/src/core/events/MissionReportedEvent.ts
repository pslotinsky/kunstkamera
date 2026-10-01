import type { Family } from '@/core/domain/Family';
import type { Gem } from '@/core/domain/Gem';
import type { General } from '@/core/domain/General';
import type { SabotageDamage } from '@/core/domain/Infiltration';
import type { Province } from '@/core/domain/Province';
import type { Resources } from '@/core/domain/Resources';

export type MissionOutcome =
  | {
      readonly kind: 'alliance';
      readonly family: Family;
      readonly accepted: boolean;
    }
  | { readonly kind: 'break'; readonly family: Family }
  | {
      readonly kind: 'defection';
      readonly general: General;
      readonly family: Family;
      readonly province: Province | undefined;
      readonly persuaded: boolean;
    }
  | {
      readonly kind: 'surrender';
      readonly family: Family;
      readonly gems: readonly Gem[];
      readonly yielded: boolean;
    }
  | {
      readonly kind: 'sabotage';
      readonly target: Province;
      readonly damage: SabotageDamage | undefined;
    }
  | {
      readonly kind: 'plunder';
      readonly target: Province;
      readonly loot: Resources | undefined;
    };

export class MissionReportedEvent {
  public constructor(
    public readonly province: Province,
    public readonly outcome: MissionOutcome,
  ) {}
}

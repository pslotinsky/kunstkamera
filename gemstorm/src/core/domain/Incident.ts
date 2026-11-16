import type { ProvinceEventDefinition } from '@/config/province-events';

import type { CalendarDate } from './CalendarDate';
import type { Family } from './Family';
import type { Province } from './Province';

export interface IncidentChange {
  readonly stat: string;
  readonly before: number;
  readonly after: number;
}

export interface IncidentParams {
  readonly definition: ProvinceEventDefinition;
  readonly province: Province;
  readonly date: CalendarDate;
  readonly changes: readonly IncidentChange[];
  readonly recipient?: string | undefined;
  readonly monster?: string | undefined;
}

export class Incident {
  public readonly definition: ProvinceEventDefinition;
  public readonly province: Province;
  public readonly family: Family | undefined;
  public readonly date: CalendarDate;
  public readonly changes: readonly IncidentChange[];
  public readonly recipient: string | undefined;
  public readonly monster: string | undefined;

  public constructor(params: IncidentParams) {
    this.definition = params.definition;
    this.province = params.province;
    this.family = params.province.family;
    this.date = params.date;
    this.changes = params.changes;
    this.recipient = params.recipient;
    this.monster = params.monster;
  }
}

import type { Province } from '@/core/domain/Province';

export class IncidentShownEvent {
  public constructor(public readonly province: Province) {}
}

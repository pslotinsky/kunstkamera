import type { Province } from '@/core/domain/Province';

export class ProvinceUpdatedEvent {
  public constructor(public readonly province: Province) {}
}

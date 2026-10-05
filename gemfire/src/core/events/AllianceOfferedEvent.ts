import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';

export class AllianceOfferedEvent {
  public constructor(
    public readonly province: Province,
    public readonly proposer: Family,
  ) {}
}

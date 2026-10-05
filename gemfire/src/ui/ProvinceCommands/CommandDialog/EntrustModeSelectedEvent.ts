import type { EntrustMode } from '@/core/commands/province/EntrustCommand';

export class EntrustModeSelectedEvent {
  public constructor(public readonly mode: EntrustMode) {}
}

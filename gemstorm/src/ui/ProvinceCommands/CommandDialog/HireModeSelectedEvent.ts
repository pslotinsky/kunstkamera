import type { HireMode } from '@/core/commands/province/HireMonsterCommand';

export class HireModeSelectedEvent {
  public constructor(public readonly mode: HireMode) {}
}

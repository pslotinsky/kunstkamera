import type { WorldCommand } from '@/core/commands/WorldCommand';

export class CommandSelectedEvent {
  public constructor(public readonly command: WorldCommand) {}
}

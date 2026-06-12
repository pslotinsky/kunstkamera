import type { WorldCommand } from '@/core/commands/WorldCommand';

export class CommandSelectedEvent extends CustomEvent<WorldCommand> {
  public constructor(command: WorldCommand) {
    super(CommandSelectedEvent.name, { detail: command });
  }

  public get command(): WorldCommand {
    return this.detail;
  }
}

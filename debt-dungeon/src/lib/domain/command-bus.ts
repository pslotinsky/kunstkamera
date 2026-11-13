import { assertIsDefined } from '@/lib/utils/assert';

import type { Command } from './command';
import type { Handler } from './handler';

type CommandType<TCommand> = new (...args: never[]) => TCommand;

export class CommandBus {
  private readonly handlers = new Map<
    CommandType<Command<unknown>>,
    Handler<Command<unknown>, unknown>
  >();

  public register<TCommand extends Command<unknown>>(
    commandType: CommandType<TCommand>,
    handler: Handler<TCommand, TCommand['result']>,
  ): void {
    this.handlers.set(commandType, handler);
  }

  public execute<TResult>(command: Command<TResult>): TResult {
    const commandType = command.constructor as CommandType<Command<TResult>>;
    const handler = this.handlers.get(commandType);

    assertIsDefined(handler, `Expected a handler for ${commandType.name}`);

    return handler.execute(command) as TResult;
  }
}

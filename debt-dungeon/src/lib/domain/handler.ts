export interface Handler<TCommand, TResult = void> {
  execute(command: TCommand): TResult;
}

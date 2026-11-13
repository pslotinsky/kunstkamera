export abstract class Command<TResult = void> {
  declare public readonly result: TResult;
}

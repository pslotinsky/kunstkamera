export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[Assertion Error] ${message}`);
  }
}

export function assertIsDefined<T>(
  value: T,
  message: string,
): asserts value is NonNullable<T> {
  assert(value !== null && value !== undefined, message);
}

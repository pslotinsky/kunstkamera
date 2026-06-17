export function sample<Value>(array: readonly Value[]): Value {
  return array[Math.floor(Math.random() * array.length)]!;
}

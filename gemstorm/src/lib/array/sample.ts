export function sample<Value>(
  array: readonly Value[],
  random: () => number = Math.random,
): Value {
  return array[Math.floor(random() * array.length)]!;
}

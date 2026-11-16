type Falsy = false | null | undefined | 0 | 0n | '';

export function compact<Value>(array: readonly (Value | Falsy)[]): Value[] {
  return array.filter(Boolean) as Value[];
}

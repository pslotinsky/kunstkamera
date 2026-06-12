export function groupBy<Value, Key>(
  array: readonly Value[],
  getKey: (value: Value) => Key,
): Map<Key, Value[]> {
  const groups = new Map<Key, Value[]>();

  for (const value of array) {
    const key = getKey(value);
    const group = groups.get(key) ?? [];

    group.push(value);
    groups.set(key, group);
  }

  return groups;
}

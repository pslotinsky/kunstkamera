export function minBy<T>(
  items: readonly T[],
  selector: (item: T) => number,
): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  let minItem = items[0];
  let minValue = selector(minItem);

  for (let index = 1; index < items.length; index++) {
    const item = items[index];
    const value = selector(item);

    if (value < minValue) {
      minItem = item;
      minValue = value;
    }
  }

  return minItem;
}

export function shuffle<Value>(array: readonly Value[]): Value[] {
  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const swapped = shuffled[index]!;

    shuffled[index] = shuffled[swapIndex]!;
    shuffled[swapIndex] = swapped;
  }

  return shuffled;
}

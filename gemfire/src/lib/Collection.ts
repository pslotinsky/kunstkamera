export class Collection<Key extends string | number, Value> {
  private readonly items: Map<Key, Value>;
  private readonly label: string;

  public constructor(items: Map<Key, Value>, label: string) {
    this.items = items;
    this.label = label;
  }

  public get all(): readonly Value[] {
    return [...this.items.values()];
  }

  public getOrFail(key: Key): Value {
    const value = this.items.get(key);

    if (value === undefined) {
      throw new Error(`Unknown ${this.label}: ${key}`);
    }

    return value;
  }
}

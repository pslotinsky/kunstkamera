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

  public add(key: Key, value: Value): void {
    this.items.set(key, value);
  }

  public has(key: Key): boolean {
    return this.items.has(key);
  }

  public remove(key: Key): void {
    this.items.delete(key);
  }

  public getOrFail(key: Key): Value {
    const value = this.items.get(key);

    if (value === undefined) {
      throw new Error(`Unknown ${this.label}: ${key}`);
    }

    return value;
  }
}

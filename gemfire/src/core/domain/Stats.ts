import { Stat } from './Stat';

export type StatsParams<T extends string> = Partial<Record<T, number>>;

export class Stats<T extends string = string> {
  private readonly stats: Map<T, Stat>;

  protected constructor(values: StatsParams<T>, maxes: Record<T, number>) {
    this.stats = new Map();
    for (const key of Object.keys(maxes) as T[]) {
      const stat = new Stat(values?.[key] ?? 0, maxes[key]);
      this.stats.set(key, stat);
      (this as Record<string, unknown>)[key] = stat.value;
    }
  }

  public get entries(): [T, number][] {
    return Array.from(this.stats, ([key, stat]) => [key, stat.value]);
  }

  public get(key: T): number {
    return this.stats.get(key)!.value;
  }

  public add(gains: StatsParams<T>): this {
    const newValues = {} as Record<T, number>;

    for (const [key, stat] of this.stats) {
      newValues[key] = stat.add(
        (gains as Record<T, number | undefined>)[key] ?? 0,
      ).value;
    }

    return this.clone(newValues);
  }

  private clone(values: StatsParams<T>): this {
    return new (this.constructor as new (values?: StatsParams<T>) => this)(
      values,
    );
  }
}

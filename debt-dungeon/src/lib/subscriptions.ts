import type { Listener } from './signal';

export class Subscriptions {
  private readonly unsubscribes = new Set<Listener>();

  public add(...unsubscribes: Listener[]): void {
    for (const unsubscribe of unsubscribes) {
      this.unsubscribes.add(unsubscribe);
    }
  }

  public clear(): void {
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }

    this.unsubscribes.clear();
  }
}

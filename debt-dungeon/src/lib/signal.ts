export type Listener<T = void> = (value: T) => void;

export class Signal<T> {
  private readonly listeners = new Set<Listener<T>>();

  public subscribe(listener: Listener<T>): Listener {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit(value: T): void {
    for (const listener of this.listeners) {
      listener(value);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

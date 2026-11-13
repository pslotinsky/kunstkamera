import { Signal } from '@/lib/signal';

export class ControlSignals {
  private readonly signals = new Set<{ clear(): void }>();

  public create<T = void>(): Signal<T> {
    const signal = new Signal<T>();
    this.signals.add(signal);

    return signal;
  }

  public clear(): void {
    for (const signal of this.signals) {
      signal.clear();
    }
  }
}

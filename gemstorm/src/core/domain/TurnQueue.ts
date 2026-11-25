import { shuffle } from '@/lib/array/shuffle';

import type { Province } from './Province';

interface SavedTurnOrder {
  readonly order: readonly Province[];
  readonly index: number;
}

export class TurnQueue {
  public static create(provinces: readonly Province[]): TurnQueue {
    const order = shuffle(provinces);

    return new TurnQueue(provinces, order, 0);
  }

  public static restore(
    provinces: readonly Province[],
    saved: SavedTurnOrder,
  ): TurnQueue {
    const order = [...saved.order];

    return new TurnQueue(provinces, order, saved.index);
  }

  private readonly provinces: readonly Province[];
  private order: readonly Province[];
  private currentIndex: number;

  private constructor(
    provinces: readonly Province[],
    order: readonly Province[],
    currentIndex: number,
  ) {
    this.provinces = provinces;
    this.order = order;
    this.currentIndex = currentIndex;
  }

  public get provinceOrder(): readonly Province[] {
    return this.order;
  }

  public get pending(): readonly Province[] {
    return this.order.slice(this.currentIndex);
  }

  public get current(): Province | undefined {
    return this.order[this.currentIndex];
  }

  public get turnNumber(): number {
    return this.currentIndex + 1;
  }

  public isDone(): boolean {
    return this.currentIndex >= this.order.length;
  }

  public next(): Province | undefined {
    this.currentIndex += 1;

    return this.current;
  }

  public reset(): void {
    this.order = shuffle(this.provinces);
    this.currentIndex = 0;
  }
}

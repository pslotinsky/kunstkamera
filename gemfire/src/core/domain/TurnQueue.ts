import { shuffle } from '@/lib/array/shuffle';

import type { Province } from './Province';

export class TurnQueue {
  private readonly provinces: readonly Province[];

  private order: Province[] = [];
  private currentIndex = 0;

  public constructor(provinces: readonly Province[]) {
    this.provinces = provinces;
    this.reset();
  }

  public get pending(): readonly Province[] {
    return this.order.slice(this.currentIndex);
  }

  public get current(): Province | undefined {
    return this.order[this.currentIndex];
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

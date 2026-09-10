import type { Cell } from '@/core/domain/Cell';

export class CellPickedEvent {
  public constructor(public readonly cell: Cell) {}
}

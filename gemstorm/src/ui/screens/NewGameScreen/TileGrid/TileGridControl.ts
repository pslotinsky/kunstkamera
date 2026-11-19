import { Control } from '@/lib/Control';

import { type Tile, type TileGridContext, TileGridView } from './TileGridView';

export class TileGridControl extends Control<TileGridView> {
  public constructor(context: TileGridContext) {
    super(TileGridView, context);
  }

  public showTiles(tiles: readonly Tile[]): void {
    this.view.showTiles(tiles);
  }

  public select(key: string): void {
    this.view.showSelected(key);
  }
}

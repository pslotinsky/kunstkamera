// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TileSelectedEvent } from '@/ui/Setup/TileGrid/events/TileSelectedEvent';
import { TileGridControl } from '@/ui/Setup/TileGrid/TileGridControl';

const TILES = [
  { key: 'alderwyn', image: 'alderwyn.webp', label: 'Alderwyn' },
  { key: 'stormmere', image: 'stormmere.webp', label: 'Stormmere' },
];

let grid: TileGridControl | undefined;

function mount(): TileGridControl {
  const container = document.createElement('div');
  document.body.append(container);
  grid = new TileGridControl({
    name: 'houses',
    size: TILES.length,
    picture: 'emblem',
  });
  grid.mount(container);
  grid.showTiles(TILES);

  return grid;
}

function tile(key: string): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(`[data-key="${key}"]`)!;
}

afterEach(() => {
  grid?.unmount();
  grid = undefined;
  document.body.replaceChildren();
});

describe('TileGridControl', () => {
  it('shows each tile’s picture and label', () => {
    mount();

    expect(tile('stormmere').textContent?.trim()).toBe('Stormmere');
    expect(tile('stormmere').querySelector('img')?.getAttribute('src')).toBe(
      'stormmere.webp',
    );
  });

  it('reports the key of the tile that is clicked', () => {
    const mounted = mount();
    const selected = vi.fn();
    mounted.view.subscribe(TileSelectedEvent, selected);

    tile('stormmere').click();

    expect(selected).toHaveBeenCalledWith(new TileSelectedEvent('stormmere'));
  });

  it('marks only the selected tile as pressed', () => {
    const mounted = mount();

    mounted.select('alderwyn');
    mounted.select('stormmere');

    expect(tile('alderwyn').getAttribute('aria-pressed')).toBe('false');
    expect(tile('stormmere').getAttribute('aria-pressed')).toBe('true');
  });
});

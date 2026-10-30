// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProvinceInfoControl } from '@/ui/ProvinceInfo/ProvinceInfoControl';

import { makeProvince } from './factories';

describe('ProvinceInfoControl', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the displayed province resources when a previous province update finishes', () => {
    vi.useFakeTimers();
    const first = makeProvince({ number: 1, gold: 100 });
    const second = makeProvince({ number: 2, gold: 700 });
    const container = document.createElement('div');
    const info = new ProvinceInfoControl();

    info.mount(container);
    info.showProvince(first);
    first.addResources({ gold: 20 });
    info.actualizeProvince(first);
    vi.advanceTimersByTime(100);
    info.showProvince(second);
    vi.advanceTimersByTime(500);

    expect(
      container.querySelector('[data-stat="gold"] span')!.textContent,
    ).toBe('700');
    expect(second.resources.gold).toBe(700);
    info.unmount();
  });

  it('keeps the latest resource value when it matches an unfinished animation frame', () => {
    vi.useFakeTimers();
    const province = makeProvince({ gold: 100 });
    const container = document.createElement('div');
    const info = new ProvinceInfoControl();

    info.mount(container);
    info.showProvince(province);
    province.addResources({ gold: 20 });
    info.actualizeProvince(province);
    vi.advanceTimersByTime(100);

    const shown = Number(
      container.querySelector('[data-stat="gold"] span')!.textContent,
    );

    province.addResources({ gold: shown - province.resources.gold });
    info.actualizeProvince(province);
    vi.advanceTimersByTime(500);

    expect(
      container.querySelector('[data-stat="gold"] span')!.textContent,
    ).toBe(String(province.resources.gold));
    info.unmount();
  });
});

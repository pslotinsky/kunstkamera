// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { SCENARIOS } from '@/config/scenarios';
import { ScenarioSelectControl } from '@/ui/ScenarioSelect/ScenarioSelectControl';

let select: ScenarioSelectControl | undefined;

function mount(): ScenarioSelectControl {
  const container = document.createElement('div');
  document.body.append(container);
  select = new ScenarioSelectControl({ scenarios: SCENARIOS });
  select.mount(container);

  return select;
}

function scenarioButton(number: number): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(
    `[data-tile-grid="scenarios"] [data-key="${number}"]`,
  )!;
}

function text(selector: string): string {
  return document.querySelector(selector)?.textContent?.trim() ?? '';
}

function crestOf(provinceNumber: number): string | undefined {
  const markers = [
    ...document.querySelectorAll<SVGGElement>('.province-markers > g'),
  ];
  const marker = markers.find(
    (candidate) =>
      candidate.querySelector('text')?.textContent === String(provinceNumber),
  );

  return marker?.querySelector('image')?.getAttribute('href') ?? undefined;
}

function ownerOf(scenarioIndex: number, provinceNumber: number) {
  return SCENARIOS[scenarioIndex]?.provinces.find(
    (province) => province.number === provinceNumber,
  )?.family;
}

afterEach(() => {
  select?.unmount();
  select = undefined;
  document.body.replaceChildren();
});

describe('ScenarioSelectControl', () => {
  it('offers each scenario as a tile, the first one chosen', () => {
    const mounted = mount();
    const [first] = SCENARIOS;

    expect(mounted.scenario).toBe(first);
    expect(scenarioButton(1).textContent).toContain(first!.name);
    expect(text('[data-description]')).toBe(first!.description);
  });

  it('labels the map with the start date and scenario name of the click', () => {
    const second = SCENARIOS[1]!;
    mount();

    scenarioButton(2).click();

    expect(text('[data-plaque="date"] [data-title]')).toBe(
      `Month 1, ${second.year}`,
    );
    expect(text('[data-map-title]')).toBe(second.name);
    expect(text('[data-description]')).toBe(second.description);
  });

  it('shows the starting crests of the scenario that is clicked', () => {
    const mounted = mount();
    const changed = SCENARIOS[1]!.provinces.find(
      (province) => province.family !== ownerOf(0, province.number),
    )!;

    scenarioButton(2).click();

    expect(mounted.scenario).toBe(SCENARIOS[1]);
    expect(crestOf(changed.number)).toContain(
      `crests/${changed.family!.toLowerCase()}.webp`,
    );
  });
});

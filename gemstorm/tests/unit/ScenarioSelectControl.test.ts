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
    `[data-scenario="${number}"]`,
  )!;
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
  it('starts with the first scenario selected', () => {
    const mounted = mount();

    expect(mounted.scenario).toBe(SCENARIOS[0]);
    expect(scenarioButton(1).getAttribute('aria-pressed')).toBe('true');
    expect(scenarioButton(2).getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the starting crests of the scenario that is clicked', () => {
    const mounted = mount();
    const changed = SCENARIOS[1]!.provinces.find(
      (province) => province.family !== ownerOf(0, province.number),
    )!;

    scenarioButton(2).click();

    expect(mounted.scenario).toBe(SCENARIOS[1]);
    expect(scenarioButton(2).getAttribute('aria-pressed')).toBe('true');
    expect(crestOf(changed.number)).toContain(
      `crests/${changed.family!.toLowerCase()}.webp`,
    );
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ADVISORS } from '@/config/advisors';
import { SCENARIOS, type Scenario } from '@/config/scenarios';
import { AdvisorSelectControl } from '@/ui/screens/NewGameScreen/AdvisorSelect/AdvisorSelectControl';

const [SCENARIO] = SCENARIOS as [Scenario];

let select: AdvisorSelectControl | undefined;

function mount(): AdvisorSelectControl {
  const container = document.createElement('div');
  document.body.append(container);
  select = new AdvisorSelectControl();
  select.mount(container);

  return select;
}

function text(selector: string): string {
  return document.querySelector(selector)?.textContent ?? '';
}

afterEach(() => {
  select?.unmount();
  select = undefined;
  document.body.replaceChildren();
});

describe('AdvisorSelectControl', () => {
  it('offers the four advisors, the first one chosen', () => {
    const mounted = mount();
    const labels = [...document.querySelectorAll('[data-label]')].map(
      (label) => label.textContent,
    );

    expect(labels).toEqual(ADVISORS.map((advisor) => advisor.name));
    expect(mounted.advisor.name).toBe(ADVISORS[0]!.name);
    expect(text('[data-advisor-name]')).toBe(ADVISORS[0]!.name);
  });

  it('introduces the advisor that is clicked', () => {
    const mounted = mount();
    const quillon = ADVISORS[3]!;

    document.querySelector<HTMLButtonElement>('[data-key="Quillon"]')!.click();

    expect(mounted.advisor.name).toBe('Quillon');
    expect(text('[data-advisor-title]')).toBe(quillon.title);
    expect(text('[data-saying]')).toBe(`“${quillon.saying}”`);
  });

  it('summarises the chosen scenario and house, lighting the house’s lands', () => {
    const mounted = mount();
    const family = SCENARIO.playableFamilies[1]!;
    const owned = SCENARIO.provinces
      .filter((province) => province.family === family)
      .map((province) => province.number);

    mounted.show(SCENARIO, family);

    const highlighted = [
      ...document.querySelectorAll<SVGElement>('.province.highlighted'),
    ].map((region) => Number(region.dataset.province));

    expect(text('[data-map-title]')).toBe(SCENARIO.name);
    expect(text('[data-map-caption]')).toBe(family);
    expect(highlighted.sort((left, right) => left - right)).toEqual(owned);
  });
});

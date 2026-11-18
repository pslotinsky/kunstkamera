// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { SCENARIOS, type Scenario } from '@/config/scenarios';
import { FamilySelectControl } from '@/ui/FamilySelect/FamilySelectControl';

const [FIRST, SECOND] = SCENARIOS as [Scenario, Scenario];

let select: FamilySelectControl | undefined;

function mount(): FamilySelectControl {
  const container = document.createElement('div');
  document.body.append(container);
  select = new FamilySelectControl();
  select.mount(container);

  return select;
}

function houseNames(): readonly string[] {
  return [
    ...document.querySelectorAll('[data-tile-grid="houses"] [data-label]'),
  ].map((name) => name.textContent ?? '');
}

function house(name: string): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(`[data-key="${name}"]`)!;
}

function text(selector: string): string {
  return document.querySelector(selector)?.textContent ?? '';
}

function rulerOf(scenario: Scenario, familyName: string) {
  const family = scenario.families.find((item) => item.name === familyName)!;

  return scenario.generals.find((general) => general.name === family.ruler)!;
}

afterEach(() => {
  select?.unmount();
  select = undefined;
  document.body.replaceChildren();
});

describe('FamilySelectControl', () => {
  it('offers the scenario’s playable houses, the first one chosen', () => {
    const mounted = mount();

    mounted.show(FIRST);

    expect(houseNames()).toEqual(FIRST.playableFamilies);
    expect(mounted.family.name).toBe(FIRST.playableFamilies[0]);
    expect(house(FIRST.playableFamilies[0]!).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('shows the ruler of the house that is clicked', () => {
    const mounted = mount();
    const name = FIRST.playableFamilies[1]!;
    const ruler = rulerOf(FIRST, name);
    const definition = FIRST.families.find((family) => family.name === name)!;
    mounted.show(FIRST);

    house(name).click();

    expect(mounted.family.name).toBe(name);
    expect(text('[data-ruler-name]')).toBe(ruler.name);
    expect(text('[data-age]')).toBe(`Age ${FIRST.year - ruler.birth}`);
    expect(text('[data-intelligence]')).toBe(String(ruler.intelligence));
    expect(text('[data-war]')).toBe(String(ruler.war));
    expect(text('[data-charisma]')).toBe(String(ruler.charisma));
    expect(text('[data-vassals]')).toBe(
      `${definition.members.length - 1} vassals`,
    );
  });

  it('highlights the clicked house’s provinces on the map', () => {
    const mounted = mount();
    const name = FIRST.playableFamilies[1]!;
    const owned = FIRST.provinces
      .filter((province) => province.family === name)
      .map((province) => province.number);
    mounted.show(FIRST);

    house(name).click();

    const highlighted = [
      ...document.querySelectorAll<SVGElement>('.province.highlighted'),
    ].map((region) => Number(region.dataset.province));

    expect(highlighted.sort((left, right) => left - right)).toEqual(owned);
  });

  it('keeps the chosen house for the same scenario and resets it for another', () => {
    const mounted = mount();
    const kept = FIRST.playableFamilies[2]!;
    mounted.show(FIRST);
    house(kept).click();

    mounted.show(FIRST);
    expect(mounted.family.name).toBe(kept);

    mounted.show(SECOND);
    expect(houseNames()).toEqual(SECOND.playableFamilies);
    expect(mounted.family.name).toBe(SECOND.playableFamilies[0]);
  });
});

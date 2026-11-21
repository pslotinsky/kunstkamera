import { afterEach, describe, expect, it, vi } from 'vitest';

import { ARTIFACTS } from '@/config/artifacts';
import { SearchCommand } from '@/core/commands/province/SearchCommand';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Nerith } from '@/core/domain/Nerith';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { SearchReportedEvent } from '@/core/events/SearchReportedEvent';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

const SOURCE_GOLD = 100;
const SEARCH_COST = 5;

function setup(
  options: {
    readonly gold?: number;
    readonly rule?: 'lord' | 'remote' | 'unassigned';
  } = {},
) {
  const ruler = makeGeneral({ intelligence: 120, war: 120, charisma: 120 });
  const lord = makeGeneral({ intelligence: 100, war: 100, charisma: 100 });
  const family = makeFamily({
    name: 'Alderwyn',
    ruler,
    members: [ruler, lord],
  });
  const rival = makeFamily({ name: 'Stormmere' });
  const rule = options.rule ?? 'lord';
  const governor = { lord, remote: ruler, unassigned: undefined }[rule];

  const source = makeProvince({
    number: 1,
    name: 'Alderpass',
    family,
    governor,
    gold: options.gold ?? SOURCE_GOLD,
  });
  const owned = makeProvince({ number: 2, name: 'Ulster', family });
  const neutral = makeProvince({ number: 3, name: 'Hollow' });
  const enemy = makeProvince({ number: 4, name: 'Anjou', family: rival });

  enemy.fifthUnits.addUnit(new Nerith());
  enemy.fifthUnits.addUnit(HiredUnit.ofName('Warriors')!);
  enemy.fifthUnits.addUnit(HiredUnit.ofName('Gargoyles')!);

  const { world, events } = makeWorld([source, owned, neutral, enemy], family);
  const command = new SearchCommand({ world, events });
  const reports: SearchReportedEvent[] = [];
  const finds: ArtifactFoundEvent[] = [];

  events.subscribe(SearchReportedEvent, (event) => reports.push(event));
  events.subscribe(ArtifactFoundEvent, (event) => finds.push(event));
  advanceTo(world, source);

  return { source, enemy, command, reports, finds, world, events };
}

function rollAt(roll: number): void {
  vi.spyOn(Math, 'random').mockReturnValue(roll);
}

describe('SearchCommand', () => {
  afterEach(() => vi.restoreAllMocks());

  it("spends 5 gold and the province's turn to report one hired unit", () => {
    rollAt(0.99);
    const { source, enemy, command, reports } = setup();

    command.searchAt(enemy);
    command.execute();

    expect(source.resources.gold).toBe(SOURCE_GOLD - SEARCH_COST);
    expect(source.actionCount).toBe(1);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.province).toBe(enemy);
    expect(reports[0]?.units.map((unit) => unit.name)).toEqual(['Gargoyles']);
  });

  it('refuses to send a spy the province cannot pay for', () => {
    const { source, enemy, command, reports } = setup({
      gold: SEARCH_COST - 1,
    });

    expect(command.canExecute()).toBe(false);

    command.searchAt(enemy);
    command.execute();

    expect(source.resources.gold).toBe(SEARCH_COST - 1);
    expect(source.actionCount).toBe(0);
    expect(reports).toHaveLength(0);
  });

  it('offers only land another house holds', () => {
    const { command } = setup();

    expect([...command.selectableTargets]).toEqual([4]);
  });

  it.each([
    [0.5, 0],
    [0, 0.15],
  ])(
    'reports a hired unit when either discovery roll fails (%s, %s)',
    (first, second) => {
      const { command, enemy, reports, finds } = setup();
      vi.spyOn(Math, 'random')
        .mockReturnValue(0)
        .mockReturnValueOnce(first)
        .mockReturnValueOnce(second);

      command.searchAt(enemy);
      command.execute();

      expect(reports).toHaveLength(1);
      expect(finds).toHaveLength(0);
    },
  );

  it('finds an artifact when both rolls pass for the resident lord', () => {
    rollAt(0.14);
    const { source, enemy, command, reports, finds } = setup();

    command.searchAt(enemy);
    command.execute();

    expect(reports).toEqual([]);
    expect(finds).toHaveLength(1);
    expect(finds[0]?.province).toBe(source);
    expect(finds[0]?.foundIn).toBe(enemy);
  });

  it.each(['remote', 'unassigned'] as const)(
    'uses the discounted ruler score when the province is %s',
    (rule) => {
      const { enemy, command, reports, finds } = setup({ rule });
      command.searchAt(enemy);

      rollAt(0.09);
      command.execute();
      expect(reports).toHaveLength(1);

      rollAt(0.08);
      command.execute();
      expect(finds).toHaveLength(1);
    },
  );

  it('shares the treasure pool across commands and reports once it is empty', () => {
    rollAt(0);
    const { command, enemy, reports, finds, world, events } = setup();
    const anotherSearch = new SearchCommand({ world, events });
    command.searchAt(enemy);
    anotherSearch.searchAt(enemy);

    command.execute();
    for (let remaining = ARTIFACTS.length - 1; remaining > 0; remaining--) {
      anotherSearch.execute();
    }
    anotherSearch.execute();

    expect(finds.map(({ artifact }) => artifact.name)).toEqual(
      ARTIFACTS.map(({ name }) => name),
    );
    expect(reports).toHaveLength(1);
  });
});

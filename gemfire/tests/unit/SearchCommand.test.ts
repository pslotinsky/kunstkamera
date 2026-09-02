import { afterEach, describe, expect, it, vi } from 'vitest';

import { ARTIFACT_FIND_CHANCE } from '@/config/artifacts';
import { SearchCommand } from '@/core/commands/province/SearchCommand';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { SearchReportedEvent } from '@/core/events/SearchReportedEvent';

import { advanceTo, makeFamily, makeProvince, makeWorld } from './factories';

const SOURCE_GOLD = 100;
const SEARCH_COST = 5;

function setup(options: { readonly gold?: number } = {}) {
  const family = makeFamily({ name: 'Blanche' });
  const rival = makeFamily({ name: 'Lyle' });

  const source = makeProvince({
    number: 1,
    name: 'Rodale',
    family,
    gold: options.gold ?? SOURCE_GOLD,
  });
  const owned = makeProvince({ number: 2, name: 'Ulster', family });
  const neutral = makeProvince({ number: 3, name: 'Hollow' });
  const enemy = makeProvince({ number: 4, name: 'Anjou', family: rival });

  enemy.addUnit(HiredUnit.ofName('Warriors')!);
  enemy.addUnit(HiredUnit.ofName('Gargoyles')!);

  const { world, events } = makeWorld([source, owned, neutral, enemy], family);
  const command = new SearchCommand({ world, events });
  const reports: SearchReportedEvent[] = [];
  const finds: ArtifactFoundEvent[] = [];

  events.subscribe(SearchReportedEvent, (event) => reports.push(event));
  events.subscribe(ArtifactFoundEvent, (event) => finds.push(event));
  advanceTo(world, source);

  return { source, enemy, command, reports, finds };
}

function rollAt(roll: number): void {
  vi.spyOn(Math, 'random').mockReturnValue(roll);
}

describe('SearchCommand', () => {
  afterEach(() => vi.restoreAllMocks());

  it("spends 5 gold and the province's turn to name the units stationed there", () => {
    const { source, enemy, command, reports } = setup();

    command.searchAt(enemy);
    command.execute();

    expect(source.resources.gold).toBe(SOURCE_GOLD - SEARCH_COST);
    expect(source.actionCount).toBe(1);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.province).toBe(enemy);
    expect(reports[0]?.units.map((unit) => unit.name)).toEqual([
      'Warriors',
      'Gargoyles',
    ]);
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

  it('turns up an artifact only when the roll comes in under the chance', () => {
    rollAt(ARTIFACT_FIND_CHANCE);
    const empty = setup();

    empty.command.searchAt(empty.enemy);
    empty.command.execute();

    expect(empty.reports).toHaveLength(1);
    expect(empty.finds).toHaveLength(0);

    rollAt(0);
    const lucky = setup();

    lucky.command.searchAt(lucky.enemy);
    lucky.command.execute();

    expect(lucky.finds).toHaveLength(1);
    expect(lucky.finds[0]?.province).toBe(lucky.source);
    expect(lucky.finds[0]?.foundIn).toBe(lucky.enemy);
  });
});

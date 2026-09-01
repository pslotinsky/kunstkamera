import { describe, expect, it } from 'vitest';

import { GrantArtifactCommand } from '@/core/commands/GrantArtifactCommand';
import { Artifact } from '@/core/domain/Artifact';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

const SCROLL_OF_KNOWLEDGE = new Artifact({
  name: 'Scroll of Knowledge',
  characteristic: 'intelligence',
  bonus: 30,
});

const SWORD_OF_VICTORY = new Artifact({
  name: 'Sword of Victory',
  characteristic: 'war',
  bonus: 40,
});

describe('GrantArtifactCommand', () => {
  it('raises the characteristic the artifact names, and never past 100', () => {
    const scholar = makeGeneral({ name: 'Anselm', intelligence: 60, war: 52 });
    const veteran = makeGeneral({ name: 'Pender', war: 87 });
    const family = makeFamily({
      name: 'Blanche',
      ruler: scholar,
      members: [scholar, veteran],
    });
    const { world, events } = makeWorld(
      [makeProvince({ number: 1, family })],
      family,
    );
    const command = new GrantArtifactCommand({ world, events });

    command.grant(SCROLL_OF_KNOWLEDGE, scholar);
    command.execute();

    expect(scholar.stats.intelligence).toBe(90);
    expect(scholar.stats.war).toBe(52);

    command.grant(SWORD_OF_VICTORY, veteran);
    command.execute();

    expect(veteran.stats.war).toBe(100);
  });
});

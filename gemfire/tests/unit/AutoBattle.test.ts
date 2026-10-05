import { afterEach, describe, expect, it, vi } from 'vitest';

import { BattleSide } from '@/core/domain/BattleSide';
import { AutoBattle } from '@/core/domain/battle-ai/AutoBattle';

import { makeArmy, makeBattle } from './factories';

const EVEN_ROLL = 0.5;

describe('AutoBattle', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fights a battle nobody commands to the end, giving it to the far stronger side', () => {
    vi.spyOn(Math, 'random').mockReturnValue(EVEN_ROLL);

    const stormed = makeBattle({
      attacker: makeArmy({ troops: 600 }),
      defender: makeArmy({ troops: 100 }),
    });
    const held = makeBattle({
      attacker: makeArmy({ troops: 100 }),
      defender: makeArmy({ troops: 600 }),
    });

    expect(new AutoBattle(stormed).fight().winner).toBe(BattleSide.attacker);
    expect(new AutoBattle(held).fight().winner).toBe(BattleSide.defender);
    expect(stormed.isOver && held.isOver).toBe(true);
  });
});

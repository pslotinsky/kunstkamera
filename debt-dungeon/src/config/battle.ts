import type { BattleDrivers } from '@/application/battle/battle.runner';
import { Battle } from '@/domain/battle/battle.entity';
import { BattleArmy } from '@/domain/battle/battle-army.entity';
import { Army } from '@/domain/strategy/army.entity';
import { Commander } from '@/domain/strategy/commander.entity';
import { Squad } from '@/domain/strategy/squad.entity';
import { Troop } from '@/domain/strategy/troop.entity';

import { commanders } from './commanders';
import { units } from './units';

export const drivers: BattleDrivers = {
  attacker: 'human',
  defender: 'ai',
};

export const armies = {
  attacker: Army.create({
    squads: [
      Squad.create({
        commander: Commander.create({ definition: commanders.orc01 }),
        troop: Troop.create({ unit: units.orc01, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.orc02 }),
        troop: Troop.create({ unit: units.orc02, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.goblin01 }),
        troop: Troop.create({ unit: units.goblin01, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.goblin02 }),
        troop: Troop.create({ unit: units.goblin02, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.goblin03 }),
        troop: Troop.create({ unit: units.goblin03, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.goblin04 }),
        troop: Troop.create({ unit: units.goblin04, troops: 100 }),
      }),
    ],
  }),
  defender: Army.create({
    squads: [
      Squad.create({
        commander: Commander.create({ definition: commanders.dwarf01 }),
        troop: Troop.create({ unit: units.dwarf01, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.dwarf02 }),
        troop: Troop.create({ unit: units.dwarf02, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.necro01 }),
        troop: Troop.create({ unit: units.necro01, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.necro02 }),
        troop: Troop.create({ unit: units.necro02, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.necro03 }),
        troop: Troop.create({ unit: units.necro03, troops: 100 }),
      }),
      Squad.create({
        commander: Commander.create({ definition: commanders.necro04 }),
        troop: Troop.create({ unit: units.necro04, troops: 100 }),
      }),
    ],
  }),
};

export function createBattle(): Battle {
  return Battle.create({
    attacker: BattleArmy.from(armies.attacker),
    defender: BattleArmy.from(armies.defender),
  });
}

import type { CharacteristicsKey } from '@/core/domain/Characteristics';
import type { DevelopmentKey } from '@/core/domain/Development';
import type { ResourceKey } from '@/core/domain/Resources';

interface EventDescription {
  readonly name: string;
  readonly description: string;
  readonly image: string;
}

type GoodwillEffect =
  | { readonly kind: 'resources'; readonly stat: ResourceKey }
  | { readonly kind: 'development'; readonly stat: DevelopmentKey }
  | {
      readonly kind: 'character';
      readonly stats: readonly CharacteristicsKey[];
      readonly raisesFame?: boolean;
    }
  | { readonly kind: 'banshee' }
  | { readonly kind: 'nerith' };

export interface GoodwillEventDefinition extends EventDescription {
  readonly kind: 'good' | 'bad';
  readonly goodwill: number;
  readonly effect: GoodwillEffect;
}

export type ProvinceEventDefinition =
  | GoodwillEventDefinition
  | DisasterDefinition
  | RampageDefinition;

export const EVENT_BALANCE = {
  goodwillEventChance: 0.4,
} as const;

export const GOOD_EVENTS: readonly GoodwillEventDefinition[] = [
  {
    name: 'Kind Redcaps',
    description: 'Kind Redcaps blessed the fields.',
    image: 'redcaps',
    goodwill: 1,
    kind: 'good',
    effect: { kind: 'development', stat: 'cultivation' },
  },
  {
    name: 'Elvish troubadour',
    description: 'An elvish troubadour sang praises of the province.',
    image: 'elvish-troubadour',
    goodwill: 1,
    kind: 'good',
    effect: { kind: 'development', stat: 'loyalty' },
  },
  {
    name: 'Leprechaun',
    description: 'A leprechaun left a pot of gold.',
    image: 'leprechaun',
    goodwill: 2,
    kind: 'good',
    effect: { kind: 'resources', stat: 'gold' },
  },
  {
    name: 'Far Gorta',
    description: 'Far Gorta gathered food for the province.',
    image: 'far-gorta',
    goodwill: 2,
    kind: 'good',
    effect: { kind: 'resources', stat: 'food' },
  },
  {
    name: 'Fairy',
    description: 'A fairy rounded up troops to protect the people.',
    image: 'fairy',
    goodwill: 2,
    kind: 'good',
    effect: { kind: 'resources', stat: 'troops' },
  },
  {
    name: 'Stormherald',
    description: 'Stormherald calmed the approaching storm.',
    image: 'stormherald',
    goodwill: 1,
    kind: 'good',
    effect: { kind: 'development', stat: 'protection' },
  },
  {
    name: 'Unicorn',
    description: 'A unicorn empowered {lord}.',
    image: 'unicorn',
    goodwill: 3,
    kind: 'good',
    effect: { kind: 'character', stats: ['intelligence', 'war'] },
  },
  {
    name: 'Gwraig',
    description: 'Gwraig brought a charm to {lord}.',
    image: 'gwraig',
    goodwill: 3,
    kind: 'good',
    effect: { kind: 'character', stats: ['charisma'], raisesFame: true },
  },
  {
    name: 'Nerith offers aid',
    description: 'Nerith has offered to fight for the province.',
    image: 'nerith',
    effect: { kind: 'nerith' },
    goodwill: 3,
    kind: 'good',
  },
];

export const BAD_EVENTS: readonly GoodwillEventDefinition[] = [
  {
    name: 'Durahan',
    description: 'Durahan rode through the province with the Shadow of Death.',
    image: 'durahan',
    goodwill: -1,
    kind: 'bad',
    effect: { kind: 'development', stat: 'protection' },
  },
  {
    name: 'Black Annis',
    description: 'Black Annis frightened the people.',
    image: 'black-annis',
    goodwill: -1,
    kind: 'bad',
    effect: { kind: 'development', stat: 'loyalty' },
  },
  {
    name: 'Banshee',
    description: 'A banshee claimed the life of {lord}.',
    image: 'banshee',
    goodwill: -3,
    kind: 'bad',
    effect: { kind: 'banshee' },
  },
  {
    name: 'Mischievous pixies',
    description: 'Mischievous pixies dug up the fields.',
    image: 'pixies',
    goodwill: -1,
    kind: 'bad',
    effect: { kind: 'development', stat: 'cultivation' },
  },
  {
    name: 'Hobgoblins',
    description: 'Hobgoblins stole gold from the province.',
    image: 'hobgoblins',
    goodwill: -2,
    kind: 'bad',
    effect: { kind: 'resources', stat: 'gold' },
  },
  {
    name: 'Granaryfiends',
    description: 'Granaryfiends gobbled up the food stores.',
    image: 'granaryfiends',
    goodwill: -2,
    kind: 'bad',
    effect: { kind: 'resources', stat: 'food' },
  },
  {
    name: 'Shrieker',
    description: 'A shrieker scared away troops.',
    image: 'shrieker',
    goodwill: -3,
    kind: 'bad',
    effect: { kind: 'resources', stat: 'troops' },
  },
];

export interface DisasterDefinition extends EventDescription {
  readonly kind: 'disaster';
  readonly months: readonly number[];
  readonly chance: number | ((loyalty: number) => number);
  readonly lossDivisor: number;
  readonly mitigated?: boolean;
  readonly resourceLosses: readonly ResourceKey[];
  readonly developmentLosses: readonly DevelopmentKey[];
  readonly provinces?: readonly number[];
}

const MAX_LOYALTY = 100;
const FIRE_LOYALTY_DIVISOR = 4;

export const DISASTERS: readonly DisasterDefinition[] = [
  {
    name: 'Plague',
    description: 'Plague struck the province.',
    image: 'plague',
    chance: 0.05,
    lossDivisor: 5,
    resourceLosses: ['troops'],
    developmentLosses: ['loyalty', 'cultivation', 'protection'],
    kind: 'disaster',
    months: [3, 6, 9, 12],
  },
  {
    name: 'Heavy snow',
    description: 'Heavy snow damaged the province.',
    image: 'heavy-snow',
    chance: 0.3,
    lossDivisor: 10,
    resourceLosses: [],
    developmentLosses: ['loyalty', 'cultivation'],
    kind: 'disaster',
    months: [12],
    provinces: [1, 2, 3, 4, 5],
  },
  {
    name: 'Fire',
    description: 'Fire ravaged the province.',
    image: 'fire',
    chance: (loyalty) =>
      Math.floor((MAX_LOYALTY - loyalty) / FIRE_LOYALTY_DIVISOR) / MAX_LOYALTY,
    lossDivisor: 5,
    mitigated: true,
    resourceLosses: ['gold', 'food', 'troops'],
    developmentLosses: ['loyalty', 'cultivation', 'protection'],
    kind: 'disaster',
    months: [9],
    provinces: [7, 9, 10, 13, 14, 15],
  },
  {
    name: 'Flood',
    description: 'Floodwater swept through the province.',
    image: 'flood',
    chance: 0.15,
    lossDivisor: 5,
    mitigated: true,
    resourceLosses: ['gold', 'food', 'troops'],
    developmentLosses: ['loyalty', 'cultivation', 'protection'],
    kind: 'disaster',
    months: [6],
    provinces: [17, 18, 19, 20, 21, 22, 28, 29],
  },
  {
    name: 'Earthquake',
    description: 'An earthquake shook the province.',
    image: 'earthquake',
    chance: 0.1,
    lossDivisor: 4,
    mitigated: true,
    resourceLosses: ['troops'],
    developmentLosses: ['loyalty', 'cultivation', 'protection'],
    kind: 'disaster',
    months: [3],
    provinces: [24, 25, 26, 27],
  },
];

interface RampageDefinition extends EventDescription {
  readonly kind: 'rampage';
}

export const RAMPAGE: RampageDefinition = {
  name: 'Monster rampage',
  description: 'A hired monster went on a rampage.',
  image: 'rampage',
  kind: 'rampage',
};

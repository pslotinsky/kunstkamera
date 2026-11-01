import type { CharacteristicsValues } from '@/core/domain/Characteristics';
import type { DevelopmentGains } from '@/core/domain/Development';
import type { ResourceGains } from '@/core/domain/Resources';

export interface ProvinceEventDefinition {
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly kind: 'good' | 'bad' | 'disaster' | 'rampage';
  readonly resources?: ResourceGains;
  readonly development?: DevelopmentGains;
  readonly characteristics?: CharacteristicsValues;
  readonly minimumGoodwill?: number;
  readonly weight?: number;
  readonly grantsPastha?: boolean;
}

export const EVENT_BALANCE = {
  neutralChance: 0.1,
  goodwillChance: 0.2,
  oppositeChance: 0.05,
  protectionScale: 400,
  disasterChance: 0.1,
  rampageChance: 0.02,
} as const;

export const GOOD_EVENTS: readonly ProvinceEventDefinition[] = [
  {
    name: 'Kind Redcaps',
    description: 'Kind Redcaps blessed the fields.',
    image: 'redcaps',
    kind: 'good',
    development: { cultivation: 10 },
  },
  {
    name: 'Elvish troubadour',
    description: 'An elvish troubadour sang praises of the province.',
    image: 'elvish-troubadour',
    kind: 'good',
    development: { loyalty: 10 },
  },
  {
    name: 'Leprechaun',
    description: 'A leprechaun left a pot of gold.',
    image: 'leprechaun',
    kind: 'good',
    resources: { gold: 20 },
  },
  {
    name: 'Far Gorta',
    description: 'Far Gorta gathered food for the province.',
    image: 'far-gorta',
    kind: 'good',
    resources: { food: 20 },
  },
  {
    name: 'Fairy',
    description: 'A fairy rounded up troops to protect the people.',
    image: 'fairy',
    kind: 'good',
    resources: { troops: 20 },
  },
  {
    name: 'Airial',
    description: 'Airial calmed the approaching storm.',
    image: 'airial',
    kind: 'good',
    development: { protection: 10 },
  },
  {
    name: 'Unicorn',
    description: 'A unicorn empowered {lord}.',
    image: 'unicorn',
    kind: 'good',
    characteristics: { intelligence: 2, war: 2 },
    minimumGoodwill: 2,
    weight: 1,
  },
  {
    name: 'Gwraig',
    description: 'Gwraig brought a charm to {lord}.',
    image: 'gwraig',
    kind: 'good',
    characteristics: { charisma: 2 },
    minimumGoodwill: 2,
    weight: 1,
  },
  {
    grantsPastha: true,
    name: 'Pastha offers aid',
    description: 'Pastha has offered to fight for the province.',
    image: 'pastha',
    kind: 'good',
    minimumGoodwill: 3,
    weight: 1,
  },
];

export const BAD_EVENTS: readonly ProvinceEventDefinition[] = [
  {
    name: 'Durahan',
    description: 'Durahan rode through the province with the Shadow of Death.',
    image: 'durahan',
    kind: 'bad',
    development: { protection: -10 },
  },
  {
    name: 'Black Annis',
    description: 'Black Annis frightened the people.',
    image: 'black-annis',
    kind: 'bad',
    development: { loyalty: -10 },
  },
  {
    name: 'Banshee',
    description: 'A banshee brought an evil omen.',
    image: 'banshee',
    kind: 'bad',
    development: { protection: -10 },
  },
  {
    name: 'Mischievous pixies',
    description: 'Mischievous pixies dug up the fields.',
    image: 'pixies',
    kind: 'bad',
    development: { cultivation: -10 },
  },
  {
    name: 'Hobgoblins',
    description: 'Hobgoblins stole gold from the province.',
    image: 'hobgoblins',
    kind: 'bad',
    resources: { gold: -20 },
  },
  {
    name: 'Auguskiegies',
    description: 'Auguskiegies gobbled up the food stores.',
    image: 'auguskiegies',
    kind: 'bad',
    resources: { food: -20 },
  },
  {
    name: 'Shrieker',
    description: 'A shrieker scared away troops.',
    image: 'shrieker',
    kind: 'bad',
    resources: { troops: -20 },
  },
];

const DISASTER_DAMAGE = {
  loyalty: -20,
  cultivation: -20,
  protection: -20,
} as const;

export interface DisasterDefinition extends ProvinceEventDefinition {
  readonly months: readonly number[];
  readonly provinces?: readonly number[];
}

export const DISASTERS: readonly DisasterDefinition[] = [
  {
    name: 'Heavy snow',
    description: 'Heavy snow damaged the province.',
    image: 'heavy-snow',
    kind: 'disaster',
    development: DISASTER_DAMAGE,
    months: [12],
    provinces: [1, 2, 3, 4, 5],
  },
  {
    name: 'Fire',
    description: 'Fire ravaged the province.',
    image: 'fire',
    kind: 'disaster',
    development: DISASTER_DAMAGE,
    months: [9],
    provinces: [7, 8, 9, 11, 14, 15],
  },
  {
    name: 'Flood',
    description: 'Floodwater swept through the province.',
    image: 'flood',
    kind: 'disaster',
    development: DISASTER_DAMAGE,
    months: [6],
    provinces: [17, 18, 19, 20, 21, 22, 28, 29],
  },
  {
    name: 'Earthquake',
    description: 'An earthquake shook the province.',
    image: 'earthquake',
    kind: 'disaster',
    development: DISASTER_DAMAGE,
    months: [3],
    provinces: [24, 25, 26, 27],
  },
  {
    name: 'Plague',
    description: 'Plague struck the province.',
    image: 'plague',
    kind: 'disaster',
    development: DISASTER_DAMAGE,
    months: [3, 6, 9, 12],
  },
];

export const RAMPAGE: ProvinceEventDefinition = {
  name: 'Monster rampage',
  description: 'A hired monster went on a rampage.',
  image: 'rampage',
  kind: 'rampage',
  development: DISASTER_DAMAGE,
};

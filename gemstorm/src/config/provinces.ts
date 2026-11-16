import type { Landscape } from '@/core/domain/Province';

export interface ProvinceData {
  readonly number: number;
  readonly name: string;
  readonly neighbors: readonly number[];
  readonly landscape: Landscape;
}

export const PROVINCES: readonly ProvinceData[] = [
  { number: 1, name: 'Frostbreak', neighbors: [2, 3], landscape: 'snow' },
  { number: 2, name: 'Rimewatch', neighbors: [1, 3, 6, 7], landscape: 'snow' },
  {
    number: 3,
    name: 'Whitehaven',
    neighbors: [1, 2, 4, 5, 6],
    landscape: 'snow',
  },
  { number: 4, name: 'Snowspire', neighbors: [3, 5], landscape: 'snow' },
  {
    number: 5,
    name: 'Wintercairn',
    neighbors: [3, 4, 6, 11, 12],
    landscape: 'snow',
  },
  {
    number: 6,
    name: 'Pineward',
    neighbors: [2, 3, 5, 7, 10, 11],
    landscape: 'woods',
  },
  {
    number: 7,
    name: 'Mossvale',
    neighbors: [2, 6, 8, 9, 10],
    landscape: 'woods',
  },
  { number: 8, name: 'Seaglass', neighbors: [7], landscape: 'woods' },
  {
    number: 9,
    name: 'Briarfall',
    neighbors: [7, 10, 13, 15],
    landscape: 'woods',
  },
  {
    number: 10,
    name: 'Alderpass',
    neighbors: [6, 7, 9, 11, 15, 16, 17],
    landscape: 'woods',
  },
  {
    number: 11,
    name: 'Fernholt',
    neighbors: [5, 6, 10, 12, 17, 18],
    landscape: 'woods',
  },
  { number: 12, name: 'Eastmere', neighbors: [5, 11, 18], landscape: 'woods' },
  { number: 13, name: 'Windrest', neighbors: [9, 14, 15], landscape: 'woods' },
  {
    number: 14,
    name: 'Rookhaven',
    neighbors: [13, 15, 23],
    landscape: 'woods',
  },
  {
    number: 15,
    name: 'Greenmarch',
    neighbors: [9, 10, 13, 14, 16, 23],
    landscape: 'woods',
  },
  {
    number: 16,
    name: 'Kingsward',
    neighbors: [10, 15, 17, 22, 23],
    landscape: 'woods',
  },
  {
    number: 17,
    name: 'Reedcross',
    neighbors: [10, 11, 16, 18, 19, 22],
    landscape: 'river',
  },
  {
    number: 18,
    name: 'Rivermeet',
    neighbors: [11, 12, 17, 19],
    landscape: 'river',
  },
  {
    number: 19,
    name: 'Fenwatch',
    neighbors: [17, 18, 20, 22],
    landscape: 'river',
  },
  {
    number: 20,
    name: 'Deltamere',
    neighbors: [19, 21, 22, 28],
    landscape: 'river',
  },
  { number: 21, name: 'Tideford', neighbors: [20, 28, 30], landscape: 'river' },
  {
    number: 22,
    name: 'Skyreach',
    neighbors: [16, 17, 19, 20, 23, 24, 28],
    landscape: 'river',
  },
  {
    number: 23,
    name: 'Oakrest',
    neighbors: [14, 15, 16, 22, 24],
    landscape: 'woods',
  },
  {
    number: 24,
    name: 'Stonewake',
    neighbors: [22, 23, 25, 27, 28],
    landscape: 'mountain',
  },
  {
    number: 25,
    name: 'Cinderpeak',
    neighbors: [24, 26, 27],
    landscape: 'mountain',
  },
  { number: 26, name: 'Duskcrag', neighbors: [25], landscape: 'mountain' },
  {
    number: 27,
    name: 'Ironpass',
    neighbors: [24, 25, 28, 29],
    landscape: 'mountain',
  },
  {
    number: 28,
    name: 'Southfen',
    neighbors: [20, 21, 22, 24, 27, 29, 30],
    landscape: 'river',
  },
  {
    number: 29,
    name: 'Rainshore',
    neighbors: [27, 28, 30],
    landscape: 'river',
  },
  { number: 30, name: 'Mistbay', neighbors: [21, 28, 29], landscape: 'woods' },
];

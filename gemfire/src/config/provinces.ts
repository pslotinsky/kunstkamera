import type { Landscape } from '@/core/domain/Province';

export interface ProvinceData {
  readonly number: number;
  readonly name: string;
  readonly neighbors: readonly number[];
  readonly landscape: Landscape;
}

export const PROVINCES: readonly ProvinceData[] = [
  { number: 1, name: 'Dunmoor', neighbors: [2, 3], landscape: 'snow' },
  { number: 2, name: 'Carveti', neighbors: [1, 3, 6, 7], landscape: 'snow' },
  { number: 3, name: 'Cobrige', neighbors: [1, 2, 4, 5, 6], landscape: 'snow' },
  { number: 4, name: 'Banshea', neighbors: [3, 5], landscape: 'snow' },
  {
    number: 5,
    name: 'Petaria',
    neighbors: [3, 4, 6, 11, 12],
    landscape: 'snow',
  },
  {
    number: 6,
    name: 'Hyland',
    neighbors: [2, 3, 5, 7, 10, 11],
    landscape: 'woods',
  },
  {
    number: 7,
    name: 'Norwood',
    neighbors: [2, 6, 8, 9, 10],
    landscape: 'woods',
  },
  { number: 8, name: 'Lisle', neighbors: [7], landscape: 'woods' },
  {
    number: 9,
    name: 'Erewood',
    neighbors: [7, 10, 13, 15],
    landscape: 'woods',
  },
  {
    number: 10,
    name: 'Rodale',
    neighbors: [6, 7, 9, 11, 15, 16, 17],
    landscape: 'woods',
  },
  {
    number: 11,
    name: 'Hermet',
    neighbors: [5, 6, 10, 12, 17, 18],
    landscape: 'woods',
  },
  { number: 12, name: 'Ostlan', neighbors: [5, 11, 18], landscape: 'woods' },
  { number: 13, name: 'Powice', neighbors: [9, 14, 15], landscape: 'woods' },
  { number: 14, name: 'Cardyf', neighbors: [13, 15, 23], landscape: 'woods' },
  {
    number: 15,
    name: 'Eljing',
    neighbors: [9, 10, 13, 14, 16, 23],
    landscape: 'woods',
  },
  {
    number: 16,
    name: 'Centra',
    neighbors: [10, 15, 17, 22, 23],
    landscape: 'woods',
  },
  {
    number: 17,
    name: 'Culver',
    neighbors: [10, 11, 16, 18, 19, 22],
    landscape: 'river',
  },
  {
    number: 18,
    name: 'Lindum',
    neighbors: [11, 12, 17, 19],
    landscape: 'river',
  },
  {
    number: 19,
    name: 'Caster',
    neighbors: [17, 18, 20, 22],
    landscape: 'river',
  },
  {
    number: 20,
    name: 'Anglia',
    neighbors: [19, 21, 22, 28],
    landscape: 'river',
  },
  { number: 21, name: 'Oldlyn', neighbors: [20, 28, 30], landscape: 'river' },
  {
    number: 22,
    name: 'Londre',
    neighbors: [16, 17, 19, 20, 23, 24, 28],
    landscape: 'river',
  },
  {
    number: 23,
    name: 'Attley',
    neighbors: [14, 15, 16, 22, 24],
    landscape: 'woods',
  },
  {
    number: 24,
    name: 'Linden',
    neighbors: [22, 23, 25, 27, 28],
    landscape: 'mountain',
  },
  {
    number: 25,
    name: 'Ashlan',
    neighbors: [24, 26, 27],
    landscape: 'mountain',
  },
  { number: 26, name: 'Penzan', neighbors: [25], landscape: 'mountain' },
  {
    number: 27,
    name: 'Belgam',
    neighbors: [24, 25, 28, 29],
    landscape: 'mountain',
  },
  {
    number: 28,
    name: 'Celsea',
    neighbors: [20, 21, 22, 24, 27, 29, 30],
    landscape: 'river',
  },
  { number: 29, name: 'Cambry', neighbors: [27, 28, 30], landscape: 'river' },
  { number: 30, name: 'Farlan', neighbors: [21, 28, 29], landscape: 'woods' },
];

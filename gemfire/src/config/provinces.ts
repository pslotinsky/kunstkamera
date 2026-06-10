export interface ProvinceData {
  readonly number: number;
  readonly name: string;
  readonly neighbors: readonly number[];
}

export const PROVINCES: readonly ProvinceData[] = [
  { number: 1, name: 'Dunmoor', neighbors: [2, 3] },
  { number: 2, name: 'Carveti', neighbors: [1, 3, 6, 7] },
  { number: 3, name: 'Cobrige', neighbors: [1, 2, 4, 5, 6] },
  { number: 4, name: 'Banshea', neighbors: [3, 5] },
  { number: 5, name: 'Petaria', neighbors: [3, 4, 6, 11, 12] },
  { number: 6, name: 'Hyland', neighbors: [2, 3, 5, 7, 10, 11] },
  { number: 7, name: 'Norwood', neighbors: [2, 6, 8, 9, 10] },
  { number: 8, name: 'Lisle', neighbors: [7] },
  { number: 9, name: 'Erewood', neighbors: [7, 10, 13, 15] },
  { number: 10, name: 'Rodale', neighbors: [6, 7, 9, 11, 15, 16, 17] },
  { number: 11, name: 'Hermet', neighbors: [5, 6, 10, 12, 17, 18] },
  { number: 12, name: 'Ostlan', neighbors: [5, 11, 18] },
  { number: 13, name: 'Powice', neighbors: [9, 14, 15] },
  { number: 14, name: 'Cardyf', neighbors: [13, 15, 23] },
  { number: 15, name: 'Eljing', neighbors: [9, 10, 13, 14, 16, 23] },
  { number: 16, name: 'Centra', neighbors: [10, 15, 17, 22, 23] },
  { number: 17, name: 'Culver', neighbors: [10, 11, 16, 18, 19, 22] },
  { number: 18, name: 'Lindum', neighbors: [11, 12, 17, 19] },
  { number: 19, name: 'Caster', neighbors: [17, 18, 20, 22] },
  { number: 20, name: 'Anglia', neighbors: [19, 21, 22, 28] },
  { number: 21, name: 'Oldlyn', neighbors: [20, 28, 30] },
  { number: 22, name: 'Londre', neighbors: [16, 17, 19, 20, 23, 24, 28] },
  { number: 23, name: 'Attley', neighbors: [14, 15, 16, 22, 24] },
  { number: 24, name: 'Linden', neighbors: [22, 23, 25, 27, 28] },
  { number: 25, name: 'Ashlan', neighbors: [24, 26, 27] },
  { number: 26, name: 'Penzan', neighbors: [25] },
  { number: 27, name: 'Belgam', neighbors: [24, 25, 28, 29] },
  { number: 28, name: 'Celsea', neighbors: [20, 21, 22, 24, 27, 29, 30] },
  { number: 29, name: 'Cambry', neighbors: [27, 28, 30] },
  { number: 30, name: 'Farlan', neighbors: [21, 28, 29] },
];

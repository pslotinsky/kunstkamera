interface MonsterOfferRegion {
  readonly provinces: readonly number[];
  readonly offers: readonly [string, string];
}

export const MONSTER_OFFER_REGIONS: readonly MonsterOfferRegion[] = [
  { provinces: [1, 5], offers: ['Grimhides', 'Bugbear'] },
  { provinces: [2, 3, 4, 6], offers: ['Grimhides', 'Fachan'] },
  { provinces: [7, 8, 9], offers: ['Ogre', 'Lizards'] },
  { provinces: [10, 17, 23], offers: ['Ogre', 'Skeletons'] },
  { provinces: [11, 12, 18, 19], offers: ['Ironbacks', 'Skeletons'] },
  { provinces: [13, 14, 16], offers: ['Ogre', 'Bugbear'] },
  { provinces: [15], offers: ['Ogre', 'Wyverns'] },
  { provinces: [20, 21, 27], offers: ['Grimhides', 'Skeletons'] },
  { provinces: [22, 30], offers: ['Gargoyles', 'Skeletons'] },
  { provinces: [24, 26], offers: ['Grimhides', 'Wyverns'] },
  { provinces: [25], offers: ['Gargoyles', 'Lizards'] },
  { provinces: [28], offers: ['Gargoyles', 'Wyverns'] },
  { provinces: [29], offers: ['Grimhides', 'Gargoyles'] },
];

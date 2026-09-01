import type { ArtifactParams } from '@/core/domain/Artifact';

export const ARTIFACT_FIND_CHANCE = 0.25;

export const ARTIFACTS: readonly ArtifactParams[] = [
  { name: 'Silver Sword', characteristic: 'war', bonus: 25 },
  { name: 'Sword of Fire', characteristic: 'war', bonus: 30 },
  { name: 'Sword of Victory', characteristic: 'war', bonus: 40 },
  { name: 'Scroll of the Planets', characteristic: 'intelligence', bonus: 25 },
  { name: 'Scroll of Knowledge', characteristic: 'intelligence', bonus: 30 },
  { name: 'Scroll of the Sages', characteristic: 'intelligence', bonus: 40 },
  { name: 'Moonstone', characteristic: 'charisma', bonus: 30 },
  { name: 'Dragon Jewel', characteristic: 'charisma', bonus: 40 },
];

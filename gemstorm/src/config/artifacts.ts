import type { ArtifactParams } from '@/core/domain/Artifact';

export const ARTIFACTS: readonly ArtifactParams[] = [
  { name: 'Argent Edge', characteristic: 'war', bonus: 25 },
  { name: 'Cinderbrand', characteristic: 'war', bonus: 30 },
  { name: 'Bannersteel', characteristic: 'war', bonus: 40 },
  { name: 'Astral Codex', characteristic: 'intelligence', bonus: 25 },
  { name: 'Sageleaf Tome', characteristic: 'intelligence', bonus: 30 },
  { name: 'Elderstar Codex', characteristic: 'intelligence', bonus: 40 },
  { name: 'Moonwell Charm', characteristic: 'charisma', bonus: 30 },
  { name: 'Dawnheart Pendant', characteristic: 'charisma', bonus: 40 },
];

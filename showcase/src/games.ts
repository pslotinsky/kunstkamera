import { type ProjectId, projectNames } from './projects';

interface GameConfig {
  readonly name: string;
  readonly developmentUrl: string;
  readonly developmentUrlOverride: string;
  readonly publishedPath: string;
}

export const games: Partial<Record<ProjectId, GameConfig>> = {
  gemstorm: {
    name: projectNames.gemstorm,
    developmentUrl: 'http://localhost:5174/',
    developmentUrlOverride: 'VITE_GAME_URL',
    publishedPath: 'gemstorm/game/',
  },
};

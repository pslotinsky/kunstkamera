import { globSync } from 'node:fs';
import type { Config } from '@react-router/dev/config';
import { docs, sinkCityDocs, totalSpaceDocs } from './source.config.ts';
import { collectionNames } from './src/documentation/config.ts';
import { getDocumentPath } from './src/documentation/getDocumentPath.ts';
import { games } from './src/games.ts';
import { mapProjects } from './src/projects.ts';
import { getPrototypeUrl, prototypes } from './src/prototypes.ts';

const basename = process.env.SHOWCASE_BASE || '/kunstkamera/';
const collections = { docs, sinkCityDocs, totalSpaceDocs };

export default {
  appDirectory: 'src',
  buildDirectory: 'dist',
  basename,
  ssr: false,
  prerender() {
    const documentationPaths = mapProjects((project) => {
      const collection = collections[collectionNames[project]];
      const files = globSync(collection.docs.files || [], {
        cwd: collection.dir,
      });
      return [
        `/${project}/docs/`,
        ...files.map((file) => getDocumentPath(project, file)),
      ];
    });
    const paths = [
      '/',
      '/search.json',
      '/404/',
      ...Object.keys(games).map((project) => `/${project}/play/`),
      ...Object.values(documentationPaths).flat(),
      ...prototypes.map(getPrototypeUrl),
    ];
    return paths;
  },
} satisfies Config;

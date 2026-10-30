import { loader } from 'fumadocs-core/source';
import { docs, sinkCityDocs, totalSpaceDocs } from '../../.source/server';
import { mapProjects } from '../projects';
import { collectionNames } from './config';

const collections = { docs, sinkCityDocs, totalSpaceDocs };

export const sources = mapProjects((project) =>
  loader({
    baseUrl: `/${project}/docs`,
    source: collections[collectionNames[project]].toFumadocsSource(),
  }),
);

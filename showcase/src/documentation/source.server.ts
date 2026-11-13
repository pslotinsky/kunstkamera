import { loader } from 'fumadocs-core/source';
import {
  debtDungeonDocs,
  docs,
  kingdomHrDocs,
  sinkCityDocs,
  totalSpaceDocs,
} from '../../.source/server';
import { mapProjects } from '../projects';
import { collectionNames } from './config';

const collections = {
  debtDungeonDocs,
  docs,
  kingdomHrDocs,
  sinkCityDocs,
  totalSpaceDocs,
};

export const sources = mapProjects((project) =>
  loader({
    baseUrl: `/${project}/docs`,
    source: collections[collectionNames[project]].toFumadocsSource(),
  }),
);

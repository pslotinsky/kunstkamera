import { getDocumentPath } from './getDocumentPath';
import { source } from './source.server';
import type { DocumentSection, DocumentSummary } from './types';

const sectionDefinitions = [
  {
    directory: 'spec',
    title: 'Specification',
    description: 'Game rules, systems, scenarios, and reference data.',
  },
  {
    directory: 'design',
    title: 'Design',
    description: 'Detailed behavior for each feature of the remake.',
  },
  {
    directory: 'guides',
    title: 'Guides & references',
    description:
      'External manuals and other sources used during reconstruction.',
  },
  {
    directory: '',
    title: 'Roadmap',
    description: 'Completed features and planned work for the remake.',
  },
];

const documents = source
  .getPages()
  .map((page) => ({
    section: page.data.info.path.split('/').slice(0, -1).join('/'),
    summary: {
      file: page.data.info.path,
      title: page.data.title,
      url: getDocumentPath(page.data.info.path),
    } satisfies DocumentSummary,
  }))
  .sort((a, b) =>
    a.summary.file.localeCompare(b.summary.file, 'en', { numeric: true }),
  );

const sections: DocumentSection[] = sectionDefinitions.map(
  ({ directory, title, description }) => ({
    title,
    description,
    documents: documents
      .filter((page) => page.section === directory)
      .map((page) => page.summary),
  }),
);

const documentsByPath = new Map(
  documents.map(({ summary }) => [summary.file.replace(/\.md$/, ''), summary]),
);
const sectionTitleByFile = new Map(
  sections.flatMap((section) =>
    section.documents.map(
      (document) => [document.file, section.title] as const,
    ),
  ),
);

export function getDocumentationSections(): readonly DocumentSection[] {
  return sections;
}

export function getDocument(path: string): DocumentSummary | undefined {
  return documentsByPath.get(path.replace(/\/$/, ''));
}

export function getDocumentSectionTitle(file: string): string {
  const title = sectionTitleByFile.get(file);
  if (!title) throw new Error(`No documentation section for ${file}`);
  return title;
}

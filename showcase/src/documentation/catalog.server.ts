import { mapProjects, type ProjectId } from '../projects';
import { getDocumentPath } from './getDocumentPath';
import { sources } from './source.server';
import type { DocumentSection, DocumentSummary } from './types';

interface SectionDefinition {
  readonly title: string;
  readonly description: string;
  readonly includes: (file: string) => boolean;
}

const gameDesignSections: readonly SectionDefinition[] = [
  {
    title: 'Start here',
    description: 'The project vision and a map of the game design.',
    includes: (file) =>
      [
        'README.md',
        'game/README.md',
        'game/vision.md',
        'game/overview.md',
      ].includes(file),
  },
  {
    title: 'Systems',
    description:
      'Responsibilities, rules, proposals, and open questions for each system.',
    includes: (file) => file.startsWith('game/systems/'),
  },
  {
    title: 'Milestones',
    description: 'The prototype scope and development milestones.',
    includes: (file) => file.startsWith('game/milestones/'),
  },
  {
    title: 'Content',
    description:
      'Concrete authored content and explicitly labeled candidate collections.',
    includes: (file) => file.startsWith('game/content/'),
  },
  {
    title: 'Technical design',
    description: 'The software model and implementation constraints.',
    includes: (file) => file.startsWith('tech/'),
  },
  {
    title: 'UI references',
    description: 'Presentation notes and interactive experiments.',
    includes: (file) => file.startsWith('mockups/'),
  },
];

const sectionDefinitions: Record<ProjectId, readonly SectionDefinition[]> = {
  gemfire: [
    {
      title: 'Specification',
      description: 'Game rules, systems, scenarios, and reference data.',
      includes: (file) => file.startsWith('spec/'),
    },
    {
      title: 'Design',
      description: 'Detailed behavior for each feature of the remake.',
      includes: (file) => file.startsWith('design/'),
    },
    {
      title: 'Guides & references',
      description:
        'External manuals and other sources used during reconstruction.',
      includes: (file) => file.startsWith('guides/'),
    },
    {
      title: 'Roadmap',
      description: 'Completed features and planned work for the remake.',
      includes: (file) => file === 'ROADMAP.md',
    },
  ],
  'sink-city': [
    {
      title: 'С чего начать',
      description: 'Видение и обзор систем.',
      includes: (file) =>
        [
          'README.md',
          'game/README.md',
          'game/vision.md',
          'game/overview.md',
        ].includes(file),
    },
    {
      title: 'Системы',
      description: 'Строительство, прогрессия, город, власть, сюжет и цели.',
      includes: (file) => file.startsWith('game/systems/'),
    },
    {
      title: 'Этапы разработки',
      description: 'Границы прототипа и этапы развития игры.',
      includes: (file) => file.startsWith('game/milestones/'),
    },
    {
      title: 'Контент',
      description: 'Городские идеи и каталог участков.',
      includes: (file) => file.startsWith('game/content/'),
    },
    {
      title: 'Технический дизайн',
      description: 'Программная модель и ограничения реализации.',
      includes: (file) => file.startsWith('tech/'),
    },
    {
      title: 'Интерфейсы и прототипы',
      description: 'Редактор карты Map Lab.',
      includes: (file) => file.startsWith('mockups/'),
    },
  ],
  'total-space': gameDesignSections,
};

const startingOrder = [
  'README.md',
  'game/README.md',
  'game/vision.md',
  'game/overview.md',
];

function createCatalog(project: ProjectId) {
  const documents = sources[project]
    .getPages()
    .map(
      (page) =>
        ({
          file: page.data.info.path,
          title: page.data.title,
          url: getDocumentPath(project, page.data.info.path),
        }) satisfies DocumentSummary,
    )
    .sort((a, b) => {
      const aStart = startingOrder.indexOf(a.file);
      const bStart = startingOrder.indexOf(b.file);
      if (aStart !== -1 || bStart !== -1)
        return (
          (aStart === -1 ? Infinity : aStart) -
          (bStart === -1 ? Infinity : bStart)
        );
      return a.file.localeCompare(b.file, 'en', { numeric: true });
    });

  const sections: DocumentSection[] = sectionDefinitions[project]
    .map((definition) => ({
      title: definition.title,
      description: definition.description,
      documents: documents.filter((page) => definition.includes(page.file)),
    }))
    .filter((section) => section.documents.length > 0);
  const grouped = new Set(
    sections.flatMap((section) => section.documents.map((page) => page.file)),
  );
  const ungrouped = documents.filter((page) => !grouped.has(page.file));
  if (ungrouped.length) {
    throw new Error(
      `Uncategorized ${project} documents: ${ungrouped.map((page) => page.file).join(', ')}`,
    );
  }

  return {
    sections,
    documentsByPath: new Map(
      documents.map((page) => [page.file.replace(/\.md$/, ''), page]),
    ),
    sectionTitleByFile: new Map(
      sections.flatMap((section) =>
        section.documents.map((page) => [page.file, section.title] as const),
      ),
    ),
  };
}

const catalogs = mapProjects(createCatalog);

export function getDocumentationSections(
  project: ProjectId,
): readonly DocumentSection[] {
  return catalogs[project].sections;
}

export function getDocument(
  project: ProjectId,
  path: string,
): DocumentSummary | undefined {
  return catalogs[project].documentsByPath.get(path.replace(/\/$/, ''));
}

export function getDocumentSectionTitle(
  project: ProjectId,
  file: string,
): string {
  const title = catalogs[project].sectionTitleByFile.get(file);
  if (!title) throw new Error(`No documentation section for ${file}`);
  return title;
}

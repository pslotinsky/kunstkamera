import { DocsBody } from 'fumadocs-ui/layouts/docs/page';
import defaultComponents from 'fumadocs-ui/mdx';
import { PageTitle } from '../../../components/PageTitle';
import type { DocumentSummary } from '../../../documentation';
import { browserCollections } from '../../../documentation/browser';
import { mapProjects, type ProjectId } from '../../../projects';
import { FocusedDocsPage } from '../FocusedDocsPage';
import { DocumentImage } from './DocumentImage';
import { DocumentLink } from './DocumentLink';
import { MermaidDiagram } from './MermaidDiagram';

interface ReaderProps {
  readonly page: DocumentSummary;
  readonly project: ProjectId;
}

function createReader(
  collection: Pick<
    (typeof browserCollections)[ProjectId],
    'createClientLoader'
  >,
) {
  return collection.createClientLoader<ReaderProps>({
    component({ default: MDX, toc }, { page, project }) {
      return (
        <FocusedDocsPage toc={toc.filter((heading) => heading.depth > 1)}>
          <PageTitle title={page.title} />
          <DocsBody>
            <MDX
              components={{
                ...defaultComponents,
                Mermaid: MermaidDiagram,
                a: (props) => (
                  <DocumentLink
                    {...props}
                    project={project}
                    currentFile={page.file}
                  />
                ),
                img: (props) => (
                  <DocumentImage
                    {...props}
                    project={project}
                    currentFile={page.file}
                  />
                ),
              }}
            />
          </DocsBody>
        </FocusedDocsPage>
      );
    },
  });
}

const readers = mapProjects((project) =>
  createReader(browserCollections[project]),
);

export function DocumentReader({ page, project }: ReaderProps) {
  return readers[project].useContent(page.file, { page, project });
}

export function preloadDocument(project: ProjectId, file: string) {
  return readers[project].preload(file);
}

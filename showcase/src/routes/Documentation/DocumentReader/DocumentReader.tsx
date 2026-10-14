import { DocsBody } from 'fumadocs-ui/layouts/docs/page';
import defaultComponents from 'fumadocs-ui/mdx';
import { PageTitle } from '../../../components/PageTitle';
import type { DocumentSummary } from '../../../documentation';
import { browserCollections } from '../../../documentation/browser';
import { FocusedDocsPage } from '../FocusedDocsPage';
import { DocumentLink } from './DocumentLink';
import { MermaidDiagram } from './MermaidDiagram';

const clientLoader = browserCollections.docs.createClientLoader<{
  page: DocumentSummary;
}>({
  component({ default: MDX, toc }, { page }) {
    return (
      <FocusedDocsPage toc={toc.filter((heading) => heading.depth > 1)}>
        <PageTitle title={page.title} />
        <DocsBody>
          <MDX
            components={{
              ...defaultComponents,
              Mermaid: MermaidDiagram,
              a: (props) => <DocumentLink {...props} currentFile={page.file} />,
            }}
          />
        </DocsBody>
      </FocusedDocsPage>
    );
  },
});

export function DocumentReader({ page }: { readonly page: DocumentSummary }) {
  return clientLoader.useContent(page.file, { page });
}

export function preloadDocument(file: string) {
  return clientLoader.preload(file);
}

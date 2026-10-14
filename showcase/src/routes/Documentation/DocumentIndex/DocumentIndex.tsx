import { Card, Cards } from 'fumadocs-ui/components/card';
import { DocsBody, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { PageTitle } from '../../../components/PageTitle';
import type { DocumentSection } from '../../../documentation';
import { FocusedDocsPage } from '../FocusedDocsPage';

export function DocumentIndex({
  sections,
}: {
  readonly sections: readonly DocumentSection[];
}) {
  return (
    <FocusedDocsPage
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
    >
      <PageTitle title="Gemfire documentation" />
      <DocsTitle>Gemfire documentation</DocsTitle>
      <DocsBody>
        <p>
          Choose an area to explore. Browse individual articles in the sidebar.
        </p>
        <Cards>
          {sections.map((section) => {
            const first = section.documents[0];
            if (!first) return null;
            return (
              <Card
                key={section.title}
                href={first.url}
                title={section.title}
                description={section.description}
              >
                Start with {first.title}
              </Card>
            );
          })}
        </Cards>
      </DocsBody>
    </FocusedDocsPage>
  );
}

import { Card, Cards } from 'fumadocs-ui/components/card';
import { DocsBody, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { PageTitle } from '../../../components/PageTitle';
import type { DocumentSection } from '../../../documentation';
import { type ProjectId, projectNames } from '../../../projects';
import { FocusedDocsPage } from '../FocusedDocsPage';

export function DocumentIndex({
  project,
  sections,
}: {
  readonly project: ProjectId;
  readonly sections: readonly DocumentSection[];
}) {
  const title = `${projectNames[project]} documentation`;
  return (
    <FocusedDocsPage
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
    >
      <PageTitle title={title} />
      <DocsTitle>{title}</DocsTitle>
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
                id={section.title.toLowerCase().replace(/\W+/g, '-')}
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

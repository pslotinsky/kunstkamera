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
  const russian = project === 'sink-city';
  const title = russian
    ? `${projectNames[project]} — документация`
    : `${projectNames[project]} documentation`;
  return (
    <FocusedDocsPage
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
    >
      <PageTitle title={title} />
      <DocsTitle>{title}</DocsTitle>
      <DocsBody>
        {!russian && (
          <p>
            Choose an area to explore. Browse individual articles in the
            sidebar.
          </p>
        )}
        <Cards>
          {sections.map((section) => {
            const first = section.documents[0];
            if (!first) return null;
            return (
              <Card
                id={section.title
                  .toLowerCase()
                  .replace(/[^\p{L}\p{N}]+/gu, '-')}
                key={section.title}
                href={first.url}
                title={section.title}
                description={section.description}
              >
                {!russian && <>Start with {first.title}</>}
              </Card>
            );
          })}
        </Cards>
      </DocsBody>
    </FocusedDocsPage>
  );
}

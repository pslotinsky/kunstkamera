import { useLoaderData } from 'react-router';
import { PageTitle } from '../../components/PageTitle';
import { games } from '../../games';
import { mapProjects, projectNames } from '../../projects';
import { getPrototypeUrl, prototypes } from '../../prototypes';
import { FocusedDocsPage } from '../Documentation/FocusedDocsPage';
import styles from './DocumentationIndex.module.scss';
import { ProjectCard } from './ProjectCard';
import { projectPresentations } from './projectPresentations';

export function loader() {
  return Object.values(
    mapProjects((project) => ({
      id: project,
      name: projectNames[project],
      links: [
        ...(games[project]
          ? [
              {
                title: `Play ${projectNames[project]}`,
                url: `/${project}/play/`,
              },
            ]
          : []),
        { title: 'Documentation', url: `/${project}/docs/` },
        ...prototypes
          .filter((prototype) => prototype.project === project)
          .map((prototype) => ({
            title: `${prototype.name} prototype`,
            url: getPrototypeUrl(prototype),
          })),
      ],
    })),
  );
}

export default function DocumentationIndex() {
  const projects = useLoaderData<typeof loader>();
  return (
    <FocusedDocsPage
      full
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
    >
      <PageTitle title="Kunstkamera" />
      <div className={styles.projects}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            {...projectPresentations[project.id]}
            name={project.name}
            links={project.links}
          />
        ))}
      </div>
    </FocusedDocsPage>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from '../ErrorPage';

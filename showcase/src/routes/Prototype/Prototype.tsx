import { type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { Page } from '../../components/Page';
import { projectNames } from '../../projects';
import { getPrototype } from '../../prototypes';
import styles from './Prototype.module.scss';

export function loader({ params }: LoaderFunctionArgs) {
  const prototype = getPrototype(params.project, params.prototype);
  if (!prototype) throw new Response('Prototype not found', { status: 404 });
  return {
    title: `${prototype.name} prototype`,
    projectName: projectNames[prototype.project],
    publishedPath: prototype.publishedPath,
  };
}

export default function Prototype() {
  const { title, projectName, publishedPath } = useLoaderData<typeof loader>();
  return (
    <Page
      title={`${title} · ${projectName}`}
      fullWidth
      className={styles.container}
    >
      <h1 className={styles.pageTitle}>{title}</h1>
      <iframe
        className={styles.frame}
        src={`${import.meta.env.BASE_URL}${publishedPath}`}
        title={`${projectName} ${title.toLowerCase()}`}
      />
    </Page>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from '../ErrorPage';

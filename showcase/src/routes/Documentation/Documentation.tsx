import { Suspense } from 'react';
import {
  type ClientLoaderFunctionArgs,
  type LoaderFunctionArgs,
  useLoaderData,
} from 'react-router';
import { hasPublishedDocument } from '../../documentation/browser';
import {
  getDocument,
  getDocumentationSections,
} from '../../documentation/catalog.server';
import { isProjectId } from '../../projects';
import { DocumentIndex } from './DocumentIndex';
import { DocumentReader, preloadDocument } from './DocumentReader';

export function loader({ params }: LoaderFunctionArgs) {
  if (!isProjectId(params.project))
    throw new Response('Project not found', { status: 404 });
  const project = params.project;
  const path = params['*'] || '';
  if (!path) {
    return {
      kind: 'index' as const,
      project,
      sections: getDocumentationSections(project),
    };
  }

  const page = getDocument(project, path);
  if (!page) throw new Response('Document not found', { status: 404 });
  return { kind: 'document' as const, project, page };
}
export default function DocumentationRoute() {
  const data = useLoaderData<typeof loader>();
  if (data.kind === 'index')
    return <DocumentIndex project={data.project} sections={data.sections} />;

  return (
    <Suspense
      key={`${data.project}/${data.page.file}`}
      fallback={<p role="status">Loading document…</p>}
    >
      <DocumentReader project={data.project} page={data.page} />
    </Suspense>
  );
}

export async function clientLoader({
  params,
  serverLoader,
}: ClientLoaderFunctionArgs) {
  if (!isProjectId(params.project))
    throw new Response('Project not found', { status: 404 });
  if (params['*'] && !hasPublishedDocument(params.project, params['*'])) {
    throw new Response('Document not found', { status: 404 });
  }
  const data = await serverLoader<typeof loader>();
  if (data.kind === 'document')
    await preloadDocument(data.project, data.page.file);
  return data;
}

export { RouteErrorBoundary as ErrorBoundary } from '../ErrorPage';

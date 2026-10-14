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
import { DocumentIndex } from './DocumentIndex';
import { DocumentReader, preloadDocument } from './DocumentReader';

export function loader({ params }: LoaderFunctionArgs) {
  const path = params['*'] || '';
  if (!path) {
    return { kind: 'index' as const, sections: getDocumentationSections() };
  }

  const page = getDocument(path);
  if (!page) throw new Response('Document not found', { status: 404 });
  return { kind: 'document' as const, page };
}
export default function DocumentationRoute() {
  const data = useLoaderData<typeof loader>();
  if (data.kind === 'index') return <DocumentIndex sections={data.sections} />;

  return (
    <Suspense
      key={data.page.file}
      fallback={<p role="status">Loading document…</p>}
    >
      <DocumentReader page={data.page} />
    </Suspense>
  );
}

export async function clientLoader({
  params,
  serverLoader,
}: ClientLoaderFunctionArgs) {
  if (params['*'] && !hasPublishedDocument(params['*'])) {
    throw new Response('Document not found', { status: 404 });
  }
  const data = await serverLoader<typeof loader>();
  if (data.kind === 'document') await preloadDocument(data.page.file);
  return data;
}

export { RouteErrorBoundary as ErrorBoundary } from '../ErrorPage';

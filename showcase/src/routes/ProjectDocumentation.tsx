import { type LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router';
import { ProjectLayout } from '../components/ProjectLayout';
import { getProjectTree } from '../getProjectTree.server';
import { isProjectId } from '../projects';

export function loader({ params }: LoaderFunctionArgs) {
  if (!isProjectId(params.project))
    throw new Response('Project not found', { status: 404 });
  return getProjectTree(params.project);
}

export default function ProjectDocumentation() {
  return (
    <ProjectLayout tree={useLoaderData<typeof loader>()}>
      <Outlet />
    </ProjectLayout>
  );
}

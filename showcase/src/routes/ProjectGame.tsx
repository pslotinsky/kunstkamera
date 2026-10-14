import { Outlet, useLoaderData } from 'react-router';
import { ProjectLayout } from '../components/ProjectLayout';
import { getProjectTree } from '../getProjectTree.server';

export const loader = getProjectTree;

export default function ProjectGame() {
  return (
    <ProjectLayout tree={useLoaderData<typeof loader>()} game>
      <Outlet />
    </ProjectLayout>
  );
}

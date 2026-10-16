import { Outlet, useLoaderData } from 'react-router';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { getNavigationTree } from '../getNavigationTree.server';

export function loader() {
  return getNavigationTree();
}

export default function InteractiveLayout() {
  return (
    <ShowcaseLayout tree={useLoaderData<typeof loader>()} immersive>
      <Outlet />
    </ShowcaseLayout>
  );
}

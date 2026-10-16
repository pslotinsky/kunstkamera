import { Outlet, useLoaderData } from 'react-router';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { getNavigationTree } from '../getNavigationTree.server';

export function loader() {
  return getNavigationTree();
}

export default function DocumentationLayout() {
  return (
    <ShowcaseLayout tree={useLoaderData<typeof loader>()}>
      <Outlet />
    </ShowcaseLayout>
  );
}

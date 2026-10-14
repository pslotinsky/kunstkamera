import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ErrorPage } from './ErrorPage';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <ErrorPage
      title={notFound ? 'Page not found' : 'Page unavailable'}
      message={
        notFound
          ? 'This address does not match a page on this showcase.'
          : 'Please reload the page and try again.'
      }
    />
  );
}

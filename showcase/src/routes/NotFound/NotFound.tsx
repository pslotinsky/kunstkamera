import { ErrorPage } from '../ErrorPage';
export default function NotFound() {
  return (
    <ErrorPage
      title="Page not found"
      message="This address does not match a page on this showcase."
    />
  );
}

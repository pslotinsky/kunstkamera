import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Link } from 'react-router';
import { Page } from '../../components/Page';

interface ErrorPageProps {
  readonly title: string;
  readonly message: string;
}

export function ErrorPage({ title, message }: ErrorPageProps) {
  return (
    <Page title={title}>
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className={buttonVariants({ variant: 'secondary' })} to="/">
        Back to home
      </Link>
    </Page>
  );
}

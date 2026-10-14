import { RootProvider } from 'fumadocs-ui/provider/react-router';
import { lazy, type ReactNode } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from 'react-router';
import { FrameworkLink } from './components/FrameworkLink';
import './root.css';

const DocumentationSearch = lazy(() =>
  import('./components/DocumentationSearch').then(
    ({ DocumentationSearch }) => ({ default: DocumentationSearch }),
  ),
);

export function Layout({ children }: { readonly children: ReactNode }) {
  const searchEnabled = /\/gemfire\/docs(?:\/|$)/.test(useLocation().pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <RootProvider
          components={{ Link: FrameworkLink }}
          theme={{ defaultTheme: 'dark', forcedTheme: 'dark' }}
          search={{ enabled: searchEnabled, SearchDialog: DocumentationSearch }}
        >
          {children}
        </RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export { RouteErrorBoundary as ErrorBoundary } from './routes/ErrorPage';

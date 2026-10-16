import { type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { Page } from '../../components/Page';
import { games } from '../../games';
import { isProjectId } from '../../projects';
import styles from './Game.module.scss';

export function loader({ params }: LoaderFunctionArgs) {
  if (!isProjectId(params.project))
    throw new Response('Game not found', { status: 404 });
  const game = games[params.project];
  if (!game) throw new Response('Game not found', { status: 404 });
  return game;
}

function getGameUrl(game: ReturnType<typeof loader>): string {
  if (import.meta.env.DEV)
    return import.meta.env[game.developmentUrlOverride] || game.developmentUrl;
  return `${import.meta.env.BASE_URL}${game.publishedPath}`;
}

export default function Game() {
  const game = useLoaderData<typeof loader>();
  const title = `Play ${game.name}`;

  return (
    <Page title={title} fullWidth className={styles.container}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <div className={styles.stage}>
        <iframe
          id="game"
          className={styles.frame}
          src={getGameUrl(game)}
          title={`${game.name} game`}
          allow="autoplay"
        />
      </div>
    </Page>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from '../ErrorPage';

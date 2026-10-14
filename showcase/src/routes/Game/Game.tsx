import { Page } from '../../components/Page';
import styles from './Game.module.scss';

function getGameUrl(): string {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_GAME_URL || 'http://localhost:5174/';
  }
  return `${import.meta.env.BASE_URL}gemfire/game/`;
}

export default function Game() {
  const gameUrl = getGameUrl();

  return (
    <Page title="Play Gemfire" fullWidth className={styles.container}>
      <h1 className={styles.pageTitle}>Play Gemfire</h1>
      <div className={styles.stage}>
        <iframe
          id="game"
          className={styles.frame}
          src={gameUrl}
          title="Gemfire game"
          allow="autoplay"
        />
      </div>
    </Page>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from '../ErrorPage';

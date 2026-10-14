import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Link } from 'react-router';
import gemfireMap from '../../../../gemfire/src/assets/map.webp';
import { Page } from '../../components/Page';
import styles from './Home.module.scss';

export default function Home() {
  return (
    <Page title="Kunstkamera" className={styles.container}>
      <header className={styles.intro}>
        <h1>Projects</h1>
        <p>Play the games and explore how they are made.</p>
      </header>
      <article className={styles.project}>
        <img
          className={styles.preview}
          src={gemfireMap}
          alt="Map of Ishmeria from Gemfire"
        />
        <div className={styles.details}>
          <p className={styles.label}>Turn-based strategy</p>
          <h2>Gemfire</h2>
          <p>
            Develop provinces, command armies, and fight for Ishmeria in a
            browser remake of Koei’s strategy game.
          </p>
          <div className={styles.actions}>
            <Link
              className={buttonVariants({ variant: 'primary' })}
              to="/gemfire/play/"
            >
              Play Gemfire
            </Link>
            <Link
              className={buttonVariants({ variant: 'outline' })}
              to="/gemfire/docs/"
            >
              Documentation
            </Link>
          </div>
        </div>
      </article>
    </Page>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from '../ErrorPage';

import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Link } from 'react-router';
import gemfireMap from '../../../../gemfire/src/assets/map.webp';
import fleetCarrier from '../../../../total-space/docs/game/content/ships/images/14-fleet-carrier.webp';
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
      <article className={styles.project}>
        <img
          className={`${styles.preview} ${styles.shipPreview}`}
          src={fleetCarrier}
          alt="Total Space fleet carrier concept art"
        />
        <div className={styles.details}>
          <p className={styles.label}>Space strategy</p>
          <h2>Total Space</h2>
          <p>
            Explore the game design and try interactive concepts for the
            campaign and fleet battles.
          </p>
          <div className={styles.actions}>
            <Link
              className={buttonVariants({ variant: 'primary' })}
              to="/total-space/docs/"
            >
              Documentation
            </Link>
            <Link
              className={buttonVariants({ variant: 'outline' })}
              to="/total-space/prototypes/campaign/"
            >
              Campaign prototype
            </Link>
            <Link
              className={buttonVariants({ variant: 'outline' })}
              to="/total-space/prototypes/battle/"
            >
              Battle prototype
            </Link>
          </div>
        </div>
      </article>
    </Page>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from '../ErrorPage';

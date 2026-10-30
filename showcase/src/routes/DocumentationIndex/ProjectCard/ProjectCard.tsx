import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Link } from 'react-router';
import styles from './ProjectCard.module.scss';

export interface ProjectCardProps {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly imageFit?: 'cover' | 'contain';
  readonly imageScale?: number;
  readonly links: readonly { title: string; url: string }[];
}

export function ProjectCard({
  name,
  label,
  description,
  image,
  imageAlt,
  imageFit,
  imageScale = 1,
  links,
}: ProjectCardProps) {
  return (
    <article className={styles.card} data-has-image={Boolean(image)}>
      {image && (
        <div className={styles.preview} data-fit={imageFit}>
          <img
            src={image}
            alt={imageAlt}
            style={{ transform: `scale(${imageScale})` }}
          />
        </div>
      )}
      <div className={styles.details}>
        <p className={styles.label}>{label}</p>
        <h2>{name}</h2>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          {links.map((link, index) => (
            <Link
              key={link.url}
              to={link.url}
              className={buttonVariants({
                variant: index === 0 ? 'primary' : 'outline',
              })}
            >
              {link.title}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

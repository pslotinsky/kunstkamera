import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Link } from 'react-router';
import styles from './ProjectCard.module.scss';

export interface ProjectCardProps {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly imageFit: 'cover' | 'contain';
  readonly links: readonly { title: string; url: string }[];
}

export function ProjectCard({
  name,
  label,
  description,
  image,
  imageAlt,
  imageFit,
  links,
}: ProjectCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.preview} data-fit={imageFit}>
        <img src={image} alt={imageAlt} />
      </div>
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

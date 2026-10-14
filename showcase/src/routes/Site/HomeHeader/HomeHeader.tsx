import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import styles from './HomeHeader.module.scss';

export function HomeHeader(props: ComponentProps<'header'>) {
  return (
    <header
      {...props}
      className={[styles.header, props.className].filter(Boolean).join(' ')}
    >
      <Link to="/">Kunstkamera</Link>
    </header>
  );
}

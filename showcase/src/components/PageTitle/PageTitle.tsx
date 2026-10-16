interface PageTitleProps {
  readonly title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  return (
    <title>{title === 'Kunstkamera' ? title : `${title} · Kunstkamera`}</title>
  );
}

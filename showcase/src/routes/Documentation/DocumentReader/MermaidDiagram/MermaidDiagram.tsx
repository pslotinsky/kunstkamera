import styles from './MermaidDiagram.module.scss';
import { useMermaid } from './useMermaid';

interface MermaidDiagramProps {
  readonly chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const container = useMermaid(chart);
  return (
    <pre ref={container} className={styles.diagram}>
      {chart}
    </pre>
  );
}

import type { Mermaid } from 'mermaid';
import { type RefObject, useEffect, useRef } from 'react';

let renderer: Promise<Mermaid> | undefined;

function loadMermaid(): Promise<Mermaid> {
  renderer ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict',
      suppressErrorRendering: true,
    });
    return mermaid;
  });
  return renderer;
}

let diagramSequence = 0;

export function useMermaid(source: string): RefObject<HTMLPreElement | null> {
  const container = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const element = container.current;
    let cancelled = false;
    if (element) {
      element.textContent = source;
      delete element.dataset.rendered;
      const id = `diagram-${++diagramSequence}`;
      void loadMermaid()
        .then(async (mermaid) => {
          if (!cancelled) {
            const result = await mermaid.render(id, source);
            if (!cancelled) {
              element.innerHTML = result.svg;
              element.dataset.rendered = 'true';
              result.bindFunctions?.(element);
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            element.textContent = source;
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [source]);

  return container;
}

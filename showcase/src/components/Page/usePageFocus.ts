import { type RefObject, useEffect } from 'react';
import { useNavigationType } from 'react-router';

export function usePageFocus(content: RefObject<HTMLElement | null>): void {
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP')
      content.current?.focus({ preventScroll: true });
  }, [navigationType, content]);
}

import { type RefObject, useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';

export function usePageFocus(content: RefObject<HTMLElement | null>): void {
  const navigationType = useNavigationType();
  const { pathname } = useLocation();
  const previousPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    const pageChanged = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (pageChanged && navigationType !== 'POP')
      content.current?.focus({ preventScroll: true });
  }, [navigationType, content, pathname]);
}

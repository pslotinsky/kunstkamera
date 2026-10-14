import { type RefObject, useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router';

export function useDocumentFragment(
  content: RefObject<HTMLElement | null>,
): void {
  const { hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP' || !hash || window.scrollY !== 0) return;

    try {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target && content.current?.contains(target)) target.scrollIntoView();
    } catch {
      // Ignore malformed fragments, as the browser does.
    }
  }, [content, hash, navigationType]);
}

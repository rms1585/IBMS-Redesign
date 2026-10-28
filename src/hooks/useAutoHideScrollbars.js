import { useEffect } from 'react';

const VISIBLE_FOR_MS = 900;

// Scrollbars are transparent by default (see MuiCssBaseline in the theme). While an element
// scrolls it gets the `is-scrolling` class, which reveals its scrollbar, and the class is
// removed shortly after scrolling stops.
export default function useAutoHideScrollbars() {
  useEffect(() => {
    const timers = new WeakMap();
    const onScroll = (event) => {
      const el = event.target === document ? document.documentElement : event.target;
      if (!(el instanceof Element)) return;
      el.classList.add('is-scrolling');
      clearTimeout(timers.get(el));
      timers.set(el, setTimeout(() => el.classList.remove('is-scrolling'), VISIBLE_FOR_MS));
    };
    // Scroll events don't bubble, so listen in the capture phase to see every scroller.
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, []);
}

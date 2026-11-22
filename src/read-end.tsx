import { useEffect, useRef } from 'react';

export function ReadEnd({ enabled, onReach }: { enabled: boolean; onReach: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  const callback = useRef(onReach);
  useEffect(() => { callback.current = onReach; }, [onReach]);

  useEffect(() => {
    if (!enabled || !end.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio === 1)) {
        observer.disconnect();
        callback.current();
      }
    }, { threshold: 1 });
    observer.observe(end.current);
    return () => observer.disconnect();
  }, [enabled]);

  return <div className="reading-end" ref={end} aria-hidden="true"/>;
}

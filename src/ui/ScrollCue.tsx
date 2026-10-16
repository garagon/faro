import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

const edge =
  'pointer-events-none absolute top-0 bottom-px grid w-12 items-center text-muted-foreground';

/**
 * A strip that scrolls sideways when it does not fit (tabs on a phone) says so: a fade with a
 * chevron at each edge that hides more. The first child is the scrolling element.
 */
export function ScrollCue({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const measure = () => {
    const strip = ref.current?.firstElementChild;
    if (!(strip instanceof HTMLElement)) return;
    const start = strip.scrollLeft > 1;
    const end = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;
    setEdges((e) => (e.start === start && e.end === end ? e : { start, end }));
  };
  // Labels can change (a count arrives): measure after every render, it is cheap.
  useEffect(measure);
  useEffect(() => {
    const strip = ref.current?.firstElementChild;
    if (!(strip instanceof HTMLElement)) return;
    strip.addEventListener('scroll', measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(strip);
    return () => {
      strip.removeEventListener('scroll', measure);
      resize.disconnect();
    };
  }, []);
  return (
    <div className="relative min-w-0" ref={ref}>
      {children}
      {edges.start && (
        <span
          className={`${edge} start-0 justify-items-start bg-linear-to-l from-transparent to-background to-65%`}
          data-side="start"
          aria-hidden="true"
        >
          <ChevronLeftIcon className="size-4" />
        </span>
      )}
      {edges.end && (
        <span
          className={`${edge} end-0 justify-items-end bg-linear-to-r from-transparent to-background to-65%`}
          data-side="end"
          aria-hidden="true"
        >
          <ChevronRightIcon className="size-4" />
        </span>
      )}
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

/**
 * A strip that scrolls sideways when it does not fit (tabs on a phone) says so: a fade with a
 * caret at each edge that hides more. The first child is the scrolling element.
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
    <div className="f-scroll-cue" ref={ref}>
      {children}
      {edges.start && (
        <span className="f-scroll-edge" data-side="start" aria-hidden="true">
          <CaretLeftIcon size={16} weight="bold" />
        </span>
      )}
      {edges.end && (
        <span className="f-scroll-edge" data-side="end" aria-hidden="true">
          <CaretRightIcon size={16} weight="bold" />
        </span>
      )}
    </div>
  );
}

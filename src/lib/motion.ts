/** Smooth scrolling, unless the person asked their device for reduced motion. */
export function scrollMotion(): ScrollBehavior {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}

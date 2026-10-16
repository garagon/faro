import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { ScrollCue } from '../ui/index.ts';

export type HomeTab = { id: string; label: string; content: ReactNode };

/**
 * The detail pages of Situación (earthquakes, tsunami, cyclones, alerts), one panel at a time.
 * Drawn with the design system's tab strip (`f-tabs`), which scrolls on a phone with a cue at
 * the hidden edge. It keeps its own buttons because the app focuses `#fw-tab-<id>` when it opens
 * a tab, and each tab names the panel it controls. Arrow keys, Home and End move between tabs.
 * Labels are one short word with no count (counts go in the panel's list title), so the four tabs
 * fit from 360 px; narrower, the strip scrolls with its cue.
 */
export default function HomeTabs({
  label,
  tabs,
  active,
  onChange,
}: {
  label: string;
  tabs: HomeTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];
  // On a narrow screen the strip scrolls sideways: keep the selected tab in view without moving
  // the page.
  useEffect(() => {
    const tab = refs.current[current.id];
    const strip = tab?.parentElement;
    if (!tab || !strip) return;
    const start = tab.offsetLeft - strip.offsetLeft;
    if (start < strip.scrollLeft || start + tab.offsetWidth > strip.scrollLeft + strip.clientWidth)
      strip.scrollLeft = Math.max(0, start - (strip.clientWidth - tab.offsetWidth) / 2);
  }, [current.id]);
  function onKey(e: KeyboardEvent<HTMLButtonElement>) {
    const at = tabs.findIndex((tab) => tab.id === current.id);
    const next =
      e.key === 'ArrowRight'
        ? tabs[(at + 1) % tabs.length]
        : e.key === 'ArrowLeft'
          ? tabs[(at - 1 + tabs.length) % tabs.length]
          : e.key === 'Home'
            ? tabs[0]
            : e.key === 'End'
              ? tabs[tabs.length - 1]
              : null;
    if (!next) return;
    e.preventDefault();
    onChange(next.id);
    refs.current[next.id]?.focus();
  }
  return (
    <section className="f-stack" id="fw-detail">
      <ScrollCue>
        <div className="f-tabs" role="tablist" aria-label={label}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el;
              }}
              type="button"
              id={`fw-tab-${tab.id}`}
              role="tab"
              aria-selected={tab.id === current.id}
              aria-controls={`fw-panel-${tab.id}`}
              tabIndex={tab.id === current.id ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={onKey}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </ScrollCue>
      <div
        role="tabpanel"
        id={`fw-panel-${current.id}`}
        aria-labelledby={`fw-tab-${current.id}`}
        tabIndex={0}
      >
        {current.content}
      </div>
    </section>
  );
}

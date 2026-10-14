import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export type HomeTab = { id: string; label: string; count?: number; content: ReactNode };

/** Detail sections under the home, one at a time. Arrow keys move between tabs. */
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
    <section className="fw-home-tabs" id="fw-detail">
      <div className="fw-home-tablist" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            id={`fw-tab-${tab.id}`}
            role="tab"
            aria-selected={tab.id === current.id}
            aria-controls={`fw-panel-${tab.id}`}
            tabIndex={tab.id === current.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={onKey}
          >
            {tab.label}
            {tab.count !== undefined && <span>{tab.count}</span>}
          </button>
        ))}
      </div>
      <div
        className="fw-home-panel"
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

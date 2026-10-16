import type { ReactNode } from 'react';

/**
 * An index of the topics of one screen, in groups, beside the reading column on wide screens
 * (the guide's situations). The current topic is marked with aria-current. On phones the same
 * choice is a SelectField above the content.
 */
export function IndexNav<T extends string>({
  label,
  groups,
  value,
  onChange,
}: {
  label: string;
  groups: readonly {
    id: string;
    label: ReactNode;
    items: readonly { id: T; label: ReactNode }[];
  }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <nav className="f-index" aria-label={label}>
      {groups.map((g) => (
        <div key={g.id} className="f-index-group" role="group" aria-labelledby={`f-index-${g.id}`}>
          <span className="f-index-head" id={`f-index-${g.id}`}>
            {g.label}
          </span>
          {g.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="f-index-link f-pressable"
              aria-current={item.id === value ? 'true' : undefined}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

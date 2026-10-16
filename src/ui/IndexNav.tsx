import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/**
 * An index of the topics of one screen, in groups, beside the reading column on wide screens
 * (the guide's situations), drawn like shadcn's sidebar menu: ghost items, the current one
 * filled. The current topic is marked with aria-current. On phones the same choice is a
 * SelectField above the content.
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
    <nav className="grid gap-4" aria-label={label}>
      {groups.map((g) => (
        <div key={g.id} className="grid gap-0.5" role="group" aria-labelledby={`f-index-${g.id}`}>
          <span
            className="flex h-8 items-center px-2 text-xs font-medium text-muted-foreground"
            id={`f-index-${g.id}`}
          >
            {g.label}
          </span>
          {g.items.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              className="f-pressable h-auto min-h-9 w-full justify-start px-2 py-2 text-start font-normal whitespace-normal aria-[current=true]:bg-accent aria-[current=true]:font-medium aria-[current=true]:text-accent-foreground"
              aria-current={item.id === value ? 'true' : undefined}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      ))}
    </nav>
  );
}

import type { ReactNode } from 'react';
import { PhoneIcon } from 'lucide-react';
import { Button as UIButton } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { cn } from '@/lib/utils';
import { telHref } from '../lib/phone.ts';

/** "Emergencias" under "Call 911" adds nothing: only a note that says more is shown. */
const generic = (note: ReactNode) =>
  typeof note === 'string' && /^(emergencias|emergencies|emergências)$/i.test(note.trim());

/**
 * The call action: shadcn's destructive button, the only red in Faro, as wide as a phone at
 * most (26 rem), the same on every screen. A plain tel: link, so it works before any script and
 * while offline. `.f-call a` is the element screens focus. `xl` (64 px, larger type) is for the
 * screen used in a hurry, Emergencia; `lg` (48 px) everywhere else.
 */
export function CallButton({
  number,
  label,
  note,
  size = 'lg',
}: {
  number: string;
  /** "Llamar al 911" */
  label: ReactNode;
  /** What the number covers, under the button, e.g. "Policía, bomberos y ambulancia". */
  note?: ReactNode;
  size?: 'lg' | 'xl';
}) {
  return (
    <div className="f-call grid gap-2">
      <UIButton
        asChild
        variant="destructive"
        size="lg"
        className={cn(
          'f-pressable h-auto w-full max-w-104 justify-self-start whitespace-normal motion-reduce:transition-none',
          size === 'xl'
            ? "min-h-16 text-lg [&_svg:not([class*='size-'])]:size-5"
            : 'min-h-12 text-base',
        )}
      >
        <a href={telHref(number)}>
          <PhoneIcon aria-hidden="true" />
          {label}
        </a>
      </UIButton>
      {note && !generic(note) && <p className="m-0 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Another number, as a list row: the number first, who answers under it. */
export function PhoneRow({
  number,
  name,
  dial,
}: {
  /** As shown. */
  number: string;
  name: ReactNode;
  /** As dialled, when it differs from what is shown. */
  dial?: string;
}) {
  return (
    <li>
      <Item
        asChild
        size="sm"
        className="f-row f-pressable w-full hover:bg-accent/50 motion-reduce:transition-none"
      >
        <a href={telHref(dial ?? number)}>
          <ItemContent className="min-w-0">
            <ItemTitle className="text-base font-semibold tabular-nums">{number}</ItemTitle>
            <ItemDescription className="line-clamp-none">{name}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <PhoneIcon className="size-4 text-destructive" aria-hidden="true" />
          </ItemActions>
        </a>
      </Item>
    </li>
  );
}

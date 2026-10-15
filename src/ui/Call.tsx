import type { ReactNode } from 'react';
import { PhoneIcon } from '@phosphor-icons/react';
import { telHref } from '../lib/phone.ts';
import { ListRow } from './List.tsx';

/** "Emergencias" under "Call 911" adds nothing: only a note that says more is shown. */
const generic = (note: ReactNode) =>
  typeof note === 'string' && /^(emergencias|emergencies|emergências)$/i.test(note.trim());

/**
 * The call action: the large button in call red, as wide as a phone at most, the same on every
 * screen. A plain tel: link, so it works before any script and while offline.
 */
export function CallButton({
  number,
  label,
  note,
}: {
  number: string;
  /** "Llamar al 911" */
  label: ReactNode;
  /** What the number covers, under the button, e.g. "Policía, bomberos y ambulancia". */
  note?: ReactNode;
}) {
  return (
    <div className="f-call">
      <a className="f-button f-pressable" data-variant="call" data-size="lg" href={telHref(number)}>
        <PhoneIcon size={22} weight="fill" aria-hidden="true" />
        {label}
      </a>
      {note && !generic(note) && <p className="f-call-note">{note}</p>}
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
    <ListRow
      href={telHref(dial ?? number)}
      figure
      tone="call"
      title={number}
      meta={name}
      trail={<PhoneIcon size={20} weight="fill" aria-hidden="true" />}
    />
  );
}

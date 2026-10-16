import { writeLocal } from '../lib/browserStorage.ts';
import { useState } from 'react';
import {
  BedIcon,
  BookUserIcon,
  BriefcaseIcon,
  CarIcon,
  LandmarkIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  contactKinds,
  contactGroups,
  phoneHref,
  readContacts,
  type TravelContact,
  type ContactKind,
} from '../lib/tripData.ts';
import type { Lang } from '../lib/resources.ts';
import { newId } from '../lib/id.ts';
import { langIndex, pick } from '../lib/i18n.ts';
import { Button, Field, List, ListRow, Note, RowIcon, SelectField } from '../ui/index.ts';
import { caption } from '../lib/caption.ts';
const blank = { kind: 'hotel' as ContactKind, name: '', phone: '', note: '' };
// The kind's picture starts each saved contact, so the list shares the screen's text edge.
const kindIcons: Record<ContactKind, LucideIcon> = {
  family: UsersIcon,
  hotel: BedIcon,
  insurance: ShieldCheckIcon,
  consulate: LandmarkIcon,
  work: BriefcaseIcon,
  team: UsersIcon,
  transport: CarIcon,
  other: BookUserIcon,
};
/** Other people worth having at hand on this trip, beyond the emergency contact. */
export default function TravelContacts({ country, lang }: { country: string; lang: Lang }) {
  const [rows, setRows] = useState(readContacts),
    [draft, setDraft] = useState(blank),
    [editing, setEditing] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [notice, setNotice] = useState(''),
    [removed, setRemoved] = useState<TravelContact | null>(null);
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  // The editor's first field takes focus when it opens, as before, by its id.
  const focusName = () =>
    requestAnimationFrame(() => document.getElementById('fw-contact-name')?.focus());
  const local = rows.filter((r) => r.country === country),
    countryName =
      country === 'WORLD'
        ? t('un destino', 'a destination', 'um destino')
        : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  const persist = (next: TravelContact[]) => {
    try {
      writeLocal('faro-contacts-v1', JSON.stringify(next));
      setRows(next);
      return true;
    } catch {
      setNotice(
        t(
          'No se pudo guardar en este navegador.',
          'Could not save in this browser.',
          'Não foi possível salvar neste navegador.',
        ),
      );
      return false;
    }
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setNotice(
        t('Escribe el nombre del contacto.', 'Enter a contact name.', 'Escreva o nome do contato.'),
      );
      return;
    }
    if (!phoneHref(draft.phone)) {
      setNotice(
        t(
          'Revisa el teléfono: usa dígitos y, si corresponde, el prefijo + del país.',
          'Check the phone number: use digits and, where appropriate, the country + prefix.',
          'Confira o telefone: use dígitos e, se for o caso, o prefixo + do país.',
        ),
      );
      return;
    }
    if (!editing && rows.length >= 30) {
      setNotice(
        t(
          'Puedes guardar hasta 30 contactos. Elimina uno para continuar.',
          'You can save up to 30 contacts. Remove one to continue.',
          'Você pode salvar até 30 contatos. Exclua um para continuar.',
        ),
      );
      return;
    }
    const row = {
      ...draft,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      note: draft.note.trim(),
      country,
      id: editing || newId(),
    };
    if (persist(editing ? rows.map((r) => (r.id === editing ? row : r)) : [...rows, row])) {
      setOpen(false);
      setEditing(null);
      setDraft(blank);
      setRemoved(null);
      setNotice(
        t(
          'Contacto guardado en este navegador.',
          'Contact saved in this browser.',
          'Contato salvo neste navegador.',
        ),
      );
    }
  };
  const edit = (r: TravelContact) => {
    setDraft(r);
    setEditing(r.id);
    setOpen(true);
    setNotice('');
    focusName();
  };
  const remove = (r: TravelContact) => {
    if (persist(rows.filter((v) => v.id !== r.id))) {
      setRemoved(r);
      if (editing === r.id) {
        setOpen(false);
        setEditing(null);
        setDraft(blank);
      }
      setNotice(t('Contacto eliminado.', 'Contact deleted.', 'Contato excluído.'));
    }
  };
  const missing = (Object.keys(contactKinds) as ContactKind[]).filter(
    (kind) => kind !== 'other' && !local.some((row) => row.kind === kind),
  );
  const startContact = (kind: ContactKind) => {
    setDraft({ ...blank, kind });
    setEditing(null);
    setOpen(true);
    setNotice('');
    focusName();
  };
  // Adding is one pattern: a "+" row per kind, in two groups, and "Otro contacto" last, which
  // stays available once every kind is on the list. There is no separate add button.
  const addRow = (kind: ContactKind) => (
    <ListRow
      key={kind}
      lead={<RowIcon icon={<PlusIcon className="size-4" />} />}
      title={contactKinds[kind][langIndex(lang)]}
      trail=""
      onClick={() => startContact(kind)}
    />
  );
  const starterGroups = (personal: readonly ContactKind[], work: readonly ContactKind[]) => (
    <div className="f-stack grid gap-4">
      {[
        { id: 'personal', label: t('Personales', 'Personal', 'Pessoais'), kinds: personal },
        {
          id: 'work',
          label: t('Trabajo y misión', 'Work and assignment', 'Trabalho e missão'),
          kinds: work,
        },
      ]
        .filter((group) => group.kinds.length > 0)
        .map((group) => (
          <div
            key={group.id}
            className="f-stack grid gap-2"
            data-gap="sm"
            role="group"
            aria-labelledby={`contact-group-${group.id}`}
          >
            <div
              id={`contact-group-${group.id}`}
              className="f-section-aside text-sm text-muted-foreground data-[state=stale]:text-amber-900"
            >
              {group.label}
            </div>
            <List>{group.kinds.map(addRow)}</List>
          </div>
        ))}
      <List>{addRow('other')}</List>
    </div>
  );
  // Viaje places this section in its reading column (App.tsx).
  return (
    <section
      className="f-section @container grid gap-3"
      aria-label={t('Contactos del viaje', 'Travel contacts', 'Contatos da viagem')}
    >
      <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
        <h2 className="f-section-title m-0 text-base leading-snug font-semibold">
          {t('Otros contactos', 'Other contacts', 'Outros contatos')}
        </h2>
        <p>
          {t(
            `Recepción, consulado, seguro, empresa o quien quieras tener a mano en ${countryName}.`,
            `Reception, consulate, insurer, employer or anyone you want at hand in ${countryName}.`,
            `Recepção, consulado, seguro, empresa ou quem você quiser ter à mão nesta viagem (${countryName}).`,
          )}
        </p>
      </div>
      {country === 'WORLD' ? (
        <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
          <p>
            {t(
              'Selecciona un país para preparar los contactos de ese viaje.',
              'Select a country to prepare contacts for that trip.',
              'Selecione um país para preparar os contatos dessa viagem.',
            )}
          </p>
        </div>
      ) : (
        <div className="f-stack grid gap-4">
          <h3 className="sr-only">{t('Contactos', 'Contacts', 'Contatos')}</h3>
          {local.length > 0 ? (
            <List>
              {local.map((r) => (
                <ContactRow
                  key={r.id}
                  contact={r}
                  lang={lang}
                  onEdit={() => edit(r)}
                  onDelete={() => remove(r)}
                />
              ))}
            </List>
          ) : (
            !open && starterGroups(contactGroups.personal, contactGroups.work)
          )}
          {local.length > 0 && !open && (
            <div className="f-stack grid gap-2" data-gap="sm">
              <h3 className="f-subhead m-0 text-sm leading-snug font-medium">
                {t('Añade para este viaje', 'Add for this trip', 'Adicione para esta viagem')}
              </h3>
              {starterGroups(
                contactGroups.personal.filter((k) => missing.includes(k)),
                contactGroups.work.filter((k) => missing.includes(k)),
              )}
            </div>
          )}
          {open && (
            <form className="f-stack grid gap-4" onSubmit={save}>
              <h3 className="f-subhead m-0 text-sm leading-snug font-medium">
                {editing
                  ? t('Editar contacto', 'Edit contact', 'Editar contato')
                  : t('Nuevo contacto', 'New contact', 'Novo contato')}
              </h3>
              <SelectField
                id="fw-contact-kind"
                label={t('Tipo', 'Type', 'Tipo')}
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as ContactKind })}
              >
                {Object.entries(contactKinds).map(([key, value]) => (
                  <option value={key} key={key}>
                    {value[langIndex(lang)]}
                  </option>
                ))}
              </SelectField>
              <Field
                id="fw-contact-name"
                label={t('Nombre o entidad', 'Name or organization', 'Nome ou organização')}
                name="contact-name"
                autoComplete="off"
                required
                maxLength={100}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <Field
                id="fw-contact-phone"
                label={t('Teléfono', 'Phone', 'Telefone')}
                hint={t(
                  'Incluye el código del país si llamarás desde el extranjero. Comprueba horarios y cobertura con el contacto.',
                  'Include the country code when calling from abroad. Confirm hours and coverage with the contact.',
                  'Inclua o código do país se for ligar do exterior. Confirme horários e cobertura com o contato.',
                )}
                required
                type="tel"
                name="contact-phone"
                autoComplete="tel"
                maxLength={40}
                placeholder={t(
                  '+ código de país y número',
                  '+ country code and number',
                  '+ código do país e número',
                )}
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
              <Field
                id="fw-contact-note"
                label={t(
                  'Indicaciones · opcional',
                  'Instructions · optional',
                  'Instruções · opcional',
                )}
                name="contact-note"
                autoComplete="off"
                maxLength={300}
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" type="submit">
                  {t('Guardar contacto', 'Save contact', 'Salvar contato')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    setEditing(null);
                    setDraft(blank);
                    setNotice('');
                  }}
                >
                  {t('Cancelar', 'Cancel', 'Cancelar')}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
      {/* Always present, so a screen reader announces each change. */}
      <div role="status">{notice && <Note>{notice}</Note>}</div>
      {removed && (
        <Button
          variant="ghost"
          onClick={() => {
            if (rows.length < 30 && persist([...rows, removed])) {
              setRemoved(null);
              setNotice(t('Contacto restaurado.', 'Contact restored.', 'Contato restaurado.'));
            }
          }}
        >
          {t('Deshacer eliminación', 'Undo deletion', 'Desfazer exclusão')}
        </Button>
      )}
    </section>
  );
}

/**
 * A saved contact: the row calls (its kind's icon, the name, then kind and number), and under it,
 * at the text edge, the instructions and the two small actions to edit or delete it.
 */
function ContactRow({
  contact: r,
  lang,
  onEdit,
  onDelete,
}: {
  contact: TravelContact;
  lang: Lang;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const Icon = kindIcons[r.kind] ?? BookUserIcon;
  return (
    <li>
      <a
        className="f-row f-pressable"
        data-tone="call"
        href={phoneHref(r.phone)!}
        aria-label={`${t('Llamar a', 'Call', 'Ligar para')} ${r.name}: ${r.phone}`}
      >
        <span className="f-row-lead">
          <RowIcon icon={<Icon className="size-4" />} />
        </span>
        <span className="f-row-body">
          <span className="f-row-title">{r.name}</span>
          <span className="f-row-meta">
            {caption(contactKinds[r.kind][langIndex(lang)], r.phone)}
          </span>
        </span>
        <span className="f-row-trail">
          <PhoneIcon className="size-4" aria-hidden="true" />
        </span>
      </a>
      <div className="f-expand-body f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
        {r.note && <p className="f-caption m-0 text-sm text-muted-foreground">{r.note}</p>}
        {/* Actions on this contact: buttons, not links. */}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onEdit}>
            {t('Editar', 'Edit', 'Editar')}
          </Button>
          <Button
            variant="ghost"
            data-tone="error"
            aria-label={`${t('Eliminar', 'Delete', 'Excluir')} ${r.name}`}
            onClick={onDelete}
          >
            {t('Eliminar', 'Delete', 'Excluir')}
          </Button>
        </div>
      </div>
    </li>
  );
}

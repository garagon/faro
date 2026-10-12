import { writeLocal } from '../lib/browserStorage.ts';
import { useRef, useState } from 'react';
import { PhoneIcon, PlusIcon } from '@phosphor-icons/react';
import {
  contactKinds,
  contactGroups,
  phoneHref,
  readContacts,
  type TravelContact,
  type ContactKind,
} from '../lib/tripData.ts';
import TravelCard from './TravelCard.tsx';
import type { Preferences } from '../lib/preferences.ts';
import type { Lang, HotelPlan } from '../lib/resources.ts';
const blank = { kind: 'hotel' as ContactKind, name: '', phone: '', note: '' };
export default function TravelContacts({
  country,
  lang,
  plan,
  profile,
}: {
  country: string;
  lang: Lang;
  plan: HotelPlan | null;
  profile: Preferences | null;
}) {
  const [rows, setRows] = useState(readContacts),
    [draft, setDraft] = useState(blank),
    [editing, setEditing] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [notice, setNotice] = useState(''),
    [removed, setRemoved] = useState<TravelContact | null>(null);
  const title = useRef<HTMLInputElement>(null),
    t = (es: string, en: string) => (lang === 'es' ? es : en);
  const local = rows.filter((r) => r.country === country),
    countryName =
      country === 'WORLD'
        ? t('un destino', 'a destination')
        : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  const persist = (next: TravelContact[]) => {
    try {
      writeLocal('faro-contacts-v1', JSON.stringify(next));
      setRows(next);
      return true;
    } catch {
      setNotice(t('No se pudo guardar en este navegador.', 'Could not save in this browser.'));
      return false;
    }
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setNotice(t('Escribe el nombre del contacto.', 'Enter a contact name.'));
      return;
    }
    if (!phoneHref(draft.phone)) {
      setNotice(
        t(
          'Revisa el teléfono: usa dígitos y, si corresponde, el prefijo + del país.',
          'Check the phone number: use digits and, where appropriate, the country + prefix.',
        ),
      );
      return;
    }
    if (!editing && rows.length >= 30) {
      setNotice(
        t(
          'Puedes guardar hasta 30 contactos. Elimina uno para continuar.',
          'You can save up to 30 contacts. Remove one to continue.',
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
      id: editing || crypto.randomUUID(),
    };
    if (persist(editing ? rows.map((r) => (r.id === editing ? row : r)) : [...rows, row])) {
      setOpen(false);
      setEditing(null);
      setDraft(blank);
      setRemoved(null);
      setNotice(t('Contacto guardado en este navegador.', 'Contact saved in this browser.'));
    }
  };
  const edit = (r: TravelContact) => {
    setDraft(r);
    setEditing(r.id);
    setOpen(true);
    setNotice('');
    requestAnimationFrame(() => title.current?.focus());
  };
  const missing = (Object.keys(contactKinds) as ContactKind[]).filter(
    (kind) => kind !== 'other' && !local.some((row) => row.kind === kind),
  );
  const startContact = (kind: ContactKind) => {
    setDraft({ ...blank, kind });
    setEditing(null);
    setOpen(true);
    setNotice('');
    requestAnimationFrame(() => title.current?.focus());
  };
  const starterGroups = (personal: readonly ContactKind[], work: readonly ContactKind[]) => (
    <div className="fw-contact-groups">
      {[
        { id: 'personal', label: t('Personales', 'Personal'), kinds: personal },
        { id: 'work', label: t('Trabajo y misión', 'Work and assignment'), kinds: work },
      ]
        .filter((group) => group.kinds.length > 0)
        .map((group) => (
          <div
            key={group.id}
            className="fw-contact-group"
            role="group"
            aria-labelledby={`contact-group-${group.id}`}
          >
            <p id={`contact-group-${group.id}`} className="fw-contact-group-title">
              {group.label}
            </p>
            <div className="fw-contact-starters">
              {group.kinds.map((kind) => (
                <button key={kind} type="button" onClick={() => startContact(kind)}>
                  <PlusIcon size={16} aria-hidden="true" />
                  {contactKinds[kind][lang === 'es' ? 0 : 1]}
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
  return (
    <section className="fw-trip-contacts" aria-label={t('Contactos del viaje', 'Travel contacts')}>
      <header>
        <div>
          <h2>{t('Tu ficha de viaje', 'Your travel card')}</h2>
          <p>
            {countryName} · {t('Guardados solo en este navegador', 'Saved only in this browser')}
          </p>
        </div>
      </header>
      {country === 'WORLD' ? (
        <p>
          {t(
            'Selecciona un país para preparar los contactos de ese viaje.',
            'Select a country to prepare contacts for that trip.',
          )}
        </p>
      ) : (
        <div className="fw-trip-kit">
          <TravelCard country={country} lang={lang} contacts={rows} plan={plan} profile={profile} />
          <div className="fw-trip-directory">
            <div className="fw-directory-heading">
              <h3>{t('Contactos importantes', 'Important contacts')}</h3>
              <button className="fw-secondary" onClick={() => startContact(blank.kind)}>
                <PlusIcon size={18} aria-hidden="true" />
                {t('Añadir contacto', 'Add contact')}
              </button>
            </div>
            {local.length > 0 ? (
              <ul className="fw-contact-list">
                {local.map((r) => (
                  <li key={r.id}>
                    <div>
                      <span>{contactKinds[r.kind][lang === 'es' ? 0 : 1]}</span>
                      <h3>{r.name}</h3>
                      {r.note && <p>{r.note}</p>}
                    </div>
                    <a
                      href={phoneHref(r.phone)!}
                      aria-label={`${t('Llamar a', 'Call')} ${r.name}: ${r.phone}`}
                    >
                      <PhoneIcon size={17} aria-hidden="true" />
                      {r.phone}
                    </a>
                    <div className="fw-contact-tools">
                      <button onClick={() => edit(r)}>{t('Editar', 'Edit')}</button>
                      <button
                        aria-label={`${t('Eliminar', 'Delete')} ${r.name}`}
                        onClick={() => {
                          if (persist(rows.filter((v) => v.id !== r.id))) {
                            setRemoved(r);
                            if (editing === r.id) {
                              setOpen(false);
                              setEditing(null);
                              setDraft(blank);
                            }
                            setNotice(t('Contacto eliminado.', 'Contact deleted.'));
                          }
                        }}
                      >
                        {t('Eliminar', 'Delete')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              !open && (
                <div className="fw-contacts-empty">
                  <p>
                    {t(
                      'Guarda a quién llamar antes de necesitarlo.',
                      'Save the people you may need to call.',
                    )}
                  </p>
                  <p className="fw-contact-empty-hint">
                    {t(
                      'Ten a mano a tu familia, tu alojamiento, tu seguro y, si viajas por trabajo, a tu equipo.',
                      'Keep your family, accommodation, insurer and, if you travel for work, your team close at hand.',
                    )}
                  </p>
                  {starterGroups(contactGroups.personal, contactGroups.work)}
                </div>
              )
            )}
            {local.length > 0 && !open && missing.length > 0 && (
              <div className="fw-contact-suggestions">
                <h4>{t('Añade para este viaje', 'Add for this trip')}</h4>
                {starterGroups(
                  contactGroups.personal.filter((k) => missing.includes(k)),
                  contactGroups.work.filter((k) => missing.includes(k)),
                )}
              </div>
            )}
            {open && (
              <form className="fw-contact-editor" onSubmit={save}>
                <h3>
                  {editing
                    ? t('Editar contacto', 'Edit contact')
                    : t('Nuevo contacto', 'New contact')}
                </h3>
                <div className="fw-contact-grid">
                  <label>
                    {t('Tipo', 'Type')}
                    <select
                      value={draft.kind}
                      onChange={(e) => setDraft({ ...draft, kind: e.target.value as ContactKind })}
                    >
                      {Object.entries(contactKinds).map(([key, value]) => (
                        <option value={key} key={key}>
                          {value[lang === 'es' ? 0 : 1]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('Nombre o entidad', 'Name or organisation')}
                    <input
                      ref={title}
                      name="contact-name"
                      autoComplete="off"
                      required
                      maxLength={100}
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </label>
                  <label>
                    {t('Teléfono', 'Phone')}
                    <input
                      required
                      type="tel"
                      name="contact-phone"
                      autoComplete="tel"
                      maxLength={40}
                      placeholder={t('+ código de país y número', '+ country code and number')}
                      value={draft.phone}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    />
                  </label>
                  <label>
                    {t('Indicaciones · opcional', 'Instructions · optional')}
                    <input
                      name="contact-note"
                      autoComplete="off"
                      maxLength={300}
                      value={draft.note}
                      onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                    />
                  </label>
                </div>
                <small>
                  {t(
                    'Incluye el código del país si llamarás desde el extranjero. Comprueba horarios y cobertura con el contacto.',
                    'Include the country code when calling from abroad. Confirm hours and coverage with the contact.',
                  )}
                </small>
                <div className="fw-contact-editor-actions">
                  <button className="fw-primary" type="submit">
                    {t('Guardar contacto', 'Save contact')}
                  </button>
                  <button
                    className="fw-secondary"
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setEditing(null);
                      setDraft(blank);
                      setNotice('');
                    }}
                  >
                    {t('Cancelar', 'Cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <p role="status" className="fw-contact-notice">
        {notice}
      </p>
      {removed && (
        <button
          className="fw-text"
          onClick={() => {
            if (rows.length < 30 && persist([...rows, removed])) {
              setRemoved(null);
              setNotice(t('Contacto restaurado.', 'Contact restored.'));
            }
          }}
        >
          {t('Deshacer eliminación', 'Undo deletion')}
        </button>
      )}
    </section>
  );
}

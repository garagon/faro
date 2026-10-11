import { writeLocal } from '../lib/browserStorage.ts';
import { useRef, useState } from 'react';
import { PhoneIcon, PlusIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import {
  contactKinds,
  phoneHref,
  readContacts,
  travelCard,
  type TravelContact,
  type ContactKind,
} from '../lib/tripData.ts';
import type { Lang, HotelPlan } from '../lib/resources.ts';
const blank = { kind: 'hotel' as ContactKind, name: '', phone: '', note: '' };
export default function TravelContacts({
  country,
  lang,
  plan,
}: {
  country: string;
  lang: Lang;
  plan: HotelPlan | null;
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
  const exportCard = () => {
    const url = URL.createObjectURL(
      new Blob([travelCard(country, lang, rows, plan)], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `faro-viaje-${country.toLowerCase()}-${lang}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      t(
        'Ficha generada. Ábrela en Descargas para consultarla sin internet.',
        'Card generated. Open it in Downloads to read it offline.',
      ),
    );
  };
  return (
    <section className="fw-trip-contacts" aria-label={t('Contactos del viaje', 'Travel contacts')}>
      <header>
        <div>
          <h2>{t('Contactos del viaje', 'Travel contacts')}</h2>
          <p>
            {countryName} · {t('Guardados solo en este navegador', 'Saved only in this browser')}
          </p>
        </div>
        {country !== 'WORLD' && (
          <div>
            <button className="fw-secondary" onClick={exportCard}>
              <DownloadSimpleIcon size={17} />
              {t('Descargar ficha', 'Download travel card')}
            </button>
            <button
              className="fw-primary"
              onClick={() => {
                setDraft(blank);
                setEditing(null);
                setOpen((v) => !v);
                setNotice('');
              }}
            >
              <PlusIcon size={17} />
              {t('Añadir contacto', 'Add contact')}
            </button>
          </div>
        )}
      </header>
      {country === 'WORLD' ? (
        <p>
          {t(
            'Selecciona un país para preparar los contactos de ese viaje.',
            'Select a country to prepare contacts for that trip.',
          )}
        </p>
      ) : (
        <>
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
                    <PhoneIcon size={17} />
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
                    'Todavía no guardaste contactos para este destino.',
                    'No saved contacts for this destination yet.',
                  )}
                </p>
                <span>
                  {t(
                    'Recepción · Seguro · Empresa · Familiares',
                    'Reception · Insurance · Employer · Family',
                  )}
                </span>
              </div>
            )
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
                    maxLength={40}
                    placeholder={t('+ código de país y número', '+ country code and number')}
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  />
                </label>
                <label>
                  {t('Indicaciones · opcional', 'Instructions · optional')}
                  <input
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
        </>
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

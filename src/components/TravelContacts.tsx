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
import type { Lang } from '../lib/resources.ts';
import { newId } from '../lib/id.ts';
import { langIndex, pick } from '../lib/i18n.ts';
const blank = { kind: 'hotel' as ContactKind, name: '', phone: '', note: '' };
/** Other people worth having at hand on this trip, beyond the emergency contact. */
export default function TravelContacts({ country, lang }: { country: string; lang: Lang }) {
  const [rows, setRows] = useState(readContacts),
    [draft, setDraft] = useState(blank),
    [editing, setEditing] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [notice, setNotice] = useState(''),
    [removed, setRemoved] = useState<TravelContact | null>(null);
  const title = useRef<HTMLInputElement>(null),
    t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
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
                  {contactKinds[kind][langIndex(lang)]}
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
  return (
    <section
      className="fw-trip-contacts"
      aria-label={t('Contactos del viaje', 'Travel contacts', 'Contatos da viagem')}
    >
      <header>
        <div>
          <h2>{t('Otros contactos', 'Other contacts', 'Outros contatos')}</h2>
          <p>
            {t(
              `Recepción, consulado, seguro, empresa o quien quieras tener a mano en ${countryName}.`,
              `Reception, consulate, insurer, employer or anyone you want at hand in ${countryName}.`,
              `Recepção, consulado, seguro, empresa ou quem você quiser ter à mão nesta viagem (${countryName}).`,
            )}
          </p>
        </div>
      </header>
      {country === 'WORLD' ? (
        <p>
          {t(
            'Selecciona un país para preparar los contactos de ese viaje.',
            'Select a country to prepare contacts for that trip.',
            'Selecione um país para preparar os contatos dessa viagem.',
          )}
        </p>
      ) : (
        <div className="fw-trip-kit">
          <div className="fw-trip-directory">
            <div className="fw-directory-heading">
              <h3 className="fw-visually-hidden">{t('Contactos', 'Contacts', 'Contatos')}</h3>
              <button className="fw-secondary" onClick={() => startContact(blank.kind)}>
                <PlusIcon size={18} aria-hidden="true" />
                {t('Añadir contacto', 'Add contact', 'Adicionar contato')}
              </button>
            </div>
            {local.length > 0 ? (
              <ul className="fw-contact-list">
                {local.map((r) => (
                  <li key={r.id}>
                    <div>
                      <span>{contactKinds[r.kind][langIndex(lang)]}</span>
                      <h3>{r.name}</h3>
                      {r.note && <p>{r.note}</p>}
                    </div>
                    <a
                      href={phoneHref(r.phone)!}
                      aria-label={`${t('Llamar a', 'Call', 'Ligar para')} ${r.name}: ${r.phone}`}
                    >
                      <PhoneIcon size={17} aria-hidden="true" />
                      {r.phone}
                    </a>
                    <div className="fw-contact-tools">
                      <button onClick={() => edit(r)}>{t('Editar', 'Edit', 'Editar')}</button>
                      <button
                        aria-label={`${t('Eliminar', 'Delete', 'Excluir')} ${r.name}`}
                        onClick={() => {
                          if (persist(rows.filter((v) => v.id !== r.id))) {
                            setRemoved(r);
                            if (editing === r.id) {
                              setOpen(false);
                              setEditing(null);
                              setDraft(blank);
                            }
                            setNotice(
                              t('Contacto eliminado.', 'Contact deleted.', 'Contato excluído.'),
                            );
                          }
                        }}
                      >
                        {t('Eliminar', 'Delete', 'Excluir')}
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
                      'Salve para quem ligar antes de precisar.',
                    )}
                  </p>
                  <p className="fw-contact-empty-hint">
                    {t(
                      'Ten a mano a tu familia, tu alojamiento, tu seguro y, si viajas por trabajo, a tu equipo.',
                      'Keep your family, accommodation, insurer and, if you travel for work, your team close at hand.',
                      'Tenha à mão sua família, sua hospedagem, seu seguro e, se viaja a trabalho, sua equipe.',
                    )}
                  </p>
                  {starterGroups(contactGroups.personal, contactGroups.work)}
                </div>
              )
            )}
            {local.length > 0 && !open && missing.length > 0 && (
              <div className="fw-contact-suggestions">
                <h4>
                  {t('Añade para este viaje', 'Add for this trip', 'Adicione para esta viagem')}
                </h4>
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
                    ? t('Editar contacto', 'Edit contact', 'Editar contato')
                    : t('Nuevo contacto', 'New contact', 'Novo contato')}
                </h3>
                <div className="fw-contact-grid">
                  <label>
                    {t('Tipo', 'Type', 'Tipo')}
                    <select
                      value={draft.kind}
                      onChange={(e) => setDraft({ ...draft, kind: e.target.value as ContactKind })}
                    >
                      {Object.entries(contactKinds).map(([key, value]) => (
                        <option value={key} key={key}>
                          {value[langIndex(lang)]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('Nombre o entidad', 'Name or organization', 'Nome ou organização')}
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
                    {t('Teléfono', 'Phone', 'Telefone')}
                    <input
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
                  </label>
                  <label>
                    {t(
                      'Indicaciones · opcional',
                      'Instructions · optional',
                      'Instruções · opcional',
                    )}
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
                    'Inclua o código do país se for ligar do exterior. Confirme horários e cobertura com o contato.',
                  )}
                </small>
                <div className="fw-contact-editor-actions">
                  <button className="fw-primary" type="submit">
                    {t('Guardar contacto', 'Save contact', 'Salvar contato')}
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
                    {t('Cancelar', 'Cancel', 'Cancelar')}
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
              setNotice(t('Contacto restaurado.', 'Contact restored.', 'Contato restaurado.'));
            }
          }}
        >
          {t('Deshacer eliminación', 'Undo deletion', 'Desfazer exclusão')}
        </button>
      )}
    </section>
  );
}

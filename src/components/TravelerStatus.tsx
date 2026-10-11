import { removeLocal } from '../lib/browserStorage.ts';
import { useRef, useState } from 'react';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  WarningCircleIcon,
  CopyIcon,
  ShareNetworkIcon,
} from '@phosphor-icons/react';
import {
  checkInMessage,
  checkInTime,
  statusLabels,
  canShareCheckIn,
  contextLabels,
  connectionLabels,
  type MessageContext,
  type Connection,
  type EventReference,
  type CheckIn,
  type TravelerStatus as Status,
} from '../lib/traveler.ts';
import type { Preferences } from '../lib/preferences.ts';
import type { Quake } from '../lib/domain.ts';
import type { HotelPlan, Lang } from '../lib/resources.ts';
import { prepareCheckIn } from '../lib/prepareCheckIn.ts';
type Props = {
  country: string;
  profile: Preferences | null;
  plan: HotelPlan | null;
  events: Quake[];
  lang: Lang;
  history: CheckIn[];
  onHistory: (rows: CheckIn[]) => void;
  now: number;
  onHelp: () => void;
};
export default function TravelerStatus({
  country,
  profile,
  plan,
  events,
  lang,
  history,
  onHistory,
  now,
  onHelp,
}: Props) {
  const preview = useRef<HTMLElement>(null),
    form = useRef<HTMLFormElement>(null);
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const [prepared, setPrepared] = useState<CheckIn | null>(null),
    [notSaved, setNotSaved] = useState(false);
  const [status, setStatus] = useState<Status | ''>(''),
    [nameOverride, setName] = useState<string | null>(null),
    [place, setPlace] = useState(''),
    [note, setNote] = useState(''),
    [contact, setContact] = useState(history[0]?.contact || ''),
    [minutes, setMinutes] = useState(0),
    [feedback, setFeedback] = useState('');
  const [context, setContext] = useState<MessageContext>('earthquake'),
    [destination, setDestination] = useState(''),
    [companions, setCompanions] = useState(''),
    [needs, setNeeds] = useState(''),
    [connection, setConnection] = useState<Connection | ''>(''),
    [event, setEvent] = useState<(EventReference & { id: string }) | null>(null),
    [messageLanguage, setMessageLanguage] = useState<Lang | null>(null);
  const [includePhone, setIncludePhone] = useState(false),
    [includeEmail, setIncludeEmail] = useState(false);
  const name = nameOverride ?? profile?.name ?? history[0]?.name ?? '';
  const outputLang = messageLanguage || lang;
  const countryName =
    country === 'WORLD'
      ? ''
      : new Intl.DisplayNames([lang], { type: 'region' }).of(country) || country;
  const hotel = plan?.country === country ? plan : null;
  const makeRecord = (at: number): CheckIn => ({
    id: 'draft',
    status: status || 'ok',
    name: name.trim(),
    place: place.trim(),
    note: note.trim(),
    contact: contact.trim(),
    at,
    nextAt: minutes ? at + minutes * 60000 : null,
    context,
    phone: includePhone ? profile?.phone || '' : '',
    email: includeEmail ? profile?.email || '' : '',
    destination: status === 'moving' ? destination.trim() : '',
    companions: companions.trim(),
    needs: status === 'help' ? needs.trim() : '',
    connection,
    event:
      context === 'earthquake' && event
        ? { source: event.source, place: event.place, mag: event.mag, time: event.time }
        : null,
  });
  const [dirty, setDirty] = useState(false),
    [confirmClear, setConfirmClear] = useState(false);
  const change = () => {
    setDirty(true);
    setFeedback('');
  };
  const review = () => {
    form.current
      ?.querySelector<HTMLInputElement>('input[type=radio]:checked, input[type=radio]')
      ?.focus({ preventScroll: true });
    form.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    const at = Date.now();
    const row = { ...makeRecord(at), id: crypto.randomUUID() };
    const result = prepareCheckIn(row, history);
    setPrepared(row);
    setNotSaved(!result.persisted);
    if (result.persisted) onHistory(result.rows);
    setDirty(false);
    setFeedback('');
    requestAnimationFrame(() => {
      preview.current?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width:960px)').matches)
        preview.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  };
  const changed =
    dirty ||
    (!!prepared &&
      (prepared.name !== name.trim() ||
        (prepared.phone || '') !== (includePhone ? profile?.phone || '' : '') ||
        (prepared.email || '') !== (includeEmail ? profile?.email || '' : '')));
  const draftRecord = status ? makeRecord(Math.max(now, Date.now())) : null;
  const visibleRecord = prepared && !changed ? prepared : draftRecord;
  const message = visibleRecord ? checkInMessage(visibleRecord, outputLang) : '';
  const currentTime = Math.max(now, Date.now());
  const shareAllowed = canShareCheckIn(prepared, changed, currentTime);
  const expired = !!prepared && !canShareCheckIn(prepared, false, currentTime);
  const copy = async () => {
    if (!canShareCheckIn(prepared, changed, Date.now())) return;
    try {
      await navigator.clipboard.writeText(message);
      setFeedback(
        t(
          'Copiado. Pégalo en la conversación que elijas.',
          'Copied. Paste it into your chosen conversation.',
        ),
      );
    } catch {
      setFeedback(
        t(
          'No se pudo copiar. Selecciona el texto del mensaje para copiarlo manualmente.',
          'Could not copy. Select the message text to copy it manually.',
        ),
      );
    }
  };
  const share = async () => {
    if (!canShareCheckIn(prepared, changed, Date.now())) return;
    try {
      await navigator.share({ text: message });
      setFeedback(
        t(
          'Se abrió la opción de compartir. Comprueba el envío en la app que elegiste.',
          'Sharing opened. Check the message in the app you chose.',
        ),
      );
    } catch (e) {
      setFeedback(
        e instanceof Error && e.name === 'AbortError'
          ? t(
              'No compartiste el mensaje. Puedes intentarlo de nuevo.',
              'You did not share the message. You can try again.',
            )
          : t(
              'No se pudo abrir la app. Usa Copiar mensaje.',
              'Could not open sharing. Use Copy message.',
            ),
      );
    }
  };
  const clear = () => {
    try {
      removeLocal('faro-checkins-v1');
      onHistory([]);
      setConfirmClear(false);
      setFeedback(t('Historial borrado de este navegador.', 'History deleted from this browser.'));
    } catch {
      setFeedback(t('No se pudo borrar el historial.', 'Could not delete history.'));
    }
  };
  return (
    <div className="fw-traveler">
      <form ref={form} className="fw-checkin-form" onSubmit={save} onChange={change}>
        <header>
          <h2>{t('¿Cómo estás ahora?', 'How are you now?')}</h2>
          <p>
            {t(
              'Un mensaje claro ayuda a quienes te están esperando.',
              'Give the people waiting to hear from you a clear update.',
            )}
          </p>
        </header>
        <fieldset>
          <legend className="fw-sr">{t('Tu estado ahora', 'Your status now')}</legend>
          <div className="fw-status-options">
            {(['ok', 'moving', 'help'] as const).map((s, i) => {
              const Icon = [CheckCircleIcon, ArrowRightIcon, WarningCircleIcon][i];
              return (
                <label key={s} data-status={s} className={status === s ? 'selected' : ''}>
                  <input
                    type="radio"
                    required
                    name="personal-status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                  />
                  <Icon size={20} />
                  <span>{statusLabels[s][lang === 'es' ? 0 : 1]}</span>
                  <span className="fw-radio-indicator" aria-hidden="true" />
                </label>
              );
            })}
          </div>
        </fieldset>
        {status === 'help' && (
          <div className="fw-status-help">
            <button type="button" className="fw-secondary" onClick={onHelp}>
              {t('Ver teléfonos de emergencia', 'View emergency numbers')}
            </button>
            <p>
              {t(
                'Este mensaje se lo envías a tus contactos; no solicita rescate.',
                'This message goes to your contacts; it does not request rescue.',
              )}
            </p>
          </div>
        )}
        <div className="fw-message-fields">
          <label>
            {t('Motivo del mensaje', 'Reason for your message')}
            <select value={context} onChange={(e) => setContext(e.target.value as MessageContext)}>
              {Object.entries(contextLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label[lang === 'es' ? 0 : 1]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Dónde estás ahora', 'Where you are now')}
            <input
              maxLength={160}
              placeholder={t(
                'Hotel, barrio o punto de encuentro',
                'Hotel, neighborhood or meeting point',
              )}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </label>
          {(countryName || hotel?.name) && (
            <div
              className="fw-place-suggestions"
              aria-label={t('Añadir un lugar al mensaje', 'Add a place to the message')}
            >
              {countryName && (
                <button
                  type="button"
                  onClick={() => {
                    setPlace(countryName);
                    change();
                  }}
                >
                  {t('Estoy en', "I'm in")} {countryName}
                </button>
              )}
              {hotel?.name && (
                <button
                  type="button"
                  onClick={() => {
                    setPlace(`${hotel.name}, ${countryName}`);
                    change();
                  }}
                >
                  {t('Estoy en mi hotel', "I'm at my hotel")}
                </button>
              )}
            </div>
          )}
          {status === 'moving' && (
            <label>
              {t('A dónde vas', 'Where you are heading')}
              <input
                maxLength={160}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t('Nombre del lugar o dirección', 'Place name or address')}
              />
            </label>
          )}
          {status === 'help' && (
            <label>
              {t('Qué ayuda necesitas', 'What help you need')}
              <textarea
                maxLength={300}
                rows={2}
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
                placeholder={t(
                  'Por ejemplo: necesito que contacten a mi seguro de viaje',
                  'For example: please contact my travel insurer',
                )}
              />
            </label>
          )}
          <div className="fw-context-pair">
            <label>
              {t('Puedes contactarme', 'Reaching me')}
              <select
                value={connection}
                onChange={(e) => setConnection(e.target.value as Connection | '')}
              >
                <option value="">{t('Sin indicar', 'Not specified')}</option>
                {Object.entries(connectionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label[lang === 'es' ? 0 : 1]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('Volveré a avisar', "I'll check in again")}
              <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                <option value={0}>{t('Sin acordar una hora', 'No time agreed')}</option>
                {[15, 30, 60, 120].map((v) => (
                  <option key={v} value={v}>
                    {t('En', 'In')} {v} min
                  </option>
                ))}
              </select>
            </label>
          </div>
          {minutes > 0 && (
            <small>
              {t(
                'Es un compromiso en tu mensaje. El recordatorio aparece con Faro abierto.',
                'This is a commitment in your message. The reminder appears while Faro is open.',
              )}
            </small>
          )}
        </div>
        {(profile?.phone || profile?.email) && (
          <fieldset className="fw-contact-inclusion">
            <legend>{t('Incluir cómo contactarme', 'Include how to reach me')}</legend>
            {profile.phone && (
              <label>
                <input
                  type="checkbox"
                  checked={includePhone}
                  onChange={(e) => setIncludePhone(e.target.checked)}
                />
                {t('Mi teléfono', 'My phone')} · {profile.phone}
              </label>
            )}
            {profile.email && (
              <label>
                <input
                  type="checkbox"
                  checked={includeEmail}
                  onChange={(e) => setIncludeEmail(e.target.checked)}
                />
                {t('Mi correo', 'My email')} · {profile.email}
              </label>
            )}
          </fieldset>
        )}
        <details className="fw-checkin-optional">
          <summary>
            {t('Nombre, acompañantes y más detalles', 'Name, companions and more details')}
          </summary>
          <div className="fw-checkin-fields">
            <label>
              {t('Tu nombre', 'Your name')}
              <input
                autoComplete="given-name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              {t('Con quién estás', 'Who you are with')}
              <input
                maxLength={160}
                value={companions}
                onChange={(e) => setCompanions(e.target.value)}
                placeholder={t('Mis compañeros de trabajo', 'My colleagues')}
              />
            </label>
          </div>
          <label>
            {t('Algo más que quieras contar', 'Anything else to add')}
            <textarea
              maxLength={600}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <label>
            {t('Si no respondo, contacten a…', 'If I do not reply, contact…')}
            <input
              maxLength={300}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t(
                'Nombre y teléfono de un contacto alternativo',
                'Name and phone number of an alternative contact',
              )}
            />
          </label>
          {context === 'earthquake' && (
            <label>
              {t('Añadir un reporte oficial', 'Add an official report')}
              <select
                value={event?.id || ''}
                onChange={(e) => {
                  const selected = events.find((item) => item.id === e.target.value);
                  setEvent(
                    selected
                      ? {
                          id: selected.id,
                          source: selected.source || 'USGS',
                          place: selected.place.slice(0, 1000),
                          mag: selected.mag,
                          time: selected.time,
                        }
                      : null,
                  );
                }}
              >
                <option value="">{t('Sin adjuntar un reporte', 'No report attached')}</option>
                {event && !events.some((item) => item.id === event.id) && (
                  <option value={event.id}>
                    M {event.mag ?? '—'} · {event.place}
                  </option>
                )}
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    M {item.mag ?? '—'} · {item.place} · {checkInTime(item.time, lang)}
                  </option>
                ))}
              </select>
              <small>
                {t(
                  'Reportes de la vista actual del mapa. Elige solo el que quieras mencionar; no indica cómo te afectó.',
                  'Reports from the current map view. Choose only the one you want to mention; it does not show how you were affected.',
                )}
              </small>
            </label>
          )}
        </details>
        <button type="submit" className="fw-primary" disabled={!status}>
          {t('Confirmar y preparar mensaje', 'Confirm and prepare message')}
          <ArrowRightIcon size={17} />
        </button>
        <small className="fw-checkin-privacy">
          {t(
            'Nada se envía al pulsar este botón. Primero verás el texto.',
            'This button does not send anything. You will see the text first.',
          )}
        </small>
      </form>
      <aside className="fw-checkin-aside">
        <section
          className={`fw-message-preview ${visibleRecord ? 'has-message' : 'is-empty'}`}
          ref={preview}
          tabIndex={-1}
          aria-label={t('Vista previa del mensaje', 'Message preview')}
        >
          <header>
            <div className="fw-preview-title">
              <h2>{t('Lo que van a recibir', "What they'll receive")}</h2>
              <span className={`fw-draft-badge ${shareAllowed ? 'ready' : ''}`}>
                {shareAllowed
                  ? t('Listo para compartir', 'Ready to share')
                  : t('Borrador', 'Draft')}
              </span>
            </div>
            <label className="fw-output-language">
              {t('Idioma del mensaje', 'Message language')}
              <select
                value={outputLang}
                onChange={(e) => {
                  setMessageLanguage(e.target.value as Lang);
                  change();
                }}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </label>
            {outputLang !== lang && (
              <p className="fw-language-note">
                {t(
                  'Los nombres y detalles se mantienen como los escribiste.',
                  'Names and details stay in the language you entered.',
                )}
              </p>
            )}
          </header>
          {visibleRecord ? (
            <>
              {((prepared && (changed || expired)) || notSaved) && (
                <div className="fw-message-notice" role="status">
                  <p>
                    {changed
                      ? t(
                          'La vista previa incluye tus cambios. Confirma el mensaje antes de compartir.',
                          'The preview includes your changes. Confirm the message before sharing.',
                        )
                      : expired
                        ? t(
                            'Revisa cómo estás antes de volver a compartir este mensaje.',
                            'Review how you are before sharing this message again.',
                          )
                        : t(
                            'No se pudo guardar. Puedes compartirlo ahora; se perderá al cerrar o recargar Faro.',
                            'Could not save. You can share it now; it will be lost if you close or reload Faro.',
                          )}
                  </p>
                  {(changed || expired) && (
                    <button onClick={review}>{t('Revisar mi estado', 'Review my status')}</button>
                  )}
                </div>
              )}
              <div
                className="fw-message-body"
                aria-label={t('Mensaje para compartir', 'Message to share')}
              >
                {message.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              {!prepared && (
                <p className="fw-draft-hint">
                  {t(
                    'La vista previa cambia mientras completas los datos. Confírmala para habilitar el envío.',
                    'The preview updates as you add details. Confirm it to enable sharing.',
                  )}
                </p>
              )}
              <div
                className="fw-share-actions"
                aria-label={t('Compartir mensaje preparado', 'Share prepared message')}
              >
                <button className="fw-primary" disabled={!shareAllowed} onClick={() => void copy()}>
                  <CopyIcon size={17} />
                  {t('Copiar', 'Copy')}
                </button>
                {typeof navigator.share === 'function' && (
                  <button
                    className="fw-secondary"
                    disabled={!shareAllowed}
                    onClick={() => void share()}
                  >
                    <ShareNetworkIcon size={17} />
                    {t('Compartir', 'Share')}
                  </button>
                )}
                {shareAllowed && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                    onClick={(e) => {
                      if (!canShareCheckIn(prepared, changed, Date.now())) e.preventDefault();
                    }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp ↗
                  </a>
                )}
              </div>
              <small>
                {t(
                  'Elige el contacto en tu app y confirma el envío allí. No se adjunta tu GPS.',
                  'Choose a contact in your app and confirm sending there. Your GPS is not attached.',
                )}
              </small>
            </>
          ) : (
            <div className="fw-preview-empty">
              <p>
                {t(
                  'Elige cómo estás. Verás el mensaje completo aquí mientras añades información.',
                  'Choose how you are. Your full message will appear here as you add details.',
                )}
              </p>
            </div>
          )}
        </section>
        {feedback && (
          <p className="fw-share-feedback" role="status">
            {feedback}
          </p>
        )}
        {history.length > 0 && (
          <details className="fw-checkin-history">
            <summary>
              {t('Mensajes anteriores', 'Previous messages')} ({history.length})
            </summary>
            <p>
              {t(
                'Guardados en este navegador. No indican tu situación actual.',
                'Saved in this browser. They do not describe your current situation.',
              )}
            </p>
            <ol>
              {history.map((row) => (
                <li key={row.id}>
                  <strong>{statusLabels[row.status][lang === 'es' ? 0 : 1]}</strong>
                  <time>{checkInTime(row.at, lang)}</time>
                  {row.place && <span>{row.place}</span>}
                </li>
              ))}
            </ol>
            {confirmClear ? (
              <div className="fw-history-confirm">
                <p>
                  {t(
                    '¿Borrar los mensajes anteriores de este navegador?',
                    'Delete previous messages from this browser?',
                  )}
                </p>
                <button className="fw-secondary" onClick={clear}>
                  {t('Borrar mensajes anteriores', 'Delete previous messages')}
                </button>
                <button className="fw-text" onClick={() => setConfirmClear(false)}>
                  {t('Cancelar', 'Cancel')}
                </button>
              </div>
            ) : (
              <button className="fw-text" onClick={() => setConfirmClear(true)}>
                {t('Borrar historial', 'Delete history')}
              </button>
            )}
          </details>
        )}
        <div className="fw-followup-note">
          <button className="fw-text" onClick={onHelp}>
            {t('Ver teléfonos de emergencia', 'View emergency numbers')} →
          </button>
          <p>
            {t(
              'Para un próximo contacto, acuerda una hora con alguien. Faro no avisa a otras personas automáticamente.',
              'For a later check-in, agree on a time with someone. Faro does not notify other people automatically.',
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}

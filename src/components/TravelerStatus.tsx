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
  type CheckIn,
  type TravelerStatus as Status,
} from '../lib/traveler.ts';
import type { Lang } from '../lib/resources.ts';
import { prepareCheckIn } from '../lib/prepareCheckIn.ts';
type Props = {
  country: string;
  lang: Lang;
  history: CheckIn[];
  onHistory: (rows: CheckIn[]) => void;
  now: number;
  onHelp: () => void;
};
export default function TravelerStatus({ lang, history, onHistory, now, onHelp }: Props) {
  const preview = useRef<HTMLElement>(null),
    form = useRef<HTMLFormElement>(null);
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const [prepared, setPrepared] = useState<CheckIn | null>(null),
    [notSaved, setNotSaved] = useState(false);
  const [status, setStatus] = useState<Status | ''>(''),
    [name, setName] = useState(history[0]?.name || ''),
    [place, setPlace] = useState(''),
    [note, setNote] = useState(''),
    [contact, setContact] = useState(history[0]?.contact || ''),
    [minutes, setMinutes] = useState(0),
    [feedback, setFeedback] = useState('');
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
    const row: CheckIn = {
      id: crypto.randomUUID(),
      status,
      name: name.trim(),
      place: place.trim(),
      note: note.trim(),
      contact: contact.trim(),
      at,
      nextAt: minutes ? at + minutes * 60000 : null,
    };
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
  const message = prepared ? checkInMessage(prepared, lang) : '';
  const currentTime = Math.max(now, Date.now());
  const shareAllowed = canShareCheckIn(prepared, dirty, currentTime);
  const expired = !!prepared && !canShareCheckIn(prepared, false, currentTime);
  const copy = async () => {
    if (!canShareCheckIn(prepared, dirty, Date.now())) return;
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
    if (!canShareCheckIn(prepared, dirty, Date.now())) return;
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
              'Elige una opción. Puedes añadir dónde estás y qué necesitas.',
              'Choose an option. You can add where you are and what you need.',
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
        <details className="fw-checkin-optional">
          <summary>{t('Añadir lugar o detalles', 'Add a place or details')}</summary>
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
              {t('Dónde estás', 'Where you are')}
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
          </div>
          <label>
            {t('Qué quieres contar', 'What you want to say')}
            <textarea
              maxLength={600}
              rows={3}
              placeholder={t(
                'Por ejemplo: estoy con mis compañeros. Vamos hacia el punto de encuentro del hotel.',
                'For example: I am with my colleagues. We are heading to the hotel meeting point.',
              )}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="fw-next-checkin">
            <label>
              {t('Cuándo volverás a escribir', 'When you will check in again')}
              <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                <option value={0}>{t('No indicar una hora', 'Do not include a time')}</option>
                {[15, 30, 60, 120].map((v) => (
                  <option key={v} value={v}>
                    {t('En', 'In')} {v} {t('minutos', 'minutes')}
                  </option>
                ))}
              </select>
            </label>
            {minutes > 0 && (
              <small>
                {t(
                  'Faro solo puede recordártelo mientras esté abierto.',
                  'Faro can only remind you while it stays open.',
                )}
              </small>
            )}
          </div>
          <label>
            {t('A quién contactar si no respondes', 'Who to contact if you do not reply')}
            <input
              maxLength={300}
              placeholder={t(
                'Por ejemplo: llamen a la recepción del hotel',
                'For example: please call the hotel reception',
              )}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </label>
          <small>
            {t('Todos estos detalles son opcionales.', 'All these details are optional.')}
          </small>
        </details>
        <button type="submit" className="fw-primary" disabled={!status}>
          {t('Preparar mensaje', 'Prepare message')}
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
          className={`fw-message-preview ${prepared ? 'has-message' : 'is-empty'}`}
          ref={preview}
          tabIndex={-1}
          aria-label={t('Vista previa del mensaje', 'Message preview')}
        >
          <header>
            <h2>
              {prepared
                ? t('Tu mensaje', 'Your message')
                : t('Mensaje para tus contactos', 'Message for your contacts')}
            </h2>
            {prepared && (
              <time dateTime={new Date(prepared.at).toISOString()}>
                {checkInTime(prepared.at, lang)}
              </time>
            )}
          </header>
          {prepared ? (
            <>
              {(dirty || expired || notSaved) && (
                <div className="fw-message-notice" role="status">
                  <p>
                    {dirty
                      ? t(
                          'Cambiaste los datos. Prepara el mensaje de nuevo para incluirlos.',
                          'You changed the details. Prepare the message again to include them.',
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
                  {(dirty || expired) && (
                    <button onClick={review}>{t('Revisar mi estado', 'Review my status')}</button>
                  )}
                </div>
              )}
              <textarea
                aria-label={t('Mensaje para compartir', 'Message to share')}
                readOnly
                value={message}
                rows={7}
              />
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
                      if (!canShareCheckIn(prepared, dirty, Date.now())) e.preventDefault();
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
                  'Selecciona cómo estás y pulsa «Preparar mensaje». Aquí podrás leerlo antes de enviarlo.',
                  'Choose your status and tap “Prepare message”. You can read it here before sending.',
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

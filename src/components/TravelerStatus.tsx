import {
  helpTemplates,
  quickMessages,
  applyQuickMessage,
  translateQuickMessage,
  type QuickFields,
} from '../lib/messageTemplates.ts';
import { removeLocal } from '../lib/browserStorage.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { recentLocation, statusLocation, type LocationFix } from '../lib/statusLocation.ts';
import { CheckCircleIcon, ArrowRightIcon, WarningCircleIcon } from '@phosphor-icons/react';
import ShareButtons from './ShareButtons.tsx';
import { PhoneButton } from './Ui.tsx';
import { emergencyFor } from '../lib/emergency.ts';
import '../styles/status.css';
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
import { displayPlace, type Quake } from '../lib/domain.ts';
import type { HotelPlan, Lang } from '../lib/resources.ts';
import { prepareCheckIn } from '../lib/prepareCheckIn.ts';
import { newId } from '../lib/id.ts';
import { langIndex, pick } from '../lib/i18n.ts';
type Props = {
  /** Country the person is in, for the local emergency number. */
  country: string;
  location: LocationFix | null;
  profile: Preferences | null;
  plan: HotelPlan | null;
  events: Quake[];
  lang: Lang;
  history: CheckIn[];
  onHistory: (rows: CheckIn[]) => void;
  now: number;
  onHelp: () => void;
  /** Land-border lookup, available once the borders have loaded. */
  countryAt?: (point: { lat: number; lng: number }) => string | null;
};
export default function TravelerStatus({
  location,
  profile,
  plan,
  events,
  lang,
  history,
  onHistory,
  now,
  onHelp,
  country,
  countryAt,
}: Props) {
  const preview = useRef<HTMLElement>(null),
    form = useRef<HTMLFormElement>(null);
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const localNumber = emergencyFor(country)?.numbers[0];
  const [prepared, setPrepared] = useState<CheckIn | null>(null),
    [preparedLanguage, setPreparedLanguage] = useState<Lang | null>(null),
    [notSaved, setNotSaved] = useState(false);
  const [status, setStatus] = useState<Status | ''>(''),
    [nameOverride, setName] = useState<string | null>(null),
    [place, setPlace] = useState(''),
    [note, setNote] = useState(''),
    [contact, setContact] = useState(history[0]?.contact || ''),
    [minutes, setMinutes] = useState(0),
    [feedback, setFeedback] = useState('');
  // No reason is preselected: the message names an event only when the person chooses it.
  const [context, setContext] = useState<MessageContext | ''>(''),
    [destination, setDestination] = useState(''),
    [companions, setCompanions] = useState(''),
    [needs, setNeeds] = useState(''),
    [connection, setConnection] = useState<Connection | ''>(''),
    [event, setEvent] = useState<(EventReference & { id: string }) | null>(null),
    [messageLanguage, setMessageLanguage] = useState<Lang | null>(null),
    [quick, setQuick] = useState('');
  const [includePhone, setIncludePhone] = useState(false),
    [includeEmail, setIncludeEmail] = useState(false);
  const name = nameOverride ?? profile?.name ?? history[0]?.name ?? '';
  const outputLang = messageLanguage || lang;
  const locationIsRecent = recentLocation(location, now);
  const suggestedLocation = useMemo(
    () => statusLocation(location, profile?.destination, now, countryAt),
    // Recalculate the country only when the fix, saved trip or freshness changes.
    [location, profile?.destination, locationIsRecent, countryAt],
  );
  const countryName = suggestedLocation
    ? new Intl.DisplayNames([lang], { type: 'region' }).of(suggestedLocation.country) ||
      suggestedLocation.country
    : '';
  const hotel = plan?.country === suggestedLocation?.country ? plan : null;
  const makeRecord = (at: number): CheckIn => ({
    id: 'draft',
    status: status || 'ok',
    name: name.trim(),
    place: place.trim(),
    note: note.trim(),
    contact: contact.trim(),
    at,
    nextAt: minutes ? at + minutes * 60000 : null,
    context: context || undefined,
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
  const quickFields = (): QuickFields => ({ status, context, connection, note, needs, companions });
  const setQuickFields = (fields: QuickFields) => {
    setStatus(fields.status);
    setContext(fields.context);
    setConnection(fields.connection);
    setNote(fields.note);
    setNeeds(fields.needs);
    setCompanions(fields.companions);
  };
  // The last ready message applied. Unlike the highlight, it survives manual edits so its
  // untouched text can still be replaced or translated.
  const applied = useRef<(typeof quickMessages)[number] | null>(null);
  const applyQuick = (id: string) => {
    const preset = quickMessages.find((m) => m.id === id);
    if (!preset) return;
    setQuickFields(applyQuickMessage(quickFields(), preset, applied.current, outputLang));
    applied.current = preset;
    change();
    setQuick(id);
  };
  // Keep ready-message text in the language chosen for the message.
  const lastLanguage = useRef(outputLang);
  useEffect(() => {
    const from = lastLanguage.current;
    lastLanguage.current = outputLang;
    const preset = applied.current;
    if (preset && from !== outputLang)
      setQuickFields(translateQuickMessage(quickFields(), preset, from, outputLang));
    // Only language changes trigger this; the form values are read at that moment.
  }, [outputLang]);
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
    const row = { ...makeRecord(at), id: newId() };
    const result = prepareCheckIn(row, history);
    setPrepared(row);
    setPreparedLanguage(outputLang);
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
    (!!prepared && preparedLanguage !== outputLang) ||
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
  const clear = () => {
    try {
      removeLocal('faro-checkins-v1');
      onHistory([]);
      setConfirmClear(false);
      setFeedback(
        t(
          'Historial borrado de este navegador.',
          'History deleted from this browser.',
          'Histórico apagado deste navegador.',
        ),
      );
    } catch {
      setFeedback(
        t(
          'No se pudo borrar el historial.',
          'Could not delete history.',
          'Não foi possível apagar o histórico.',
        ),
      );
    }
  };
  return (
    <div className="fw-traveler">
      <form ref={form} className="fw-checkin-form" onSubmit={save} onChange={change}>
        <header>
          <h2>{t('¿Cómo estás?', 'How are you?', 'Como você está?')}</h2>
          <p>
            {t(
              'Elige una opción. Verás el mensaje completo y podrás editarlo antes de enviarlo.',
              'Choose an option. You will see the full message and can edit it before sending.',
              'Escolha uma opção. Você verá a mensagem completa e poderá editá-la antes de enviar.',
            )}
          </p>
        </header>
        <fieldset>
          <legend className="fw-sr">
            {t('Tu estado ahora', 'Your status now', 'Seu status agora')}
          </legend>
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
                    onChange={() => {
                      setStatus(s);
                      setQuick('');
                    }}
                  />
                  <Icon size={20} />
                  <span>{statusLabels[s][langIndex(lang)]}</span>
                  <span className="fw-radio-indicator" aria-hidden="true" />
                </label>
              );
            })}
          </div>
        </fieldset>
        {status === 'help' && (
          <div className="fw-status-help">
            <p>
              <strong>
                {t(
                  '¿Peligro inmediato? Llama primero a emergencias.',
                  'In immediate danger? Call emergency services first.',
                  'Em perigo imediato? Ligue primeiro para os serviços de emergência.',
                )}
              </strong>{' '}
              {t(
                'Este mensaje solo llega a quien tú elijas; no pide rescate.',
                'This message only reaches the people you choose; it does not request rescue.',
                'Esta mensagem só chega a quem você escolher; ela não pede resgate.',
              )}
            </p>
            {localNumber ? (
              <PhoneButton
                href={`tel:${localNumber.number}`}
                number={localNumber.number}
                label={localNumber.label[langIndex(lang)]}
              />
            ) : (
              <button type="button" className="fw-secondary" onClick={onHelp}>
                {t(
                  'Ver números de emergencia',
                  'See emergency numbers',
                  'Ver números de emergência',
                )}
              </button>
            )}
          </div>
        )}
        {/* Status first; ready messages and the reason stay one tap away, not in the way. */}
        <details className="fw-quick-details" open={!!quick}>
          <summary>
            {t('Usar un mensaje listo', 'Use a ready message', 'Usar uma mensagem pronta')}
          </summary>
          <div
            className="fw-quick-messages"
            role="group"
            aria-label={t('Mensajes listos', 'Ready messages', 'Mensagens prontas')}
          >
            <div>
              {quickMessages.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-status={m.status}
                  aria-pressed={quick === m.id}
                  onClick={() => applyQuick(m.id)}
                >
                  {m.label[langIndex(lang)]}
                </button>
              ))}
            </div>
          </div>
        </details>
        <div className="fw-message-fields">
          <label>
            {t('Dónde estás ahora', 'Where you are now', 'Onde você está agora')}
            <input
              maxLength={160}
              placeholder={t(
                'Hotel, barrio o punto de encuentro',
                'Hotel, neighborhood or meeting point',
                'Hotel, bairro ou ponto de encontro',
              )}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              aria-describedby={status === 'help' && !place.trim() ? 'fw-place-missing' : undefined}
            />
          </label>
          {/* A help request without a place leaves family and the embassy unable to find you. */}
          {status === 'help' && !place.trim() && (
            <p className="fw-place-missing" id="fw-place-missing">
              {t(
                'Pides ayuda: escribe dónde estás para que puedan encontrarte.',
                'You are asking for help: add where you are so you can be found.',
                'Você está pedindo ajuda: escreva onde está para que possam encontrar você.',
              )}
            </p>
          )}
          {(countryName || hotel?.name) && (
            <div
              className="fw-place-suggestions"
              role="group"
              aria-label={t(
                'Añadir un lugar al mensaje',
                'Add a place to the message',
                'Adicionar um local à mensagem',
              )}
            >
              {countryName && (
                <button
                  type="button"
                  onClick={() => {
                    setPlace(countryName);
                    change();
                  }}
                >
                  {suggestedLocation?.source === 'location'
                    ? t(
                        'Usar país según ubicación (aprox.):',
                        'Use country from location (approx.):',
                        'Usar país pela localização (aprox.):',
                      )
                    : t(
                        'Usar destino guardado:',
                        'Use saved destination:',
                        'Usar destino salvo:',
                      )}{' '}
                  {countryName}
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
                  {t('Usar hotel guardado:', 'Use saved hotel:', 'Usar hotel salvo:')} {hotel.name}
                </button>
              )}
            </div>
          )}
          {location && !suggestedLocation && (
            <p className="fw-location-hint">
              {t(
                'No se pudo determinar el país con una ubicación reciente. Escribe dónde estás.',
                'Could not determine the country from a recent location. Enter where you are.',
                'Não foi possível identificar o país com uma localização recente. Escreva onde você está.',
              )}
            </p>
          )}
          {status === 'moving' && (
            <label>
              {t('A dónde vas', 'Where you are heading', 'Para onde você vai')}
              <input
                maxLength={160}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t(
                  'Nombre del lugar o dirección',
                  'Place name or address',
                  'Nome do local ou endereço',
                )}
              />
            </label>
          )}
          {status === 'help' && (
            <div className="fw-help-request">
              <div
                className="fw-needs-presets"
                role="group"
                aria-label={t('Opciones de ayuda', 'Help suggestions', 'Opções de ajuda')}
              >
                {helpTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    aria-pressed={needs === template.text[langIndex(lang)]}
                    onClick={() => {
                      setNeeds(template.text[langIndex(lang)]);
                      setQuick('');
                      change();
                    }}
                  >
                    {template.label[langIndex(lang)]}
                  </button>
                ))}
              </div>
              <label>
                {t('Qué ayuda necesitas', 'What help you need', 'De que ajuda você precisa')}
                <textarea
                  maxLength={300}
                  rows={2}
                  value={needs}
                  onChange={(e) => {
                    setNeeds(e.target.value);
                    setQuick('');
                  }}
                  placeholder={t(
                    'Por ejemplo: necesito que contacten a mi seguro de viaje',
                    'For example: please contact my travel insurer',
                    'Por exemplo: preciso que entrem em contato com meu seguro viagem',
                  )}
                />
              </label>
            </div>
          )}
        </div>
        <details className="fw-checkin-optional">
          <summary>
            {t('Más detalles (opcional)', 'More details (optional)', 'Mais detalhes (opcional)')}
          </summary>
          <fieldset className="fw-message-reason">
            <legend>
              {t('Por qué escribes', 'Why you are writing', 'Por que você está escrevendo')}
            </legend>
            <div>
              {(Object.keys(contextLabels) as MessageContext[]).map((value) => (
                <label key={value} className={context === value ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="message-reason"
                    value={value}
                    checked={context === value}
                    onChange={() => setContext(value)}
                  />
                  {contextLabels[value][langIndex(lang)]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="fw-message-fields">
            <div className="fw-context-pair">
              <label>
                {t('Puedes contactarme', 'Reaching me', 'Como falar comigo')}
                <select
                  value={connection}
                  onChange={(e) => setConnection(e.target.value as Connection | '')}
                >
                  <option value="">{t('Sin indicar', 'Not specified', 'Não informado')}</option>
                  {Object.entries(connectionLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label[langIndex(lang)]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t('Volveré a avisar', "I'll check in again", 'Volto a dar notícias')}
                <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                  <option value={0}>
                    {t('Sin acordar una hora', 'No time agreed', 'Sem horário combinado')}
                  </option>
                  {[15, 30, 60, 120].map((v) => (
                    <option key={v} value={v}>
                      {t('En', 'In', 'Em')} {v} min
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
                  'É um compromisso na sua mensagem. O lembrete aparece com o Faro aberto.',
                )}
              </small>
            )}
          </div>
          {(profile?.phone || profile?.email) && (
            <fieldset className="fw-contact-inclusion">
              <legend>
                {t(
                  'Incluir cómo contactarme',
                  'Include how to reach me',
                  'Incluir como falar comigo',
                )}
              </legend>
              {profile.phone && (
                <label>
                  <input
                    type="checkbox"
                    checked={includePhone}
                    onChange={(e) => setIncludePhone(e.target.checked)}
                  />
                  {t('Mi teléfono', 'My phone', 'Meu telefone')} · {profile.phone}
                </label>
              )}
              {profile.email && (
                <label>
                  <input
                    type="checkbox"
                    checked={includeEmail}
                    onChange={(e) => setIncludeEmail(e.target.checked)}
                  />
                  {t('Mi correo', 'My email', 'Meu e-mail')} · {profile.email}
                </label>
              )}
            </fieldset>
          )}
          <div className="fw-checkin-fields">
            <label>
              {t('Tu nombre', 'Your name', 'Seu nome')}
              <input
                autoComplete="given-name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              {t('Con quién estás', 'Who you are with', 'Com quem você está')}
              <input
                maxLength={160}
                value={companions}
                onChange={(e) => {
                  setCompanions(e.target.value);
                  setQuick('');
                }}
                placeholder={t(
                  'Mis compañeros de trabajo',
                  'My colleagues',
                  'Meus colegas de trabalho',
                )}
              />
            </label>
          </div>
          <label>
            {t(
              'Algo más que quieras contar',
              'Anything else to add',
              'Algo mais que queira contar',
            )}
            <textarea
              maxLength={600}
              rows={2}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setQuick('');
              }}
            />
          </label>
          <label>
            {t(
              'Si no respondo, contacten a…',
              'If I do not reply, contact…',
              'Se eu não responder, falem com…',
            )}
            <input
              maxLength={300}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t(
                'Nombre y teléfono de un contacto alternativo',
                'Name and phone number of an alternative contact',
                'Nome e telefone de um contato alternativo',
              )}
            />
          </label>
          {context === 'earthquake' && (
            <label>
              {t(
                'Añadir un reporte oficial',
                'Add an official report',
                'Adicionar um registro oficial',
              )}
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
                <option value="">
                  {t('Sin adjuntar un reporte', 'No report attached', 'Sem registro anexado')}
                </option>
                {event && !events.some((item) => item.id === event.id) && (
                  <option value={event.id}>
                    M {event.mag ?? '—'} · {displayPlace(event.place)}
                  </option>
                )}
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    M {item.mag ?? '—'} · {displayPlace(item.place)} ·{' '}
                    {checkInTime(item.time, lang)}
                  </option>
                ))}
              </select>
              <small>
                {t(
                  'Reportes de la vista actual del mapa. Elige solo el que quieras mencionar; no indica cómo te afectó.',
                  'Reports from the current map view. Choose only the one you want to mention; it does not show how you were affected.',
                  'Registros da área visível do mapa. Escolha só o que quiser mencionar; ele não indica como isso afetou você.',
                )}
              </small>
            </label>
          )}
        </details>
        <button type="submit" className="fw-primary" disabled={!status}>
          {t('Revisar mensaje', 'Review message', 'Revisar mensagem')}
          <ArrowRightIcon size={17} />
        </button>
        <small className="fw-checkin-privacy">
          {t(
            'Revisa el texto y después elige cómo compartirlo.',
            'Review the text, then choose how to share it.',
            'Revise o texto e depois escolha como compartilhá-lo.',
          )}
        </small>
      </form>
      <aside className="fw-checkin-aside">
        <section
          className={`fw-message-preview ${visibleRecord ? 'has-message' : 'is-empty'}`}
          ref={preview}
          tabIndex={-1}
          aria-label={t('Vista previa del mensaje', 'Message preview', 'Prévia da mensagem')}
        >
          <header>
            <div className="fw-preview-title">
              <h2>{t('Tu mensaje', 'Your message', 'Sua mensagem')}</h2>
              <span className={`fw-draft-badge ${shareAllowed ? 'ready' : ''}`}>
                {shareAllowed
                  ? t('Listo para compartir', 'Ready to share', 'Pronta para compartilhar')
                  : t('Borrador', 'Draft', 'Rascunho')}
              </span>
            </div>
            <label className="fw-output-language">
              {t('Idioma del mensaje', 'Message language', 'Idioma da mensagem')}
              <select
                value={outputLang}
                onChange={(e) => {
                  setMessageLanguage(e.target.value as Lang);
                  change();
                }}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </label>
            {outputLang !== lang && (
              <p className="fw-language-note">
                {t(
                  'Los nombres y detalles se mantienen como los escribiste.',
                  'Names and details stay in the language you entered.',
                  'Nomes e detalhes ficam no idioma em que você escreveu.',
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
                          'A prévia inclui suas alterações. Confirme a mensagem antes de compartilhar.',
                        )
                      : expired
                        ? t(
                            'Revisa cómo estás antes de volver a compartir este mensaje.',
                            'Review how you are before sharing this message again.',
                            'Revise como você está antes de compartilhar esta mensagem de novo.',
                          )
                        : t(
                            'No se pudo guardar. Puedes compartirlo ahora; se perderá al cerrar o recargar Faro.',
                            'Could not save. You can share it now; it will be lost if you close or reload Faro.',
                            'Não foi possível salvar. Você pode compartilhá-la agora; ela será perdida se você fechar ou recarregar o Faro.',
                          )}
                  </p>
                  {(changed || expired) && (
                    <button onClick={review}>
                      {t('Revisar mi estado', 'Review my status', 'Revisar meu status')}
                    </button>
                  )}
                </div>
              )}
              {prepared && !changed && (
                <button className="fw-edit-message" onClick={review}>
                  {t('Editar datos', 'Edit details', 'Editar dados')}
                </button>
              )}
              <div
                className="fw-message-body"
                role="region"
                aria-label={t(
                  'Mensaje para compartir',
                  'Message to share',
                  'Mensagem para compartilhar',
                )}
              >
                {message.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              {!prepared && (
                <p className="fw-draft-hint">
                  {t(
                    'Pulsa «Revisar mensaje» antes de compartir.',
                    'Select “Review message” before sharing.',
                    'Use o botão “Revisar mensagem” antes de compartilhar.',
                  )}
                </p>
              )}
              <ShareButtons
                lang={lang}
                text={message}
                subject={t('Cómo estoy', 'How I am', 'Como estou')}
                enabled={shareAllowed}
                allow={() => canShareCheckIn(prepared, changed, Date.now())}
                label={t(
                  'Compartir mensaje preparado',
                  'Share prepared message',
                  'Compartilhar mensagem preparada',
                )}
              />
              <small>
                {t(
                  'Elige el contacto en tu app y confirma el envío allí. No se adjunta tu GPS.',
                  'Choose a contact in your app and confirm sending there. Your GPS is not attached.',
                  'Escolha o contato no seu app e confirme o envio lá. Seu GPS não é anexado.',
                )}
              </small>
            </>
          ) : (
            <div className="fw-preview-empty">
              <p>
                {t(
                  'Elige cómo estás. Verás el mensaje completo aquí mientras añades información.',
                  'Choose how you are. Your full message will appear here as you add details.',
                  'Escolha como você está. A mensagem completa aparecerá aqui conforme você adiciona informações.',
                )}
              </p>
            </div>
          )}
        </section>
        {/* Always present, so a screen reader announces the feedback when it appears. */}
        <p className="fw-share-feedback" role="status">
          {feedback}
        </p>
        {history.length > 0 && (
          <details className="fw-checkin-history">
            <summary>
              {t('Mensajes anteriores', 'Previous messages', 'Mensagens anteriores')} (
              {history.length})
            </summary>
            <p>
              {t(
                'Guardados en este navegador. No indican tu situación actual.',
                'Saved in this browser. They do not describe your current situation.',
                'Salvas neste navegador. Não indicam sua situação atual.',
              )}
            </p>
            <ol>
              {history.map((row) => (
                <li key={row.id}>
                  <strong>{statusLabels[row.status][langIndex(lang)]}</strong>
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
                    'Apagar as mensagens anteriores deste navegador?',
                  )}
                </p>
                <button className="fw-secondary" onClick={clear}>
                  {t(
                    'Borrar mensajes anteriores',
                    'Delete previous messages',
                    'Apagar mensagens anteriores',
                  )}
                </button>
                <button className="fw-text" onClick={() => setConfirmClear(false)}>
                  {t('Cancelar', 'Cancel', 'Cancelar')}
                </button>
              </div>
            ) : (
              <button className="fw-text" onClick={() => setConfirmClear(true)}>
                {t('Borrar historial', 'Delete history', 'Apagar histórico')}
              </button>
            )}
          </details>
        )}
        <div className="fw-followup-note">
          <button className="fw-text" onClick={onHelp}>
            {t(
              'Ver teléfonos de emergencia',
              'View emergency numbers',
              'Ver telefones de emergência',
            )}
          </button>
          <p>
            {t(
              'Para un próximo contacto, acuerda una hora con alguien. Faro no avisa a otras personas automáticamente.',
              'For a later check-in, agree on a time with someone. Faro does not notify other people automatically.',
              'Para dar notícias depois, combine um horário com alguém. O Faro não avisa outras pessoas automaticamente.',
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}

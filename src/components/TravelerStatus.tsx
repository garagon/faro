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
import {
  ArrowRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  HistoryIcon,
  ListPlusIcon,
  PhoneIcon,
} from 'lucide-react';
import ShareButtons from './ShareButtons.tsx';
import {
  ActionBar,
  Button,
  CallButton,
  ChoiceChip,
  Chips,
  Disclosure,
  Field,
  List,
  ListRow,
  MessageText,
  Note,
  RadioList,
  RowIcon,
  SafetyNotice,
  ScopeNote,
  SelectField,
  TextArea,
} from '../ui/index.ts';
import { emergencyFor } from '../lib/emergency.ts';
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
    [confirmClear, setConfirmClear] = useState(false),
    // Only the message language changed since the review: said as such, not as "your changes".
    [languageOnly, setLanguageOnly] = useState(false);
  const change = () => {
    setDirty(true);
    setLanguageOnly(false);
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
    // The chosen status, or the first one when none is chosen yet (the radios are buttons).
    (
      form.current?.querySelector<HTMLElement>(
        '[role=radiogroup] [role=radio][aria-checked=true]',
      ) ?? form.current?.querySelector<HTMLElement>('[role=radiogroup] [role=radio]')
    )?.focus({ preventScroll: true });
    form.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    setLanguageOnly(false);
    const at = Date.now();
    const row = { ...makeRecord(at), id: newId() };
    const result = prepareCheckIn(row, history);
    setPrepared(row);
    setPreparedLanguage(outputLang);
    setNotSaved(!result.persisted);
    if (result.persisted) onHistory(result.rows);
    setDirty(false);
    setFeedback('');
    // One column at every width: the preview is below the form, so bring it into view.
    // In one column the preview is below the form, so it is brought into view. On wide screens
    // it is the side pane, already in view beside the form: focus moves there, the page stays.
    requestAnimationFrame(() => {
      const box = preview.current;
      box?.focus({ preventScroll: true });
      if (box && getComputedStyle(box).position !== 'sticky')
        box.scrollIntoView({ block: 'start', behavior: 'instant' });
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
  const idx = langIndex(lang);
  const statusMeta = {
    ok: t(
      'Un mensaje breve para tranquilizar',
      'A short message to reassure others',
      'Mensagem curta para tranquilizar',
    ),
    moving: t(
      'Puedes decir a dónde vas',
      "You can say where you're heading",
      'Você pode dizer para onde vai',
    ),
    help: t(
      'Di qué necesitas y dónde estás',
      'Say where and what you need',
      'Diga do que precisa e onde está',
    ),
  };
  const notice = !!visibleRecord && ((!!prepared && (changed || expired)) || notSaved);
  return (
    // Wide screens: the form, and beside it the message to send (helpers.css, f-two).
    <div className="f-column f-two">
      <form
        ref={form}
        className="f-section @container grid gap-3 [&_:is(input,select,textarea,button,summary,a)]:scroll-mb-18"
        aria-labelledby="fw-status-title"
        onSubmit={save}
        onChange={change}
      >
        <div className="f-section-head flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2
            className="f-section-title m-0 text-base leading-snug font-semibold"
            id="fw-status-title"
          >
            {t('¿Cómo estás?', 'How are you?', 'Como você está?')}
          </h2>
        </div>
        <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
          <p>
            {t(
              'Elige una opción. Verás el mensaje completo y podrás editarlo antes de enviarlo.',
              'Choose an option. You will see the full message and can edit it before sending.',
              'Escolha uma opção. Você verá a mensagem completa e poderá editá-la antes de enviar.',
            )}
          </p>
        </div>
        <div className="f-stack grid gap-4">
          <RadioList
            name="personal-status"
            legend={t('Tu estado ahora', 'Your status now', 'Seu status agora')}
            required
            value={status}
            onChange={(s) => {
              setStatus(s);
              setQuick('');
            }}
            options={(['ok', 'moving', 'help'] as const).map((s, i) => {
              const Icon = [CircleCheckIcon, ArrowRightIcon, CircleAlertIcon][i];
              return {
                value: s,
                title: statusLabels[s][idx],
                meta: statusMeta[s],
                icon: <Icon className="size-4" />,
              };
            })}
          />
          {status === 'help' && (
            <>
              <SafetyNotice>
                {t(
                  '¿Peligro inmediato? Llama primero a emergencias. Este mensaje solo llega a quien tú elijas; no pide rescate.',
                  'In immediate danger? Call emergency services first. This message only reaches the people you choose; it does not request rescue.',
                  'Em perigo imediato? Ligue primeiro para os serviços de emergência. Esta mensagem só chega a quem você escolher; ela não pede resgate.',
                )}
              </SafetyNotice>
              {localNumber ? (
                <CallButton
                  number={localNumber.number}
                  label={t(
                    `Llamar al ${localNumber.number}`,
                    `Call ${localNumber.number}`,
                    `Ligar para ${localNumber.number}`,
                  )}
                  note={localNumber.label[idx]}
                />
              ) : (
                <Button variant="secondary" onClick={onHelp}>
                  {t(
                    'Ver números de emergencia',
                    'See emergency numbers',
                    'Ver números de emergência',
                  )}
                </Button>
              )}
            </>
          )}
          {/* Status first; a ready message is a shortcut that fills the form, never in the way. */}
          <SelectField
            id="fw-status-quick"
            label={t('Usar un mensaje listo', 'Use a ready message', 'Usar uma mensagem pronta')}
            hint={t(
              'Opcional. Puedes cambiar todo después.',
              'Optional. You can change everything afterwards.',
              'Opcional. Você pode mudar tudo depois.',
            )}
            value={quick}
            onChange={(e) => applyQuick(e.target.value)}
          >
            <option value="" disabled>
              {t('Elige uno', 'Choose one', 'Escolha uma')}
            </option>
            {quickMessages.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label[idx]}
              </option>
            ))}
          </SelectField>
          <Field
            id="fw-status-place"
            label={t('Dónde estás ahora', 'Where you are now', 'Onde você está agora')}
            maxLength={160}
            // Short enough to show whole in a 320 px field.
            placeholder={t(
              'Hotel o punto de encuentro',
              'Hotel or meeting point',
              'Hotel ou ponto de encontro',
            )}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            aria-describedby={status === 'help' && !place.trim() ? 'fw-place-missing' : undefined}
          />
          {/* A help request without a place leaves family and the embassy unable to find you. */}
          {status === 'help' && !place.trim() && (
            <div id="fw-place-missing">
              <SafetyNotice>
                {t(
                  'Pides ayuda: escribe dónde estás para que puedan encontrarte.',
                  'You are asking for help: add where you are so you can be found.',
                  'Você está pedindo ajuda: escreva onde está para que possam encontrar você.',
                )}
              </SafetyNotice>
            </div>
          )}
          {(countryName || hotel?.name) && (
            // Actions that fill the field: buttons, not links.
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={t(
                'Añadir un lugar al mensaje',
                'Add a place to the message',
                'Adicionar um local à mensagem',
              )}
            >
              {countryName && (
                <Button
                  variant="secondary"
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
                </Button>
              )}
              {hotel?.name && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPlace(`${hotel.name}, ${countryName}`);
                    change();
                  }}
                >
                  {t('Usar hotel guardado:', 'Use saved hotel:', 'Usar hotel salvo:')} {hotel.name}
                </Button>
              )}
            </div>
          )}
          {location && !suggestedLocation && (
            <Note>
              {t(
                'No se pudo determinar el país con una ubicación reciente. Escribe dónde estás.',
                'Could not determine the country from a recent location. Enter where you are.',
                'Não foi possível identificar o país com uma localização recente. Escreva onde você está.',
              )}
            </Note>
          )}
          {status === 'moving' && (
            <Field
              id="fw-status-destination"
              label={t('A dónde vas', 'Where you are heading', 'Para onde você vai')}
              maxLength={160}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={t(
                'Nombre del lugar o dirección',
                'Place name or address',
                'Nome do local ou endereço',
              )}
            />
          )}
          {status === 'help' && (
            <>
              <TextArea
                id="fw-status-needs"
                label={t('Qué ayuda necesitas', 'What help you need', 'De que ajuda você precisa')}
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
              {/* Choices that fill the field: chips, pressed when the field holds their text. */}
              <Chips label={t('Opciones de ayuda', 'Help suggestions', 'Opções de ajuda')}>
                {helpTemplates.map((template) => (
                  <ChoiceChip
                    key={template.id}
                    pressed={needs === template.text[idx]}
                    onClick={() => {
                      setNeeds(template.text[idx]);
                      setQuick('');
                      change();
                    }}
                  >
                    {template.label[idx]}
                  </ChoiceChip>
                ))}
              </Chips>
            </>
          )}
          <Disclosure
            lead={<RowIcon icon={<ListPlusIcon className="size-4" />} />}
            title={t(
              'Más detalles (opcional)',
              'More details (optional)',
              'Mais detalhes (opcional)',
            )}
            meta={t(
              'Motivo, contacto, nombre y más',
              'Reason, contact, name and more',
              'Motivo, contato, nome e mais',
            )}
          >
            <SelectField
              id="fw-status-reason"
              label={t('Por qué escribes', 'Why you are writing', 'Por que você está escrevendo')}
              value={context}
              onChange={(e) => setContext(e.target.value as MessageContext | '')}
            >
              <option value="">{t('Sin indicar', 'Not specified', 'Não informado')}</option>
              {(Object.keys(contextLabels) as MessageContext[]).map((value) => (
                <option key={value} value={value}>
                  {contextLabels[value][idx]}
                </option>
              ))}
            </SelectField>
            {context === 'earthquake' && (
              <SelectField
                id="fw-status-event"
                label={t(
                  'Añadir un reporte oficial',
                  'Add an official report',
                  'Adicionar um registro oficial',
                )}
                hint={t(
                  'Reportes de la vista actual del mapa. Elige solo el que quieras mencionar; no indica cómo te afectó.',
                  'Reports from the current map view. Choose only the one you want to mention; it does not show how you were affected.',
                  'Registros da área visível do mapa. Escolha só o que quiser mencionar; ele não indica como isso afetou você.',
                )}
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
              </SelectField>
            )}
            <SelectField
              id="fw-status-connection"
              label={t('Puedes contactarme', 'Reaching me', 'Como falar comigo')}
              value={connection}
              onChange={(e) => setConnection(e.target.value as Connection | '')}
            >
              <option value="">{t('Sin indicar', 'Not specified', 'Não informado')}</option>
              {Object.entries(connectionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label[idx]}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="fw-status-minutes"
              label={t('Volveré a avisar', "I'll check in again", 'Volto a dar notícias')}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              <option value={0}>
                {t('Sin acordar una hora', 'No time agreed', 'Sem horário combinado')}
              </option>
              {[15, 30, 60, 120].map((v) => (
                <option key={v} value={v}>
                  {t('En', 'In', 'Em')} {v} min
                </option>
              ))}
            </SelectField>
            {minutes > 0 && (
              <Note>
                {t(
                  'Es un compromiso en tu mensaje. El recordatorio aparece con Faro abierto.',
                  'This is a commitment in your message. The reminder appears while Faro is open.',
                  'É um compromisso na sua mensagem. O lembrete aparece com o Faro aberto.',
                )}
              </Note>
            )}
            {(profile?.phone || profile?.email) && (
              <div className="grid gap-3">
                <span className="text-sm leading-snug font-medium" aria-hidden="true">
                  {t(
                    'Incluir cómo contactarme',
                    'Include how to reach me',
                    'Incluir como falar comigo',
                  )}
                </span>
                <Chips
                  label={t(
                    'Incluir cómo contactarme',
                    'Include how to reach me',
                    'Incluir como falar comigo',
                  )}
                >
                  {profile.phone && (
                    <ChoiceChip
                      pressed={includePhone}
                      onClick={() => {
                        setIncludePhone(!includePhone);
                        change();
                      }}
                    >
                      {t('Mi teléfono', 'My phone', 'Meu telefone')} · {profile.phone}
                    </ChoiceChip>
                  )}
                  {profile.email && (
                    <ChoiceChip
                      pressed={includeEmail}
                      onClick={() => {
                        setIncludeEmail(!includeEmail);
                        change();
                      }}
                    >
                      {t('Mi correo', 'My email', 'Meu e-mail')} · {profile.email}
                    </ChoiceChip>
                  )}
                </Chips>
              </div>
            )}
            <Field
              id="fw-status-name"
              label={t('Tu nombre', 'Your name', 'Seu nome')}
              autoComplete="given-name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Field
              id="fw-status-companions"
              label={t('Con quién estás', 'Who you are with', 'Com quem você está')}
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
            <TextArea
              id="fw-status-note"
              label={t(
                'Algo más que quieras contar',
                'Anything else to add',
                'Algo mais que queira contar',
              )}
              maxLength={600}
              rows={2}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setQuick('');
              }}
            />
            <Field
              id="fw-status-contact"
              label={t(
                'Si no respondo, contacten a…',
                'If I do not reply, contact…',
                'Se eu não responder, falem com…',
              )}
              maxLength={300}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              // Too long for a placeholder on a phone: said above the field instead.
              hint={t(
                'Nombre y teléfono de un contacto alternativo',
                'Name and phone number of an alternative contact',
                'Nome e telefone de um contato alternativo',
              )}
            />
          </Disclosure>
        </div>
        {/* The one main action, above the bottom tabs while the form is on screen. */}
        <ActionBar>
          <Button type="submit" block disabled={!status}>
            {t('Revisar mensaje', 'Review message', 'Revisar mensagem')}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Button>
        </ActionBar>
        <Note>
          {t(
            'Revisa el texto y después elige cómo compartirlo.',
            'Review the text, then choose how to share it.',
            'Revise o texto e depois escolha como compartilhá-lo.',
          )}
        </Note>
      </form>

      <section
        className="f-section @container grid gap-3"
        data-side=""
        style={{ '--f-side-span': 2 } as React.CSSProperties}
        ref={preview}
        tabIndex={-1}
        aria-label={t('Vista previa del mensaje', 'Message preview', 'Prévia da mensagem')}
      >
        <div className="f-section-head flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="f-section-title m-0 text-base leading-snug font-semibold">
            {t('Tu mensaje', 'Your message', 'Sua mensagem')}
          </h2>
          <span className="f-section-aside text-sm text-muted-foreground data-[state=stale]:text-amber-900">
            {shareAllowed
              ? t('Listo para compartir', 'Ready to share', 'Pronta para compartilhar')
              : t('Borrador', 'Draft', 'Rascunho')}
          </span>
        </div>
        <SelectField
          id="fw-status-language"
          label={t('Idioma del mensaje', 'Message language', 'Idioma da mensagem')}
          value={outputLang}
          onChange={(e) => {
            setMessageLanguage(e.target.value as Lang);
            change();
            setLanguageOnly(true);
          }}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="pt">Português</option>
        </SelectField>
        {outputLang !== lang && (
          <Note>
            {t(
              'Los nombres y detalles se mantienen como los escribiste.',
              'Names and details stay in the language you entered.',
              'Nomes e detalhes ficam no idioma em que você escreveu.',
            )}
          </Note>
        )}
        {visibleRecord ? (
          <>
            {notice && (
              <div className="f-stack grid gap-2" data-gap="sm" role="status">
                <Note>
                  {changed && languageOnly
                    ? t(
                        'Cambiaste el idioma del mensaje. Revísalo de nuevo antes de compartir.',
                        'You changed the message language. Review it again before sharing.',
                        'Você mudou o idioma da mensagem. Revise de novo antes de compartilhar.',
                      )
                    : changed
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
                </Note>
                {(changed || expired) && (
                  <Button variant="secondary" onClick={review}>
                    {t('Revisar mi estado', 'Review my status', 'Revisar meu status')}
                  </Button>
                )}
              </div>
            )}
            <MessageText
              label={t('Mensaje para compartir', 'Message to share', 'Mensagem para compartilhar')}
            >
              {message.split('\n\n').map((paragraph, index, all) => (
                <p key={index}>
                  {index > 0 && index === all.length - 1 ? <small>{paragraph}</small> : paragraph}
                </p>
              ))}
            </MessageText>
            {prepared && !changed && (
              <Button variant="secondary" onClick={review}>
                {t('Editar datos', 'Edit details', 'Editar dados')}
              </Button>
            )}
            {/* On a phone the form's review button is far above; this one is next to sharing. */}
            {!prepared && (
              <div className="f-stack grid gap-2" data-gap="sm">
                <Note>
                  {t(
                    'Revisa el mensaje antes de compartir.',
                    'Review the message before sharing.',
                    'Revise a mensagem antes de compartilhar.',
                  )}
                </Note>
                {status && (
                  <Button variant="secondary" onClick={() => form.current?.requestSubmit()}>
                    {t('Revisar mensaje', 'Review message', 'Revisar mensagem')}
                  </Button>
                )}
              </div>
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
            <Note>
              {t(
                'Elige el contacto en tu app y confirma el envío allí. No se adjunta tu GPS.',
                'Choose a contact in your app and confirm sending there. Your GPS is not attached.',
                'Escolha o contato no seu app e confirme o envio lá. Seu GPS não é anexado.',
              )}
            </Note>
          </>
        ) : (
          <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
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

      <div className="f-stack" data-gap="lg">
        {history.length > 0 && (
          <Disclosure
            lead={<RowIcon icon={<HistoryIcon className="size-4" />} />}
            title={`${t('Mensajes preparados', 'Prepared messages', 'Mensagens preparadas')} (${history.length})`}
            meta={t(
              'Guardados en este navegador',
              'Saved in this browser',
              'Salvas neste navegador',
            )}
          >
            <Note>
              {t(
                'Guardados en este navegador. No indican tu situación actual.',
                'Saved in this browser. They do not describe your current situation.',
                'Salvas neste navegador. Não indicam sua situação atual.',
              )}
            </Note>
            <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
              <ul>
                {history.map((row) => (
                  <li key={row.id}>
                    {statusLabels[row.status][idx]}
                    <br />
                    <small>
                      <time>{checkInTime(row.at, lang)}</time>
                      {row.place && ` · ${row.place}`}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
            {confirmClear ? (
              <div
                className="f-stack f-prose grid max-w-2xl gap-2 *:m-0 [&_dt]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5"
                data-gap="sm"
              >
                <p>
                  {t(
                    '¿Borrar los mensajes anteriores de este navegador?',
                    'Delete previous messages from this browser?',
                    'Apagar as mensagens anteriores deste navegador?',
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={clear}>
                    {t(
                      'Borrar mensajes anteriores',
                      'Delete previous messages',
                      'Apagar mensagens anteriores',
                    )}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmClear(false)}>
                    {t('Cancelar', 'Cancel', 'Cancelar')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" data-tone="error" onClick={() => setConfirmClear(true)}>
                {t('Borrar historial', 'Delete history', 'Apagar histórico')}
              </Button>
            )}
          </Disclosure>
        )}

        <div className="f-stack grid gap-2" data-gap="sm">
          {/* Always present, so a screen reader announces the feedback when it appears. */}
          <div role="status">{feedback && <Note>{feedback}</Note>}</div>
          {/* Another screen: a row that opens Emergencia at its numbers. */}
          <List>
            <ListRow
              lead={<RowIcon icon={<PhoneIcon className="size-4" />} />}
              title={t('Teléfonos de emergencia', 'Emergency numbers', 'Telefones de emergência')}
              meta={t('En Emergencia', 'In Emergency', 'Em Emergência')}
              onClick={onHelp}
            />
          </List>
        </div>
        <ScopeNote>
          {t(
            'Para un próximo contacto, acuerda una hora con alguien. Faro no avisa a otras personas automáticamente.',
            'For a later check-in, agree on a time with someone. Faro does not notify other people automatically.',
            'Para dar notícias depois, combine um horário com alguém. O Faro não avisa outras pessoas automaticamente.',
          )}
        </ScopeNote>
      </div>
    </div>
  );
}

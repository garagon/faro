import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  DownloadIcon,
} from 'lucide-react';
import CountrySearch from './CountrySearch.tsx';
import ShareButtons from './ShareButtons.tsx';
import {
  bloodTypes,
  emptyEmergencyInfo,
  fichaText,
  readEmergencyInfo,
  storeEmergencyInfo,
  validEmergencyPhone,
  type EmergencyInfo,
} from '../lib/emergencyProfile.ts';
import { validProfileEmail, validProfilePhone, type Preferences } from '../lib/preferences.ts';
import { planCoordinates, type HotelPlan } from '../lib/resources.ts';
import { cardLines, downloadCardImage } from '../lib/travelCardImage.ts';
import { readContacts } from '../lib/tripData.ts';
import { displayPhone } from '../lib/phone.ts';
import type { Geo } from './WebMap.tsx';
import { pick, type Lang } from '../lib/i18n.ts';
import {
  Button,
  CheckRow,
  Disclosure,
  Field,
  List,
  MessagePreview,
  Note,
  RowIcon,
  Section,
  SelectField,
  Text,
  TextArea,
} from '../ui/index.ts';

type Props = {
  lang: Lang;
  country: string;
  countryCodes: readonly string[];
  profile: Preferences | null;
  plan: HotelPlan | null;
  geo: Geo | null;
  /** `follow`: the person picked another country here, so the app moves to it. */
  onSave: (profile: Preferences, plan: HotelPlan | null, follow: boolean) => boolean;
  /** False when the browser kept part of the data. */
  onDeleteAll: () => boolean;
};

type Fields = {
  name: string;
  nationality: string;
  destination: string;
  phone: string;
  email: string;
  stayName: string;
  meeting: string;
  notes: string;
  lat: string;
  lng: string;
};
type InfoPart = 'contact' | 'health' | 'insurance' | 'stay';
/**
 * What the person typed and has not saved, kept apart from the saved data: fields they have not
 * touched keep following the saved profile (a nationality chosen on another screen, the country
 * being browsed). It lives only in memory, never in storage.
 */
type Edits = {
  fields: Partial<Fields>;
  info: { [K in InfoPart]?: Partial<EmergencyInfo[K]> };
};
const noEdits: Edits = { fields: {}, info: {} };

/**
 * The traveler's details for an emergency, in five short sections, and the card they make,
 * ready to send by any messaging app. Nothing is required and nothing leaves the browser
 * unless the person shares it.
 */
export default function TripProfile(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt);
  const names = new Intl.DisplayNames([p.lang], { type: 'region' });
  // "Todo el mundo" is not a place to be in: the country starts empty until the person picks one.
  const world = !p.countryCodes.includes(p.country);
  const [savedInfo, setSavedInfo] = useState(() => readEmergencyInfo() ?? emptyEmergencyInfo());
  const [edits, setEdits] = useState<Edits>(noEdits);
  const info: EmergencyInfo = {
    ...savedInfo,
    contact: { ...savedInfo.contact, ...edits.info.contact },
    health: { ...savedInfo.health, ...edits.info.health },
    insurance: { ...savedInfo.insurance, ...edits.info.insurance },
    stay: { ...savedInfo.stay, ...edits.info.stay },
  };
  const draft: Fields = {
    name: p.profile?.name ?? '',
    nationality: p.profile?.nationality ?? '',
    destination: world ? '' : (p.profile?.destination ?? p.country),
    phone: p.profile?.phone ?? '',
    email: p.profile?.email ?? '',
    stayName: p.plan?.name ?? '',
    meeting: p.plan?.meeting ?? '',
    notes: p.plan?.notes ?? '',
    lat: p.plan?.lat ?? '',
    lng: p.plan?.lng ?? '',
    ...edits.fields,
  };
  const [status, setStatus] = useState<
    'saved' | 'invalid' | 'storage' | 'deleted' | 'notDeleted' | null
  >(null);
  // The country the app moved to with the last save, named in its confirmation.
  const [movedTo, setMovedTo] = useState('');
  // After a save with errors, each section's header says what to fix inside it.
  const [attempted, setAttempted] = useState(false);
  const [openSteps, setOpenSteps] = useState<number[]>([1]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageNote, setImageNote] = useState('');
  // The coordinates are a rarely used part of the stay section: closed until asked for.
  const [coordinatesOpen, setCoordinatesOpen] = useState(false);
  const destinationField = useRef<HTMLDivElement>(null);
  const statusRegion = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<Fields>) => {
    setEdits((e) => ({ ...e, fields: { ...e.fields, ...patch } }));
    setStatus(null);
  };
  const setInfo = <K extends InfoPart>(key: K, patch: Partial<EmergencyInfo[K]>) => {
    setEdits((e) => ({ ...e, info: { ...e.info, [key]: { ...e.info[key], ...patch } } }));
    setStatus(null);
  };
  const toggleStep = (n: number, open: boolean) =>
    setOpenSteps((s) => (open ? (s.includes(n) ? s : [...s, n]) : s.filter((x) => x !== n)));
  // From the empty card: open "Tus datos" and put the cursor in its first field.
  const completeDetails = () => {
    flushSync(() => toggleStep(1, true));
    document.getElementById('trip-name')?.focus();
  };

  const labels = {
    destination: t('País donde estás', 'Country you are in', 'País onde você está'),
    phone: t('Tu teléfono', 'Your phone', 'Seu telefone'),
    email: t('Tu correo', 'Your email', 'Seu e-mail'),
    contactPhone: t('Teléfono', 'Phone', 'Telefone'),
    insurancePhone: t('Teléfono de asistencia', 'Assistance phone', 'Telefone da assistência'),
    dates: t('Salida', 'Departure', 'Saída'),
    coordinates: t('Coordenadas', 'Coordinates', 'Coordenadas'),
  };
  const errors = {
    destination: !draft.destination,
    phone: !!draft.phone.trim() && !validProfilePhone(draft.phone),
    email: !!draft.email.trim() && !validProfileEmail(draft.email),
    contactPhone: !validEmergencyPhone(info.contact.phone),
    insurancePhone: !validEmergencyPhone(info.insurance.phone),
    coordinates:
      (!!draft.lat.trim() || !!draft.lng.trim()) &&
      !planCoordinates({ ...emptyPlanFields, lat: draft.lat, lng: draft.lng }),
    dates: !!info.stay.arrival && !!info.stay.departure && info.stay.departure < info.stay.arrival,
  };
  // Every check in the order the fields appear: its section and the field that carries the mark.
  const checks: { key: keyof typeof errors; step: number; field: string }[] = [
    { key: 'destination', step: 1, field: '' },
    { key: 'phone', step: 1, field: 'trip-phone' },
    { key: 'email', step: 1, field: 'trip-email' },
    { key: 'contactPhone', step: 2, field: 'trip-contact-phone' },
    { key: 'insurancePhone', step: 4, field: 'trip-insurance-phone' },
    { key: 'dates', step: 5, field: 'trip-departure' },
    { key: 'coordinates', step: 5, field: 'trip-lng' },
  ];
  const failing = checks.filter((c) => errors[c.key]);
  // The header caption of a section with something to fix, once the person has tried to save.
  const stepProblem = (step: number) => {
    const here = attempted ? failing.filter((c) => c.step === step) : [];
    if (!here.length) return undefined;
    return here.length === 1
      ? `${t('Revisa', 'Check', 'Confira')}: ${labels[here[0].key]}`
      : t(
          `Revisa ${here.length} campos`,
          `Check ${here.length} fields`,
          `Confira ${here.length} campos`,
        );
  };
  // An error replaces the field's hint, with a mark so it is not read as a plain hint.
  const problem = (text: string) => (
    <>
      <CircleAlertIcon className="size-4" aria-hidden="true" /> {text}
    </>
  );
  const checkNumber = problem(t('Revisa el número.', 'Check the number.', 'Confira o número.'));
  // Examples follow the country you are in: Panama's prefix there, no country's number elsewhere.
  const panama = draft.destination === 'PA';
  const phoneExample = panama
    ? displayPhone('+50760000000')
    : t('+ código de país y número', '+ country code and number', '+ código do país e número');

  const card = fichaText(p.lang, {
    country: draft.destination,
    profile: {
      name: draft.name,
      nationality: draft.nationality,
      phone: draft.phone,
      email: draft.email,
    },
    info,
    plan: { name: draft.stayName, meeting: draft.meeting },
  });
  const filled = [
    draft.name,
    draft.nationality,
    draft.phone,
    draft.email,
    info.contact.name,
    info.contact.phone,
    info.insurance.company,
    info.insurance.policy,
    info.insurance.phone,
    draft.stayName,
    info.stay.address,
    draft.meeting,
    info.health.share
      ? info.health.allergies + info.health.conditions + info.health.medications
      : '',
  ].some((v) => v.trim());

  function save(e: FormEvent) {
    e.preventDefault();
    const first = failing[0];
    if (first) {
      // Open the section with the first error and take the person to that field, so the
      // message never points at marks hidden in a closed section.
      flushSync(() => {
        setStatus('invalid');
        setAttempted(true);
        toggleStep(first.step, true);
        if (first.key === 'coordinates') setCoordinatesOpen(true);
      });
      if (first.key === 'destination') {
        const input = destinationField.current?.querySelector('input');
        // The country search shows its own message and marks itself invalid.
        input?.checkValidity();
        input?.focus();
      } else document.getElementById(first.field)?.focus();
      return;
    }
    const profile: Preferences = {
      version: 1,
      language: p.lang,
      destination: draft.destination,
      nationality: draft.nationality,
      savedAt: Date.now(),
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
    };
    const hasPlan = [draft.stayName, draft.meeting, draft.notes, draft.lat, draft.lng].some((v) =>
      v.trim(),
    );
    const plan: HotelPlan | null = hasPlan
      ? {
          name: draft.stayName.trim(),
          meeting: draft.meeting.trim(),
          notes: draft.notes.trim(),
          lat: draft.lat.trim(),
          lng: draft.lng.trim(),
          savedAt: Date.now(),
          country: draft.destination,
        }
      : null;
    try {
      storeEmergencyInfo(info);
    } catch {
      setStatus('storage');
      return;
    }
    // The app moves to another country only when the person picked it here, and says so.
    const follow = edits.fields.destination !== undefined && draft.destination !== p.country;
    if (!p.onSave(profile, plan, follow)) {
      setStatus('storage');
      return;
    }
    setSavedInfo(info);
    setEdits(noEdits);
    setAttempted(false);
    setMovedTo(follow ? draft.destination : '');
    setStatus('saved');
  }

  function deleteAll() {
    const deleted = p.onDeleteAll();
    flushSync(() => {
      setSavedInfo(readEmergencyInfo() ?? emptyEmergencyInfo());
      setEdits(noEdits);
      setAttempted(false);
      setConfirmDelete(false);
      setStatus(deleted ? 'deleted' : 'notDeleted');
    });
    // The result is read where focus lands, next to the button that started it.
    statusRegion.current?.focus();
  }

  async function saveImage() {
    setImageNote('');
    // The saved country when the field is still empty (worldwide view).
    const country = draft.destination || p.profile?.destination || p.plan?.country || '';
    try {
      const lines = cardLines(country, p.lang, readContacts(), p.plan, p.profile, card);
      await downloadCardImage(country, p.lang, lines);
      setImageNote(
        t(
          'Imagen guardada en Descargas. Úsala como fondo de pantalla o guárdala en tus fotos.',
          'Image saved to Downloads. Use it as a wallpaper or keep it in your photos.',
          'Imagem salva em Downloads. Use como papel de parede ou guarde nas suas fotos.',
        ),
      );
    } catch {
      setImageNote(
        t(
          'No se pudo crear la imagen.',
          'Could not create the image.',
          'Não foi possível criar a imagem.',
        ),
      );
    }
  }

  const summary = {
    contact: [info.contact.name, info.contact.phone].filter((v) => v.trim()).join(', '),
    health: [
      info.health.allergies && t('alergias', 'allergies', 'alergias'),
      info.health.conditions && t('condiciones', 'conditions', 'condições'),
      info.health.medications && t('medicamentos', 'medication', 'medicamentos'),
      info.health.bloodType,
    ]
      .filter(Boolean)
      .join(', '),
    insurance: [info.insurance.company, info.insurance.policy].filter((v) => v.trim()).join(', '),
    stay: [draft.stayName, info.stay.address].filter((v) => v.trim()).join(', '),
  };
  const step = (n: number) => ({
    n,
    open: openSteps.includes(n),
    onToggle: (open: boolean) => toggleStep(n, open),
    problem: stepProblem(n),
  });

  return (
    <div className="f-column grid w-full max-w-2xl gap-8">
      <form className="f-stack grid gap-4" onSubmit={save} noValidate>
        <div className="f-stack grid gap-2" data-gap="sm">
          <Step
            {...step(1)}
            title={t('Tus datos', 'About you', 'Seus dados')}
            summary={[draft.name, draft.nationality && names.of(draft.nationality)]
              .filter(Boolean)
              .join(', ')}
            empty={t('Nombre y nacionalidad', 'Name and nationality', 'Nome e nacionalidade')}
          >
            <Field
              id="trip-name"
              label={t('Nombre', 'Name', 'Nome')}
              name="traveler-name"
              autoComplete="name"
              maxLength={80}
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
            />
            <CountrySearch
              label={t('Nacionalidad', 'Nationality', 'Nacionalidade')}
              lang={p.lang}
              value={draft.nationality}
              onChange={(value) => set({ nationality: value })}
            />
            {/* The wrapper lets a failed save find the search field to focus it. */}
            <div ref={destinationField}>
              <CountrySearch
                label={labels.destination}
                lang={p.lang}
                required
                value={draft.destination}
                onChange={(value) => value && set({ destination: value })}
              />
            </div>
            <Field
              id="trip-phone"
              label={labels.phone}
              hint={errors.phone ? checkNumber : undefined}
              aria-invalid={errors.phone || undefined}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={40}
              placeholder={phoneExample}
              value={draft.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
            <Field
              id="trip-email"
              label={labels.email}
              hint={
                errors.email
                  ? problem(t('Revisa el correo.', 'Check the email.', 'Confira o e-mail.'))
                  : undefined
              }
              aria-invalid={errors.email || undefined}
              type="email"
              autoComplete="email"
              maxLength={254}
              value={draft.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </Step>

          <Step
            {...step(2)}
            title={t('Contacto de emergencia', 'Emergency contact', 'Contato de emergência')}
            summary={summary.contact}
            empty={t(
              'A quién avisar si te pasa algo',
              'Who to notify if something happens',
              'Quem avisar se algo acontecer',
            )}
          >
            <Field
              id="trip-contact-name"
              label={t('Nombre', 'Name', 'Nome')}
              maxLength={80}
              value={info.contact.name}
              onChange={(e) => setInfo('contact', { name: e.target.value })}
            />
            <Field
              id="trip-contact-relation"
              label={t('Relación', 'Relationship', 'Relação')}
              maxLength={40}
              placeholder={t(
                'Madre, pareja, empresa…',
                'Mother, partner, employer…',
                'Mãe, cônjuge, empresa…',
              )}
              value={info.contact.relation}
              onChange={(e) => setInfo('contact', { relation: e.target.value })}
            />
            <Field
              id="trip-contact-phone"
              label={labels.contactPhone}
              hint={
                errors.contactPhone
                  ? checkNumber
                  : panama
                    ? t(
                        'Con código de país, por ejemplo +507.',
                        'With country code, for example +507.',
                        'Com o código do país, por exemplo +507.',
                      )
                    : t(
                        'Con código de país, empezando por +.',
                        'With country code, starting with +.',
                        'Com o código do país, começando por +.',
                      )
              }
              aria-invalid={errors.contactPhone || undefined}
              type="tel"
              inputMode="tel"
              maxLength={30}
              value={info.contact.phone}
              onChange={(e) => setInfo('contact', { phone: e.target.value })}
            />
          </Step>

          <Step
            {...step(3)}
            title={t('Salud', 'Health', 'Saúde')}
            summary={summary.health}
            empty={t(
              'Alergias, medicinas, grupo sanguíneo',
              'Allergies, medication, blood type',
              'Alergias, remédios, tipo sanguíneo',
            )}
          >
            <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
              <p>
                {t(
                  'Útil para quien te atienda. Es información sensible: solo entra en la ficha si lo marcas abajo.',
                  'Useful for whoever treats you. It is sensitive: it goes into your card only if you tick the box below.',
                  'Útil para quem for atender você. É uma informação sensível: só entra na ficha se você marcar a opção abaixo.',
                )}
              </p>
            </div>
            <Field
              id="trip-allergies"
              label={t('Alergias', 'Allergies', 'Alergias')}
              maxLength={300}
              placeholder={t(
                'Por ejemplo, penicilina',
                'For example, penicillin',
                'Por exemplo, penicilina',
              )}
              value={info.health.allergies}
              onChange={(e) => setInfo('health', { allergies: e.target.value })}
            />
            <Field
              id="trip-conditions"
              label={t('Condiciones médicas', 'Medical conditions', 'Condições médicas')}
              maxLength={300}
              placeholder={t(
                'Por ejemplo, asma o diabetes',
                'For example, asthma or diabetes',
                'Por exemplo, asma ou diabetes',
              )}
              value={info.health.conditions}
              onChange={(e) => setInfo('health', { conditions: e.target.value })}
            />
            <Field
              id="trip-medications"
              label={t('Medicamentos', 'Medication', 'Medicamentos')}
              maxLength={300}
              value={info.health.medications}
              onChange={(e) => setInfo('health', { medications: e.target.value })}
            />
            <SelectField
              id="trip-blood"
              label={t('Grupo sanguíneo', 'Blood type', 'Tipo sanguíneo')}
              value={info.health.bloodType}
              onChange={(e) => setInfo('health', { bloodType: e.target.value })}
            >
              {bloodTypes.map((b) => (
                <option key={b} value={b}>
                  {b || t('No lo sé', 'Not known', 'Não sei')}
                </option>
              ))}
            </SelectField>
            <List>
              <CheckRow
                id="trip-health-share"
                checked={info.health.share}
                onChange={(share) => setInfo('health', { share })}
                title={t(
                  'Incluir mi salud en la ficha que comparto',
                  'Include my health details in the card I share',
                  'Incluir minha saúde na ficha que compartilho',
                )}
              />
            </List>
          </Step>

          <Step
            {...step(4)}
            title={t('Seguro de viaje', 'Travel insurance', 'Seguro viagem')}
            summary={summary.insurance}
            empty={t(
              'Aseguradora, póliza y asistencia 24\u00a0h',
              'Insurer, policy and 24-hour assistance',
              'Seguradora, apólice, assistência 24\u00a0h',
            )}
          >
            <Field
              id="trip-insurer"
              label={t('Aseguradora', 'Insurer', 'Seguradora')}
              maxLength={80}
              value={info.insurance.company}
              onChange={(e) => setInfo('insurance', { company: e.target.value })}
            />
            <Field
              id="trip-policy"
              label={t('Número de póliza', 'Policy number', 'Número da apólice')}
              maxLength={60}
              value={info.insurance.policy}
              onChange={(e) => setInfo('insurance', { policy: e.target.value })}
            />
            <Field
              id="trip-insurance-phone"
              label={labels.insurancePhone}
              hint={errors.insurancePhone ? checkNumber : undefined}
              aria-invalid={errors.insurancePhone || undefined}
              type="tel"
              inputMode="tel"
              maxLength={30}
              value={info.insurance.phone}
              onChange={(e) => setInfo('insurance', { phone: e.target.value })}
            />
          </Step>

          <Step
            {...step(5)}
            title={t('Alojamiento y fechas', 'Accommodation and dates', 'Hospedagem e datas')}
            summary={summary.stay}
            empty={t(
              'Dónde te alojas y punto de encuentro',
              'Where you stay and meeting point',
              'Hospedagem e ponto de encontro',
            )}
          >
            <Field
              id="trip-stay"
              label={t('Alojamiento', 'Accommodation', 'Hospedagem')}
              maxLength={120}
              value={draft.stayName}
              onChange={(e) => set({ stayName: e.target.value })}
            />
            <Field
              id="trip-address"
              label={t('Dirección', 'Address', 'Endereço')}
              maxLength={200}
              autoComplete="street-address"
              value={info.stay.address}
              onChange={(e) => setInfo('stay', { address: e.target.value })}
            />
            <Field
              id="trip-arrival"
              label={t('Llegada', 'Arrival', 'Chegada')}
              type="date"
              value={info.stay.arrival}
              onChange={(e) => setInfo('stay', { arrival: e.target.value })}
            />
            <Field
              id="trip-departure"
              label={labels.dates}
              hint={
                errors.dates
                  ? problem(
                      t(
                        'Es anterior a la llegada.',
                        'It is before arrival.',
                        'É anterior à chegada.',
                      ),
                    )
                  : undefined
              }
              aria-invalid={errors.dates || undefined}
              type="date"
              value={info.stay.departure}
              onChange={(e) => setInfo('stay', { departure: e.target.value })}
            />
            <Field
              id="trip-meeting"
              label={t('Punto de encuentro', 'Meeting point', 'Ponto de encontro')}
              hint={t(
                'Pregúntalo en recepción. Es una nota personal, no un punto seguro verificado.',
                'Ask reception. It is a personal note, not a verified safe point.',
                'Pergunte na recepção. É uma anotação pessoal, não um ponto seguro verificado.',
              )}
              maxLength={300}
              value={draft.meeting}
              onChange={(e) => set({ meeting: e.target.value })}
            />
            <TextArea
              id="trip-route"
              label={t('Ruta e indicaciones', 'Route and instructions', 'Rota e instruções')}
              maxLength={1500}
              rows={3}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
            <Button
              variant="ghost"
              aria-expanded={coordinatesOpen}
              aria-controls="trip-coordinates"
              onClick={() => setCoordinatesOpen((open) => !open)}
            >
              {t(
                'Marcar el punto de encuentro en el mapa',
                'Pin the meeting point on the map',
                'Marcar o ponto de encontro no mapa',
              )}
              {coordinatesOpen ? (
                <ChevronUpIcon className="size-4" aria-hidden="true" />
              ) : (
                <ChevronDownIcon className="size-4" aria-hidden="true" />
              )}
            </Button>
            {/* The wrapper carries `hidden`: a layout class would override it with its display. */}
            <div id="trip-coordinates" hidden={!coordinatesOpen}>
              <div className="f-stack grid gap-4">
                <Field
                  id="trip-lat"
                  label={t('Latitud', 'Latitude', 'Latitude')}
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={draft.lat}
                  onChange={(e) => set({ lat: e.target.value })}
                />
                <Field
                  id="trip-lng"
                  label={t('Longitud', 'Longitude', 'Longitude')}
                  hint={
                    errors.coordinates
                      ? problem(
                          t(
                            'Completa ambas coordenadas válidas.',
                            'Enter both valid coordinates.',
                            'Preencha as duas coordenadas válidas.',
                          ),
                        )
                      : undefined
                  }
                  aria-invalid={errors.coordinates || undefined}
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={draft.lng}
                  onChange={(e) => set({ lng: e.target.value })}
                />
                {p.geo && (
                  <Button
                    variant="secondary"
                    onClick={() => set({ lat: p.geo!.lat.toFixed(6), lng: p.geo!.lng.toFixed(6) })}
                  >
                    {t(
                      'Estoy en el punto acordado: usar mi ubicación',
                      'I am at the agreed point: use my location',
                      'Estou no ponto combinado: usar minha localização',
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Step>
        </div>

        <div className="f-stack grid gap-2" data-gap="sm">
          <Button type="submit" icon={<CircleCheckIcon className="size-4" aria-hidden="true" />}>
            {t('Guardar', 'Save', 'Salvar')}
          </Button>
          {/* Always present, so a screen reader announces the result when it appears. Focus
              comes here after deleting, so the result is read and seen next to the button. */}
          <div role="status" ref={statusRegion} tabIndex={-1}>
            {status && (
              <Note>
                {status === 'saved'
                  ? t(
                      'Guardado en este navegador.',
                      'Saved in this browser.',
                      'Salvo neste navegador.',
                    ) +
                    (movedTo
                      ? ' ' +
                        t(
                          `Faro ahora muestra el país que elegiste: ${names.of(movedTo)}.`,
                          `Faro now shows the country you chose: ${names.of(movedTo)}.`,
                          `O Faro agora mostra o país que você escolheu: ${names.of(movedTo)}.`,
                        )
                      : '')
                  : status === 'invalid'
                    ? t(
                        'Revisa los campos marcados.',
                        'Check the highlighted fields.',
                        'Confira os campos marcados.',
                      )
                    : status === 'deleted'
                      ? t(
                          'Datos borrados de este navegador.',
                          'Details deleted from this browser.',
                          'Dados apagados deste navegador.',
                        )
                      : status === 'notDeleted'
                        ? t(
                            'El navegador no permitió borrar todos los datos. Inténtalo de nuevo.',
                            'The browser did not allow deleting all the details. Try again.',
                            'O navegador não permitiu apagar todos os dados. Tente de novo.',
                          )
                        : t(
                            'El navegador no permitió guardar. Descarga o comparte tu ficha.',
                            'The browser did not allow saving. Download or share your card.',
                            'O navegador não permitiu salvar. Baixe ou compartilhe sua ficha.',
                          )}
              </Note>
            )}
          </div>
        </div>
        {/* Deleting is the form's last control, apart from Guardar, as a ghost button in the
            error colour (data-tone), with a confirmation in place. */}
        {!confirmDelete ? (
          <Button
            variant="ghost"
            data-tone="error"
            id="trip-delete"
            onClick={() => {
              // The button gives way to the confirmation: focus moves to its first choice.
              flushSync(() => setConfirmDelete(true));
              document.getElementById('trip-delete-confirm')?.focus();
            }}
          >
            {t('Borrar mis datos', 'Delete my details', 'Apagar meus dados')}
          </Button>
        ) : (
          <div
            className="f-stack grid gap-2"
            data-gap="sm"
            role="group"
            aria-label={t('Confirmar', 'Confirm', 'Confirmar')}
          >
            <Text>
              {t(
                '¿Borrar perfil, salud, seguro y alojamiento?',
                'Delete profile, health, insurance and stay?',
                'Apagar perfil, saúde, seguro e hospedagem?',
              )}
            </Text>
            <div className="f-chips">
              <Button variant="secondary" id="trip-delete-confirm" onClick={deleteAll}>
                {t('Sí, borrar', 'Yes, delete', 'Sim, apagar')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  flushSync(() => setConfirmDelete(false));
                  document.getElementById('trip-delete')?.focus();
                }}
              >
                {t('Cancelar', 'Cancel', 'Cancelar')}
              </Button>
            </div>
          </div>
        )}
      </form>

      <Section id="fw-ficha" title={t('Tu ficha', 'Your card', 'Sua ficha')}>
        {/* Without details there is nothing to send: one line and the way to start, instead of
            channels that do nothing. The channels and the image appear with the first detail. */}
        {filled ? (
          <>
            <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
              <p>
                {t(
                  'Envíala a tu familia, a tu empresa o a quien te atienda. Tú eliges la app y el destinatario.',
                  'Send it to family, your employer or whoever helps you. You choose the app and recipient.',
                  'Envie para sua família, sua empresa ou quem atender você. Você escolhe o app e o destinatário.',
                )}
              </p>
            </div>
            <MessagePreview live text={card} empty="" />
            <ShareButtons
              lang={p.lang}
              text={card}
              subject={t(
                'Mi ficha de emergencia',
                'My emergency card',
                'Minha ficha de emergência',
              )}
              label={t('Enviar mi ficha', 'Send my card', 'Enviar minha ficha')}
              hint={t(
                'Se envía lo que ves arriba. Revísalo antes de enviarlo.',
                'What you see above is what gets sent. Check it before sending.',
                'É enviado o que você vê acima. Confira antes de enviar.',
              )}
            />
            {/* The image carries the same text as the preview above. */}
            <Button
              variant="secondary"
              icon={<DownloadIcon className="size-4" aria-hidden="true" />}
              onClick={() => void saveImage()}
            >
              {t(
                'Guardar como imagen para el teléfono',
                'Save as an image for your phone',
                'Salvar como imagem para o celular',
              )}
            </Button>
          </>
        ) : (
          <>
            <Text>
              {t(
                'Tu ficha aparecerá aquí, lista para enviar.',
                'Your card will appear here, ready to send.',
                'Sua ficha aparecerá aqui, pronta para enviar.',
              )}
            </Text>
            <Button variant="secondary" onClick={completeDetails}>
              {t('Completar tus datos', 'Fill in your details', 'Preencher seus dados')}
            </Button>
          </>
        )}
        <div role="status">{imageNote && <Note>{imageNote}</Note>}</div>
      </Section>
    </div>
  );
}

const emptyPlanFields: HotelPlan = {
  name: '',
  meeting: '',
  notes: '',
  lat: '',
  lng: '',
  savedAt: 0,
  country: 'PA',
};

/**
 * One optional part of the profile: its number, its title and what is filled in so far, or,
 * after a save with errors, what to fix inside it.
 */
function Step({
  n,
  title,
  summary,
  empty,
  open,
  onToggle,
  problem,
  children,
}: {
  n: number;
  title: string;
  summary: string;
  empty: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  problem?: string;
  children: ReactNode;
}) {
  return (
    <Disclosure
      open={open}
      onToggle={onToggle}
      lead={<RowIcon icon={<span>{n}</span>} />}
      title={title}
      invalid={!!problem}
      meta={
        problem ? (
          <>
            <CircleAlertIcon className="size-4" aria-hidden="true" /> {problem}
          </>
        ) : (
          summary || empty
        )
      }
    >
      {children}
    </Disclosure>
  );
}

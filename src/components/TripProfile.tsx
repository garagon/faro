import { useState, type FormEvent, type ReactNode } from 'react';
import {
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  DownloadSimpleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
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
  Actions,
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
  TextArea,
} from '../ui/index.ts';

type Props = {
  lang: Lang;
  country: string;
  countryCodes: readonly string[];
  profile: Preferences | null;
  plan: HotelPlan | null;
  geo: Geo | null;
  onSave: (profile: Preferences, plan: HotelPlan | null) => boolean;
  onDeleteAll: () => void;
};

type Draft = {
  name: string;
  nationality: string;
  destination: string;
  phone: string;
  email: string;
  info: EmergencyInfo;
  stayName: string;
  meeting: string;
  notes: string;
  lat: string;
  lng: string;
};

/**
 * The traveler's details for an emergency, in five short sections, and the card they make,
 * ready to send by any messaging app. Nothing is required and nothing leaves the browser
 * unless the person shares it.
 */
export default function TripProfile(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt);
  const names = new Intl.DisplayNames([p.lang], { type: 'region' });
  const initialCountry = p.countryCodes.includes(p.country)
    ? p.country
    : (p.profile?.destination ?? 'PA');
  const [draft, setDraft] = useState<Draft>(() => ({
    name: p.profile?.name ?? '',
    nationality: p.profile?.nationality ?? '',
    destination: p.profile?.destination ?? initialCountry,
    phone: p.profile?.phone ?? '',
    email: p.profile?.email ?? '',
    info: readEmergencyInfo() ?? emptyEmergencyInfo(),
    stayName: p.plan?.name ?? '',
    meeting: p.plan?.meeting ?? '',
    notes: p.plan?.notes ?? '',
    lat: p.plan?.lat ?? '',
    lng: p.plan?.lng ?? '',
  }));
  const [status, setStatus] = useState<'saved' | 'invalid' | 'storage' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageNote, setImageNote] = useState('');
  // The coordinates are a rarely used part of the stay section: closed until asked for.
  const [coordinatesOpen, setCoordinatesOpen] = useState(false);
  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setStatus(null);
  };
  const setInfo = <K extends keyof EmergencyInfo>(key: K, patch: Partial<EmergencyInfo[K]>) => {
    setDraft((d) => ({
      ...d,
      info: { ...d.info, [key]: { ...(d.info[key] as object), ...patch } },
    }));
    setStatus(null);
  };
  const { info } = draft;

  const errors = {
    phone: !!draft.phone.trim() && !validProfilePhone(draft.phone),
    email: !!draft.email.trim() && !validProfileEmail(draft.email),
    contactPhone: !validEmergencyPhone(info.contact.phone),
    insurancePhone: !validEmergencyPhone(info.insurance.phone),
    coordinates:
      (!!draft.lat.trim() || !!draft.lng.trim()) &&
      !planCoordinates({ ...emptyPlanFields, lat: draft.lat, lng: draft.lng }),
    dates: !!info.stay.arrival && !!info.stay.departure && info.stay.departure < info.stay.arrival,
  };
  const invalid = Object.values(errors).some(Boolean);
  // An error replaces the field's hint, with a mark so it is not read as a plain hint.
  const problem = (text: string) => (
    <>
      <WarningCircleIcon size={16} weight="fill" aria-hidden="true" /> {text}
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
    if (invalid) {
      setStatus('invalid');
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
    setStatus(p.onSave(profile, plan) ? 'saved' : 'storage');
  }

  async function saveImage() {
    setImageNote('');
    try {
      const lines = cardLines(draft.destination, p.lang, readContacts(), p.plan, p.profile, card);
      await downloadCardImage(draft.destination, p.lang, lines);
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

  return (
    <div className="f-column">
      <form className="f-stack" onSubmit={save} noValidate>
        <div className="f-stack" data-gap="sm">
          <Step
            n={1}
            open
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
            <CountrySearch
              label={t('País donde estás', 'Country you are in', 'País onde você está')}
              lang={p.lang}
              value={draft.destination}
              onChange={(value) => value && set({ destination: value })}
            />
            <Field
              id="trip-phone"
              label={t('Tu teléfono', 'Your phone', 'Seu telefone')}
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
              label={t('Tu correo', 'Your email', 'Seu e-mail')}
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
            n={2}
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
              label={t('Teléfono', 'Phone', 'Telefone')}
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
            n={3}
            title={t('Salud', 'Health', 'Saúde')}
            summary={summary.health}
            empty={t(
              'Alergias, medicamentos, grupo sanguíneo',
              'Allergies, medication, blood type',
              'Alergias, medicamentos, tipo sanguíneo',
            )}
          >
            <div className="f-prose">
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
            n={4}
            title={t('Seguro de viaje', 'Travel insurance', 'Seguro viagem')}
            summary={summary.insurance}
            empty={t(
              'Aseguradora, póliza y asistencia 24 h',
              'Insurer, policy and 24-hour assistance',
              'Seguradora, apólice e assistência 24 h',
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
              label={t('Teléfono de asistencia', 'Assistance phone', 'Telefone da assistência')}
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
            n={5}
            title={t('Alojamiento y fechas', 'Accommodation and dates', 'Hospedagem e datas')}
            summary={summary.stay}
            empty={t(
              'Dónde te alojas y punto de encuentro',
              'Where you stay and meeting point',
              'Onde você se hospeda e ponto de encontro',
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
              label={t('Salida', 'Departure', 'Saída')}
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
                <CaretUpIcon size={16} aria-hidden="true" />
              ) : (
                <CaretDownIcon size={16} aria-hidden="true" />
              )}
            </Button>
            {/* The wrapper carries `hidden`: a layout class would override it with its display. */}
            <div id="trip-coordinates" hidden={!coordinatesOpen}>
              <div className="f-stack">
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
                  <Actions>
                    <button
                      type="button"
                      onClick={() =>
                        set({ lat: p.geo!.lat.toFixed(6), lng: p.geo!.lng.toFixed(6) })
                      }
                    >
                      {t(
                        'Estoy en el punto acordado: usar mi ubicación',
                        'I am at the agreed point: use my location',
                        'Estou no ponto combinado: usar minha localização',
                      )}
                    </button>
                  </Actions>
                )}
              </div>
            </div>
          </Step>
        </div>

        <div className="f-stack" data-gap="sm">
          <Button type="submit" icon={<CheckCircleIcon size={20} aria-hidden="true" />}>
            {t('Guardar', 'Save', 'Salvar')}
          </Button>
          {/* Always present, so a screen reader announces the result when it appears. */}
          <div role="status">
            {status && (
              <Note>
                {status === 'saved'
                  ? t(
                      'Guardado en este navegador.',
                      'Saved in this browser.',
                      'Salvo neste navegador.',
                    )
                  : status === 'invalid'
                    ? t(
                        'Revisa los campos marcados.',
                        'Check the highlighted fields.',
                        'Confira os campos marcados.',
                      )
                    : t(
                        'El navegador no permitió guardar. Descarga o comparte tu ficha.',
                        'The browser did not allow saving. Download or share your card.',
                        'O navegador não permitiu salvar. Baixe ou compartilhe sua ficha.',
                      )}
              </Note>
            )}
          </div>
          {!confirmDelete ? (
            <Actions>
              <button type="button" onClick={() => setConfirmDelete(true)}>
                {t('Borrar mis datos', 'Delete my details', 'Apagar meus dados')}
              </button>
            </Actions>
          ) : (
            <div
              className="f-prose"
              role="group"
              aria-label={t('Confirmar', 'Confirm', 'Confirmar')}
            >
              <p>
                {t(
                  '¿Borrar perfil, salud, seguro y alojamiento?',
                  'Delete profile, health, insurance and stay?',
                  'Apagar perfil, saúde, seguro e hospedagem?',
                )}
              </p>
              <Actions>
                <button
                  type="button"
                  onClick={() => {
                    p.onDeleteAll();
                    setDraft({
                      name: '',
                      nationality: '',
                      destination: initialCountry,
                      phone: '',
                      email: '',
                      info: emptyEmergencyInfo(),
                      stayName: '',
                      meeting: '',
                      notes: '',
                      lat: '',
                      lng: '',
                    });
                    setConfirmDelete(false);
                    setStatus(null);
                  }}
                >
                  {t('Sí, borrar', 'Yes, delete', 'Sim, apagar')}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)}>
                  {t('Cancelar', 'Cancel', 'Cancelar')}
                </button>
              </Actions>
            </div>
          )}
        </div>
      </form>

      <Section id="fw-ficha" title={t('Tu ficha', 'Your card', 'Sua ficha')}>
        <div className="f-prose">
          <p>
            {t(
              'Envíala a tu familia, a tu empresa o a quien te atienda. Tú eliges la app y el destinatario.',
              'Send it to family, your employer or whoever helps you. You choose the app and recipient.',
              'Envie para sua família, sua empresa ou quem atender você. Você escolhe o app e o destinatário.',
            )}
          </p>
        </div>
        <MessagePreview
          live
          text={filled ? card : ''}
          empty={t(
            'Completa tus datos y aparecerán aquí, listos para enviar.',
            'Fill in your details and they will appear here, ready to send.',
            'Preencha seus dados e eles aparecerão aqui, prontos para enviar.',
          )}
        />
        <ShareButtons
          lang={p.lang}
          text={card}
          subject={t('Mi ficha de emergencia', 'My emergency card', 'Minha ficha de emergência')}
          enabled={filled}
          label={t('Enviar mi ficha', 'Send my card', 'Enviar minha ficha')}
          hint={
            filled
              ? t(
                  'Se envía lo que ves arriba. Revísalo antes de enviarlo.',
                  'What you see above is what gets sent. Check it before sending.',
                  'É enviado o que você vê acima. Confira antes de enviar.',
                )
              : undefined
          }
        />
        <Button
          variant="secondary"
          icon={<DownloadSimpleIcon size={20} aria-hidden="true" />}
          // aria-disabled rather than disabled: the older screens' styles fade disabled buttons
          // below 4.5:1; the design system draws aria-disabled with readable text.
          aria-disabled={(!p.profile && !p.plan) || undefined}
          onClick={() => (p.profile || p.plan) && void saveImage()}
        >
          {t(
            'Guardar como imagen para el teléfono',
            'Save as an image for your phone',
            'Salvar como imagem para o celular',
          )}
        </Button>
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

/** One optional part of the profile: its number, its title and what is filled in so far. */
function Step({
  n,
  title,
  summary,
  empty,
  open,
  children,
}: {
  n: number;
  title: string;
  summary: string;
  empty: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <Disclosure
      open={open}
      lead={<RowIcon icon={<span>{n}</span>} />}
      title={title}
      meta={summary || empty}
    >
      {children}
    </Disclosure>
  );
}

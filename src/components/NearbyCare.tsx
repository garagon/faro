import { useEffect, useRef, useState } from 'react';
import { CrosshairIcon, FirstAidKitIcon, PillIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import { careSearchUrl, careCoordinates } from '../lib/nearbyCare.ts';
import { careAreas } from '../data/careAreas.ts';
import { healthDirectories } from '../data/healthDirectories.ts';
export default function NearbyCare({
  lang,
  country,
  onEmergency,
}: {
  lang: 'es' | 'en';
  country: string;
  onEmergency: () => void;
}) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const [place, setPlace] = useState(''),
    [gps, setGps] = useState(''),
    [status, setStatus] = useState<'idle' | 'pending' | 'ready' | 'failed'>('idle');
  const requestId = useRef(0);
  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );
  const countryName =
    country === 'WORLD'
      ? ''
      : new Intl.DisplayNames([lang], { type: 'region' }).of(country) || country;
  const area =
    gps || (place.trim() ? `${place.trim()}${countryName ? ', ' + countryName : ''}` : '');
  function locate() {
    if (!navigator.geolocation) {
      setStatus('failed');
      return;
    }
    const request = ++requestId.current;
    setGps('');
    setStatus('pending');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (request !== requestId.current) return;
        const value = careCoordinates(p.coords.latitude, p.coords.longitude);
        setGps(value || '');
        setStatus(value ? 'ready' : 'failed');
      },
      () => {
        if (request !== requestId.current) return;
        setGps('');
        setStatus('failed');
      },
      { timeout: 15000, maximumAge: 0, enableHighAccuracy: false },
    );
  }
  return (
    <section className="fw-care" aria-labelledby="care-title">
      <header>
        <div>
          <span>{t('ATENCIÓN DE SALUD', 'HEALTHCARE')}</span>
          <h2 id="care-title">{t('Farmacias y hospitales', 'Pharmacies and hospitals')}</h2>
          <p>
            {t(
              'Usa tu ubicación o escribe una zona. Antes de ir, llama para confirmar que están atendiendo.',
              'Use your location or enter an area. Before going, call to confirm they are open.',
            )}
          </p>
        </div>
        <button className="fw-secondary" onClick={onEmergency}>
          {t('Teléfonos de emergencia', 'Emergency numbers')}
        </button>
      </header>
      <div className="fw-care-location">
        <label>
          {t('Ciudad, barrio o dirección', 'City, neighbourhood or address')}
          <input
            maxLength={160}
            value={place}
            placeholder={t('Ej.: El Cangrejo, Ciudad de Panamá', 'E.g. El Cangrejo, Panama City')}
            onChange={(e) => {
              requestId.current += 1;
              setPlace(e.target.value);
              setGps('');
              setStatus('idle');
            }}
          />
        </label>
        <button className="fw-secondary" onClick={locate} disabled={status === 'pending'}>
          <CrosshairIcon size={19} />
          {status === 'pending'
            ? t('Buscando ubicación…', 'Finding location…')
            : t('Usar mi ubicación', 'Use my location')}
        </button>
      </div>
      {!!careAreas[country]?.length && (
        <div
          className="fw-care-areas"
          role="group"
          aria-label={t('Zonas frecuentes', 'Common areas')}
        >
          <span>{t('Zonas frecuentes', 'Common areas')}</span>
          {careAreas[country]!.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={!gps && place.trim() === name}
              onClick={() => {
                requestId.current += 1;
                setPlace(name);
                setGps('');
                setStatus('idle');
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <p role="status">
        {status === 'failed'
          ? t(
              'No se obtuvo tu ubicación. Escribe una ciudad o dirección.',
              'Location unavailable. Enter a city or address.',
            )
          : gps
            ? t(
                `Búsqueda alrededor de ${gps}. Tu ubicación puede estar en otro país que el seleccionado.`,
                `Search around ${gps}. Your location may be in a different country from the selected one.`,
              )
            : area
              ? t(`Se buscará en ${area}.`, `Searching in ${area}.`)
              : t(
                  `Buscar en ${countryName || 'el lugar que escribas'}.`,
                  `Search in ${countryName || 'the place you enter'}.`,
                )}
      </p>
      <div className="fw-care-actions">
        {(['pharmacy', 'hospital'] as const).map((kind) => {
          const label =
            kind === 'pharmacy'
              ? t('Buscar farmacias', 'Find pharmacies')
              : t('Buscar hospitales', 'Find hospitals');
          const Icon = kind === 'pharmacy' ? PillIcon : FirstAidKitIcon;
          const url = careSearchUrl(kind, area, lang);
          return url ? (
            <a className="fw-care-search" key={kind} href={url} target="_blank" rel="noreferrer">
              <Icon size={26} />
              <span>
                {label}
                <small>Google Maps</small>
              </span>
              <ArrowUpRightIcon size={18} />
            </a>
          ) : (
            <button className="fw-care-search" key={kind} disabled>
              <Icon size={26} />
              <span>
                {label}
                <small>{t('Primero elige una zona', 'Choose an area first')}</small>
              </span>
            </button>
          );
        })}
      </div>
      <small>
        {t(
          'La búsqueda se abre en Google Maps con la zona o tu ubicación aproximada. Faro no la guarda. Después de un desastre, un resultado no garantiza que el lugar esté atendiendo.',
          'The search opens in Google Maps with the area or your approximate location. Faro does not save it. After a disaster, a result does not guarantee the place is open.',
        )}
      </small>
      {!!healthDirectories[country]?.length && (
        <div className="fw-care-official">
          <strong>{t('Directorios y avisos oficiales', 'Official directories and notices')}</strong>
          {healthDirectories[country].map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
              {s.name} ↗
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

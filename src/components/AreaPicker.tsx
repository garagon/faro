import { useEffect, useRef, useState } from 'react';
import { CrosshairIcon } from '@phosphor-icons/react';
import { careCoordinates } from '../lib/nearbyCare.ts';
import { careAreas } from '../data/careAreas.ts';
import { pick, type Lang } from '../lib/i18n.ts';

type Status = 'idle' | 'pending' | 'ready' | 'failed';
export type SearchArea = ReturnType<typeof useSearchArea>;

/**
 * Area for nearby searches: typed text, a common area, or rounded coordinates after an explicit
 * tap. Nothing is stored; the value only travels in the search link the person opens.
 */
export function useSearchArea(country: string, lang: Lang) {
  const [place, setPlaceState] = useState(''),
    [gps, setGps] = useState(''),
    [status, setStatus] = useState<Status>('idle');
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
  function setPlace(value: string) {
    requestId.current += 1;
    setPlaceState(value);
    setGps('');
    setStatus('idle');
  }
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
  return { place, gps, status, area, country, countryName, setPlace, locate };
}

export function AreaFields({ state, lang }: { state: SearchArea; lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const { place, gps, status, area, country, countryName } = state;
  return (
    <>
      <div className="fw-care-location">
        <label>
          {t(
            'Ciudad, barrio o dirección',
            'City, neighborhood or address',
            'Cidade, bairro ou endereço',
          )}
          <input
            maxLength={160}
            value={place}
            placeholder={t(
              'Ej.: El Cangrejo, Ciudad de Panamá',
              'E.g. El Cangrejo, Panama City',
              'Ex.: El Cangrejo, Cidade do Panamá',
            )}
            onChange={(e) => state.setPlace(e.target.value)}
          />
        </label>
        <button className="fw-secondary" onClick={state.locate} disabled={status === 'pending'}>
          <CrosshairIcon size={19} aria-hidden="true" />
          {status === 'pending'
            ? t('Buscando ubicación…', 'Finding location…', 'Buscando localização…')
            : t('Usar mi ubicación', 'Use my location', 'Usar minha localização')}
        </button>
      </div>
      {!!careAreas[country]?.length && (
        <div
          className="fw-care-areas"
          role="group"
          aria-label={t('Zonas frecuentes', 'Common areas', 'Áreas frequentes')}
        >
          <span>{t('Zonas frecuentes', 'Common areas', 'Áreas frequentes')}</span>
          {careAreas[country]!.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={!gps && place.trim() === name}
              onClick={() => state.setPlace(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <p className="fw-area-status" role="status">
        {status === 'failed'
          ? t(
              'No se obtuvo tu ubicación. Escribe una ciudad o dirección.',
              'Location unavailable. Enter a city or address.',
              'Não foi possível obter sua localização. Digite uma cidade ou endereço.',
            )
          : gps
            ? t(
                `Búsqueda alrededor de ${gps}. Tu ubicación puede estar en otro país que el seleccionado.`,
                `Search around ${gps}. Your location may be in a different country from the selected one.`,
                `Busca ao redor de ${gps}. Sua localização pode estar em um país diferente do selecionado.`,
              )
            : area
              ? t(`Se buscará en ${area}.`, `Searching in ${area}.`, `Área da busca: ${area}.`)
              : t(
                  `Buscar en ${countryName || 'el lugar que escribas'}.`,
                  `Search in ${countryName || 'the place you enter'}.`,
                  `Área da busca: ${countryName || 'o lugar que você digitar'}.`,
                )}
      </p>
    </>
  );
}

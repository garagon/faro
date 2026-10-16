import { useEffect, useRef, useState } from 'react';
import { careCoordinates } from '../lib/nearbyCare.ts';
import { pick, type Lang } from '../lib/i18n.ts';

type Status = 'idle' | 'pending' | 'ready' | 'denied' | 'failed';
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
      (error) => {
        if (request !== requestId.current) return;
        setGps('');
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'failed');
      },
      { timeout: 15000, maximumAge: 0, enableHighAccuracy: false },
    );
  }
  return { place, gps, status, area, country, countryName, setPlace, locate };
}

/**
 * What the search buttons will use, said once under the area fields. When the location fails,
 * the sentence still says which area the buttons search, if there is one.
 */
export function areaStatus(state: SearchArea, lang: Lang) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const { gps, status, area, countryName } = state;
  if (status === 'denied' || status === 'failed') {
    const why =
      status === 'denied'
        ? t(
            'No diste permiso de ubicación.',
            'Location permission was not given.',
            'Você não deu permissão de localização.',
          )
        : t(
            'No se obtuvo tu ubicación.',
            'Location unavailable.',
            'Não foi possível obter sua localização.',
          );
    return `${why} ${
      area
        ? t(`Se buscará en ${area}.`, `Searching in ${area}.`, `Área da busca: ${area}.`)
        : t(
            'Escribe una ciudad o dirección.',
            'Enter a city or address.',
            'Digite uma cidade ou endereço.',
          )
    }`;
  }
  if (gps)
    return t(
      `Búsqueda alrededor de ${gps}. Tu ubicación puede estar en otro país que el seleccionado.`,
      `Search around ${gps}. Your location may be in a different country from the selected one.`,
      `Busca ao redor de ${gps}. Sua localização pode estar em um país diferente do selecionado.`,
    );
  if (area) return t(`Se buscará en ${area}.`, `Searching in ${area}.`, `Área da busca: ${area}.`);
  return t(
    `Buscar en ${countryName || 'el lugar que escribas'}.`,
    `Search in ${countryName || 'the place you enter'}.`,
    `Área da busca: ${countryName || 'o lugar que você digitar'}.`,
  );
}

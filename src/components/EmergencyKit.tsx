import { useState } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import {
  kitItems,
  kitSources,
  kitKey,
  parseKit,
  kitText,
  type KitGroup,
} from '../data/emergencyKit.ts';
import { writeLocal, removeLocal } from '../lib/browserStorage.ts';
import SafetyIllustration from './SafetyIllustration.tsx';
export default function EmergencyKit({ lang }: { lang: 'es' | 'en' }) {
  const [checked, setChecked] = useState<string[]>(() => {
    try {
      return parseKit(localStorage.getItem(kitKey));
    } catch {
      return [];
    }
  });
  const [error, setError] = useState(false);
  const t = (es: string, en: string) => (lang === 'es' ? es : en),
    i = lang === 'es' ? 0 : 1;
  const groups: { id: KitGroup; title: string }[] = [
    { id: 'supplies', title: t('Agua, comida y salud', 'Water, food and health') },
    { id: 'tools', title: t('Luz y comunicación', 'Light and communication') },
    {
      id: 'personal',
      title: t('Documentos y necesidades personales', 'Documents and personal needs'),
    },
  ];
  function toggle(id: string) {
    const next = checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id];
    setChecked(next);
    try {
      writeLocal(kitKey, JSON.stringify(next));
      setError(false);
    } catch {
      setError(true);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([kitText(lang, checked)], { type: 'text/plain;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `faro-emergency-kit-${lang}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="fw-kit" aria-labelledby="kit-title">
      <header className="fw-kit-intro">
        <div>
          <span>{t('PREPARAR ANTES DE LA EMERGENCIA', 'PREPARE BEFORE AN EMERGENCY')}</span>
          <h2 id="kit-title">{t('Mochila de emergencia', 'Emergency kit')}</h2>
          <p>
            {t(
              'Prepara reservas para 72 horas y una mochila que puedas cargar. Acuerda con tu alojamiento dónde guardar el resto.',
              'Prepare supplies for 72 hours and a bag you can carry. Agree with your accommodation where to keep the rest.',
            )}
          </p>
        </div>
        <SafetyIllustration scene="bag" />
      </header>
      <p className="fw-preparation-note">
        {t(
          'Si debes evacuar, no retrases la salida para buscar la mochila ni regreses por equipaje.',
          'If you must evacuate, do not delay leaving to collect the bag or return for luggage.',
        )}
      </p>
      <div className="fw-kit-progress">
        <strong role="status">
          {checked.length} / {kitItems.length} {t('elementos revisados', 'items checked')}
        </strong>
        <span>
          {error
            ? t(
                'No se pudo guardar. Conserva una copia descargada.',
                'Could not save. Keep a downloaded copy.',
              )
            : t(
                'Tu lista se guarda solo en este navegador.',
                'Your checklist is saved only in this browser.',
              )}
        </span>
        <progress
          value={checked.length}
          max={kitItems.length}
          aria-label={t('Elementos revisados', 'Items checked')}
        />
      </div>
      {groups.map((group) => (
        <fieldset key={group.id}>
          <legend>{group.title}</legend>
          <div className="fw-kit-items">
            {kitItems
              .filter((item) => item.group === group.id)
              .map((item) => (
                <label className={checked.includes(item.id) ? 'is-checked' : ''} key={item.id}>
                  <input
                    type="checkbox"
                    checked={checked.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <span>
                    <strong>{item.title[i]}</strong>
                    <small>{item.detail[i]}</small>
                  </span>
                </label>
              ))}
          </div>
        </fieldset>
      ))}
      <div className="fw-kit-actions">
        <button className="fw-primary" onClick={download}>
          <DownloadSimpleIcon size={19} />
          {t('Descargar mi lista', 'Download my checklist')}
        </button>
        <button
          className="fw-text"
          onClick={() => {
            try {
              removeLocal(kitKey);
              setChecked([]);
              setError(false);
            } catch {
              setError(true);
            }
          }}
        >
          {t('Desmarcar todo', 'Uncheck all')}
        </button>
      </div>
      <p>
        {t(
          'Revisa pilas, cargas y vencimientos antes de viajar. Marcar la lista no comprueba el contenido de la mochila.',
          'Check batteries, charges and expiry dates before travelling. Checking items does not verify the contents of your bag.',
        )}
      </p>
      <footer>
        <span>
          {t(
            'Adaptación para viajeros · fuentes consultadas el 12 oct 2026',
            'Traveller adaptation · sources checked Oct 12, 2026',
          )}
        </span>
        {kitSources.map((s) => (
          <a href={s.url} key={s.url} target="_blank" rel="noreferrer">
            {s.name} ↗
          </a>
        ))}
      </footer>
    </section>
  );
}

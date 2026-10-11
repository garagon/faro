import { useState } from 'react';
import { DownloadSimpleIcon, IdentificationCardIcon, MapPinIcon } from '@phosphor-icons/react';
import type { Preferences } from '../lib/preferences.ts';
import type { HotelPlan, Lang } from '../lib/resources.ts';
import { cardLines, downloadCardImage } from '../lib/travelCardImage.ts';
import { emergencyFor } from '../lib/emergency.ts';
import { type TravelContact } from '../lib/tripData.ts';

export default function TravelCard({
  country,
  lang,
  contacts,
  plan,
  profile,
}: {
  country: string;
  lang: Lang;
  contacts: TravelContact[];
  plan: HotelPlan | null;
  profile: Preferences | null;
}) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const countryName = new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  const hotel = plan?.country === country ? plan : null;
  const numbers = emergencyFor(country)?.numbers;
  const lines = cardLines(country, lang, contacts, plan, profile);
  const saveImage = async () => {
    setBusy(true);
    setNotice('');
    try {
      await downloadCardImage(country, lang, lines);
      setNotice(
        t(
          'Imagen guardada en Descargas. En iPhone, ábrela y usa Compartir → Guardar imagen.',
          'Image saved to Downloads. On iPhone, open it and choose Share → Save Image.',
        ),
      );
    } catch {
      setNotice(
        t(
          'No se pudo crear la imagen. Usa Descargar en texto para guardar la ficha completa.',
          'Could not create the image. Use Download as text to save the complete card.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const saveText = () => {
    const text = [
      t('FARO · FICHA DEL VIAJE', 'FARO · TRAVEL CARD'),
      countryName,
      `${t('Copia creada', 'Copy created')}: ${new Date().toISOString()}`,
      t(
        'Datos personales. Guarda esta ficha de forma privada.',
        'Personal data. Keep this card private.',
      ),
      ...lines.map((row) => `${row.label}\n${row.value}`),
    ].join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `faro-viaje-${country.toLowerCase()}-${lang}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    setNotice(t('Ficha completa guardada en Descargas.', 'Complete card saved to Downloads.'));
  };
  return (
    <aside className="fw-travel-card-area" aria-label={t('Tu ficha de viaje', 'Your travel card')}>
      <div className="fw-travel-pass">
        <div className="fw-pass-brand">
          <strong>Faro</strong>
          <IdentificationCardIcon size={28} aria-hidden="true" />
        </div>
        <span className="fw-pass-label">{t('FICHA DEL VIAJE', 'TRAVEL CARD')}</span>
        <h3>{profile?.name || t('Tu viaje', 'Your trip')}</h3>
        <p className="fw-pass-destination">
          <MapPinIcon size={18} aria-hidden="true" />
          {countryName}
        </p>
        <dl>
          <div>
            <dt>{t('Alojamiento', 'Accommodation')}</dt>
            <dd>{hotel?.name || t('Añade el hotel en tu plan', 'Add your hotel to your plan')}</dd>
          </div>
          <div>
            <dt>{t('Punto de encuentro guardado', 'Saved meeting point')}</dt>
            <dd>{hotel?.meeting || t('Por acordar con recepción', 'To agree with reception')}</dd>
          </div>
        </dl>
        <div className="fw-pass-emergency">
          <span>{t('Emergencias locales', 'Local emergencies')}</span>
          <strong>{numbers?.map((n) => n.number).join(' / ') || '—'}</strong>
          <small>
            {numbers
              ? t('Para llamar dentro del país', 'For calls within the country')
              : t('Sin teléfonos verificados', 'No verified numbers')}
          </small>
        </div>
      </div>
      <p className="fw-card-caption">
        {t(
          'Tu perfil, plan y contactos en una imagen para consultar sin conexión.',
          'Your profile, plan and contacts in an image you can read offline.',
        )}
      </p>
      <button className="fw-primary fw-card-download" disabled={busy} onClick={saveImage}>
        <DownloadSimpleIcon size={19} aria-hidden="true" />
        {busy
          ? t('Creando imagen…', 'Creating image…')
          : t('Guardar tarjeta como imagen', 'Save card as image')}
      </button>
      <div className="fw-card-secondary">
        <button className="fw-text" onClick={saveText}>
          {t('Descargar en texto', 'Download as text')}
        </button>
        <span>PNG · TXT</span>
      </div>
      <details className="fw-card-contents">
        <summary>{t('Ver todos los datos de la tarjeta', 'View all card details')}</summary>
        <dl>
          {lines.map((row, index) => (
            <div key={index}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </details>
      <p className="fw-card-privacy">
        {t(
          'Se crea en este dispositivo. Contiene datos personales; guárdala de forma privada.',
          'Created on this device. Contains personal data; keep it private.',
        )}
      </p>
      <p role="status" className="fw-card-notice">
        {notice}
      </p>
    </aside>
  );
}

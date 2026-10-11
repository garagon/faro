import { emergencyFor } from './emergency.ts';
import type { Preferences } from './preferences.ts';
import type { HotelPlan, Lang } from './resources.ts';
import { contactKinds, type TravelContact } from './tripData.ts';

export type CardLine = { label: string; value: string };
export function cardLines(
  country: string,
  lang: Lang,
  contacts: TravelContact[],
  plan: HotelPlan | null,
  profile: Preferences | null,
): CardLine[] {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const localPlan = plan?.country === country ? plan : null;
  const emergency = emergencyFor(country);
  return [
    ...(profile?.name ? [{ label: t('Viajero', 'Traveler'), value: profile.name }] : []),
    ...(profile?.phone ? [{ label: t('Mi teléfono', 'My phone'), value: profile.phone }] : []),
    ...(profile?.email ? [{ label: t('Mi correo', 'My email'), value: profile.email }] : []),
    ...(emergency?.numbers.map((n) => ({
      label: n.label[lang === 'es' ? 0 : 1],
      value: n.number,
    })) ?? []),
    ...(emergency
      ? [
          {
            label: t('Fuente · llamadas dentro del país', 'Source · calls within the country'),
            value: emergency.source,
          },
        ]
      : [
          {
            label: t('Emergencias', 'Emergencies'),
            value: t(
              'Sin teléfonos verificados para este destino.',
              'No verified numbers for this destination.',
            ),
          },
        ]),
    ...(localPlan?.name
      ? [{ label: t('Alojamiento', 'Accommodation'), value: localPlan.name }]
      : []),
    ...(localPlan?.meeting
      ? [
          {
            label: t('Punto acordado con recepción', 'Meeting point agreed with reception'),
            value: localPlan.meeting,
          },
        ]
      : []),
    ...(localPlan?.notes
      ? [{ label: t('Instrucciones guardadas', 'Saved instructions'), value: localPlan.notes }]
      : []),
    ...contacts
      .filter((c) => c.country === country)
      .map((c) => ({
        label: contactKinds[c.kind][lang === 'es' ? 0 : 1],
        value: [c.name, c.phone, c.note].filter(Boolean).join('\n'),
      })),
    {
      label: t('Plan personal', 'Personal plan'),
      value: t(
        'Confirma el punto y la ruta con recepción. Esta ficha no acredita un refugio ni indica tu estado actual.',
        'Confirm the meeting point and route with reception. This card does not certify a shelter or show your current status.',
      ),
    },
  ];
}

// All text is drawn locally. No external fonts, images, URLs or personal-data requests.
export async function downloadCardImage(country: string, lang: Lang, lines: CardLine[]) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const width = 1080,
    inset = 72;
  ctx.font = '30px Arial';
  const wrap = (text: string) => {
    const result: string[] = [];
    for (const paragraph of text.split('\n')) {
      let line = '';
      // Code points preserve emoji; wrap long phone/email strings without clipping.
      for (const letter of paragraph) {
        if (ctx.measureText(line + letter).width > width - inset * 2) {
          const space = line.lastIndexOf(' ');
          if (space > line.length / 2) {
            result.push(line.slice(0, space));
            line = line.slice(space + 1) + letter;
          } else {
            result.push(line);
            line = letter;
          }
        } else line += letter;
      }
      result.push(line);
    }
    return result;
  };
  const blocks = lines.map((row) => ({ label: wrap(row.label), value: wrap(row.value) }));
  const height =
    300 +
    blocks.reduce((sum, row) => sum + 44 + (row.label.length + row.value.length) * 40, 0) +
    130;
  // Browser canvas limits vary. Keep the text export available if a very large card cannot render.
  if (height > 16000) throw new Error('Card too long');
  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = '#f8faf7';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#173e35';
  ctx.fillRect(0, 0, width, 250);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px Arial';
  ctx.fillText('Faro', inset, 86);
  ctx.font = '26px Arial';
  ctx.fillText(lang === 'es' ? 'FICHA DEL VIAJE' : 'TRAVEL CARD', inset, 140);
  ctx.font = 'bold 42px Arial';
  ctx.fillText(
    new Intl.DisplayNames([lang], { type: 'region' }).of(country) || country,
    inset,
    205,
    width - inset * 2,
  );
  let y = 302;
  for (const block of blocks) {
    ctx.fillStyle = '#526b64';
    ctx.font = '26px Arial';
    for (const line of block.label) {
      ctx.fillText(line, inset, y);
      y += 40;
    }
    ctx.fillStyle = '#173e35';
    ctx.font = '30px Arial';
    for (const line of block.value) {
      ctx.fillText(line, inset, y);
      y += 40;
    }
    y += 20;
    ctx.fillStyle = '#d6e1da';
    ctx.fillRect(inset, y, width - inset * 2, 1);
    y += 24;
  }
  ctx.font = '23px Arial';
  ctx.fillStyle = '#526b64';
  const date = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(),
  );
  ctx.fillText(`${lang === 'es' ? 'Copia creada' : 'Copy created'}: ${date}`, inset, height - 82);
  ctx.fillText(
    lang === 'es'
      ? 'Datos personales · Guarda esta imagen de forma privada.'
      : 'Personal data · Keep this image private.',
    inset,
    height - 40,
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), 'image/png'),
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `faro-${country.toLowerCase()}-${lang}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

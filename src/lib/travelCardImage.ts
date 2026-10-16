import { downloadBlob } from './download.ts';
import { emergencyFor } from './emergency.ts';
import type { Preferences } from './preferences.ts';
import type { HotelPlan, Lang } from './resources.ts';
import { contactKinds, type TravelContact } from './tripData.ts';
import { langIndex, pick } from './i18n.ts';

export type CardLine = { label: string; value: string };
export function cardLines(
  country: string,
  lang: Lang,
  contacts: TravelContact[],
  plan: HotelPlan | null,
  profile: Preferences | null,
  /**
   * The text card (fichaText). When given, the image carries the same facts — nationality,
   * emergency contact, health if chosen, insurance, stay and dates — instead of a shorter list.
   */
  ficha?: string,
): CardLine[] {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const localPlan = plan?.country === country ? plan : null;
  const emergency = emergencyFor(country);
  const main = emergency?.numbers[0]?.number;
  const fromFicha: CardLine[] = (ficha ?? '')
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    // The numbers are listed below with their labels.
    .filter((line) => line && !(main && line.includes(`: ${main}`)))
    .map((line) => {
      const at = line.indexOf(': ');
      return at > 0 && at < 48
        ? { label: line.slice(0, at), value: line.slice(at + 2) }
        : { label: '', value: line };
    });
  return [
    ...fromFicha,
    ...(!ficha && profile?.name
      ? [{ label: t('Viajero', 'Traveler', 'Viajante'), value: profile.name }]
      : []),
    ...(!ficha && profile?.phone
      ? [{ label: t('Mi teléfono', 'My phone', 'Meu telefone'), value: profile.phone }]
      : []),
    ...(!ficha && profile?.email
      ? [{ label: t('Mi correo', 'My email', 'Meu e-mail'), value: profile.email }]
      : []),
    ...(emergency?.numbers.map((n) => ({
      label: n.label[langIndex(lang)],
      value: n.number,
    })) ?? []),
    ...(emergency
      ? [
          {
            label: t(
              'Fuente · llamadas dentro del país',
              'Source · calls within the country',
              'Fonte · ligações dentro do país',
            ),
            value: emergency.source,
          },
        ]
      : [
          {
            label: t('Emergencias', 'Emergencies', 'Emergência'),
            value: t(
              'Sin teléfonos verificados para este destino.',
              'No verified numbers for this destination.',
              'Sem telefones verificados para este destino.',
            ),
          },
        ]),
    ...(!ficha && localPlan?.name
      ? [{ label: t('Alojamiento', 'Accommodation', 'Hospedagem'), value: localPlan.name }]
      : []),
    ...(!ficha && localPlan?.meeting
      ? [
          {
            label: t(
              'Mi punto de encuentro (nota personal)',
              'My meeting point (personal note)',
              'Meu ponto de encontro (anotação pessoal)',
            ),
            value: localPlan.meeting,
          },
        ]
      : []),
    ...(localPlan?.notes
      ? [
          {
            label: t('Instrucciones guardadas', 'Saved instructions', 'Instruções salvas'),
            value: localPlan.notes,
          },
        ]
      : []),
    ...contacts
      .filter((c) => c.country === country)
      .map((c) => ({
        label: contactKinds[c.kind][langIndex(lang)],
        value: [c.name, c.phone, c.note].filter(Boolean).join('\n'),
      })),
    {
      label: t('Plan personal', 'Personal plan', 'Plano pessoal'),
      value: t(
        'Confirma el punto y la ruta con recepción. Esta ficha no acredita un refugio ni indica tu estado actual.',
        'Confirm the meeting point and route with reception. This card does not certify a shelter or show your current status.',
        'Confirme o ponto e a rota com a recepção. Esta ficha não certifica um abrigo nem indica seu status atual.',
      ),
    },
  ];
}

// All text is drawn locally. No external fonts, images, URLs or personal-data requests.
export async function downloadCardImage(country: string, lang: Lang, lines: CardLine[]) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
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
  ctx.fillText(t('FICHA DEL VIAJE', 'TRAVEL CARD', 'FICHA DA VIAGEM'), inset, 140);
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
  ctx.fillText(`${t('Copia creada', 'Copy created', 'Cópia criada')}: ${date}`, inset, height - 82);
  ctx.fillText(
    t(
      'Datos personales · Guarda esta imagen de forma privada.',
      'Personal data · Keep this image private.',
      'Dados pessoais · Guarde esta imagem de forma privada.',
    ),
    inset,
    height - 40,
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), 'image/png'),
  );
  downloadBlob(blob, `faro-${country.toLowerCase()}-${lang}.png`);
}

import type { Localized } from './destinations/types.ts';
export type KitGroup = 'supplies' | 'tools' | 'personal';
export type KitItem = { id: string; group: KitGroup; title: Localized; detail: Localized };
export const kitSources = [
  { name: 'SENAPRED · Kit de emergencia', url: 'https://www.senapred.gov.cl/kit-de-emergencia/' },
  { name: 'SENAPRED · Familia preparada', url: 'https://senapred.cl/familia-preparada/' },
];
// A traveller adaptation. Supplies for 72 hours need not all fit in one carry bag.
export const kitItems: KitItem[] = [
  {
    id: 'water',
    group: 'supplies',
    title: ['Agua potable', 'Drinking water'],
    detail: [
      'Referencia SENAPRED: 2 litros por persona y día; 6 litros para 3 días. Adapta la reserva al clima y a tus necesidades.',
      'SENAPRED baseline: 2 litres per person per day; 6 litres for 3 days. Adapt supplies to the climate and your needs.',
    ],
  },
  {
    id: 'food',
    group: 'supplies',
    title: ['Comida sin cocinar', 'Ready-to-eat food'],
    detail: [
      'Para 3 días. Considera alergias y un abrelatas si hace falta.',
      'For 3 days. Consider allergies and a can opener if needed.',
    ],
  },
  {
    id: 'medicine',
    group: 'supplies',
    title: ['Medicamentos y recetas', 'Medication and prescriptions'],
    detail: [
      'Los de uso habitual, con sus indicaciones de conservación.',
      'Your regular medication, with its storage instructions.',
    ],
  },
  {
    id: 'firstaid',
    group: 'supplies',
    title: ['Botiquín', 'First-aid kit'],
    detail: [
      'Gasas, apósitos, vendas y guantes; revisa las fechas de vencimiento.',
      'Gauze, dressings, bandages and gloves; check expiry dates.',
    ],
  },
  {
    id: 'light',
    group: 'tools',
    title: ['Linterna y pilas', 'Flashlight and batteries'],
    detail: [
      'Prueba la luz y guarda pilas de repuesto.',
      'Test the light and pack spare batteries.',
    ],
  },
  {
    id: 'radio',
    group: 'tools',
    title: ['Radio portátil', 'Portable radio'],
    detail: [
      'A pilas o con carga manual, para avisos sin internet.',
      'Battery-powered or hand-crank, for updates without internet.',
    ],
  },
  {
    id: 'power',
    group: 'tools',
    title: ['Teléfono, cable y batería externa', 'Phone, cable and power bank'],
    detail: [
      'Mantén la batería externa cargada. Adaptación de Faro para viajeros.',
      'Keep the power bank charged. Faro addition for travellers.',
    ],
  },
  {
    id: 'whistle',
    group: 'tools',
    title: ['Silbato', 'Whistle'],
    detail: [
      'Para llamar la atención sin depender del teléfono.',
      'To attract attention without relying on your phone.',
    ],
  },
  {
    id: 'documents',
    group: 'personal',
    title: ['Documentos y contactos', 'Documents and contacts'],
    detail: [
      'Copias de identidad, seguro, recetas y teléfonos en una funda impermeable.',
      'Copies of ID, insurance, prescriptions and phone numbers in a waterproof pouch.',
    ],
  },
  {
    id: 'plan',
    group: 'personal',
    title: ['Plan de evacuación en papel', 'Printed evacuation plan'],
    detail: [
      'Salida del alojamiento, punto acordado y contacto familiar.',
      'Accommodation exit, agreed meeting point and family contact.',
    ],
  },
  {
    id: 'cash',
    group: 'personal',
    title: ['Efectivo y llaves', 'Cash and keys'],
    detail: [
      'Billetes pequeños y copia de las llaves que necesites.',
      'Small notes and copies of keys you need.',
    ],
  },
  {
    id: 'clothes',
    group: 'personal',
    title: ['Ropa, calzado y abrigo', 'Clothes, shoes and warmth'],
    detail: [
      'Muda seca, zapatos resistentes y manta, según el clima.',
      'Dry clothes, sturdy shoes and a blanket, suited to the climate.',
    ],
  },
  {
    id: 'hygiene',
    group: 'personal',
    title: ['Higiene', 'Hygiene'],
    detail: [
      'Papel, jabón o gel, bolsas de basura y productos de higiene menstrual.',
      'Tissues, soap or sanitiser, waste bags and menstrual products.',
    ],
  },
  {
    id: 'access',
    group: 'personal',
    title: ['Necesidades de tu grupo', 'Your group’s needs'],
    detail: [
      'Lentes, ayudas técnicas, insumos para bebés y mascotas, según corresponda.',
      'Glasses, assistive supplies, baby and pet supplies, as applicable.',
    ],
  },
];
export const kitKey = 'faro-emergency-kit-v1';
export function parseKit(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string =>
                typeof id === 'string' && kitItems.some((item) => item.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export function kitText(lang: 'es' | 'en', checked: string[]) {
  const i = lang === 'es' ? 0 : 1;
  return [
    lang === 'es' ? 'FARO · MOCHILA DE EMERGENCIA' : 'FARO · EMERGENCY KIT',
    lang === 'es'
      ? 'Prepara reservas para 72 horas. Lleva una mochila que puedas cargar. No retrases una evacuación para buscarla.'
      : 'Prepare supplies for 72 hours. Keep your carry bag manageable. Do not delay evacuation to collect it.',
    ...kitItems.map(
      (item) => `${checked.includes(item.id) ? '[x]' : '[ ]'} ${item.title[i]} — ${item.detail[i]}`,
    ),
    ...kitSources.map((s) => `${s.name}: ${s.url}`),
  ].join('\n\n');
}

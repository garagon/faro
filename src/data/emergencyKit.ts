import type { Localized } from './destinations/types.ts';
import type { PlaceKind } from '../lib/nearbyCare.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
export type KitGroup = 'supplies' | 'tools' | 'personal';
export type KitHazard = 'earthquake' | 'hurricane' | 'flood' | 'volcano';
export type KitItem = {
  id: string;
  group: KitGroup;
  title: Localized;
  detail: Localized;
  /** Where the item is usually bought; absent when it is prepared rather than bought. */
  store?: PlaceKind;
  /** Shown only when one of these hazards is selected. */
  hazards?: KitHazard[];
};
export const kitSources = [
  { name: 'SENAPRED · Kit de emergencia', url: 'https://www.senapred.gov.cl/kit-de-emergencia/' },
  { name: 'SENAPRED · Familia preparada', url: 'https://senapred.cl/familia-preparada/' },
  { name: 'Ready.gov · Build a Kit', url: 'https://www.ready.gov/kit' },
];
export const kitHazards: { id: KitHazard; label: Localized; tip: Localized }[] = [
  {
    id: 'earthquake',
    label: ['Sismo', 'Earthquake', 'Terremoto'],
    tip: [
      'Suma una mascarilla para el polvo después del sismo y guarda la mochila en un lugar de fácil acceso.',
      'Add a mask for dust after the shaking and keep the bag somewhere easy to reach.',
      'Inclua uma máscara contra a poeira depois do terremoto e guarde a mochila em um lugar de fácil acesso.',
    ],
  },
  {
    id: 'hurricane',
    label: ['Huracán', 'Hurricane', 'Furacão'],
    tip: [
      'Compra con tiempo: después de un huracán podrías no conseguir medicamentos ni suministros durante días o semanas.',
      'Buy early: after a hurricane, medication and supplies may be unavailable for days or weeks.',
      'Compre com antecedência: depois de um furacão, talvez você não consiga remédios nem suprimentos por dias ou semanas.',
    ],
  },
  {
    id: 'flood',
    label: ['Inundación', 'Flood', 'Inundação'],
    tip: [
      'Guarda documentos, medicamentos y teléfono en una bolsa impermeable, en un lugar alto.',
      'Keep documents, medication and phone in a waterproof bag, stored up high.',
      'Guarde documentos, remédios e celular em uma bolsa impermeável, em um lugar alto.',
    ],
  },
  {
    id: 'volcano',
    label: ['Volcán', 'Volcano', 'Vulcão'],
    tip: [
      'Para la ceniza: mascarilla N95 bien ajustada y gafas protectoras.',
      'For ash: a well-fitting N95 mask and protective goggles.',
      'Contra as cinzas: máscara N95 bem ajustada e óculos de proteção.',
    ],
  },
];
/** SENAPRED baseline and the Ready.gov gallon, which also covers hygiene. */
export const WATER_PER_DAY = { senapred: 2, ready: 3.8 };
export type KitPlan = { people: number; days: number; hazards: KitHazard[] };
export const kitPlanKey = 'faro-emergency-kit-plan-v1';
export const kitDays = [3, 5, 7];
export const defaultKitPlan: KitPlan = { people: 1, days: 3, hazards: [] };
export function parseKitPlan(raw: string | null): KitPlan {
  try {
    const value = JSON.parse(raw || 'null') as Partial<KitPlan> | null;
    if (!value || typeof value !== 'object') return defaultKitPlan;
    const people =
      Number.isInteger(value.people) && value.people! >= 1 && value.people! <= 12
        ? value.people!
        : 1;
    const days = kitDays.includes(value.days as number) ? (value.days as number) : 3;
    const hazards = Array.isArray(value.hazards)
      ? kitHazards.map((h) => h.id).filter((id) => value.hazards!.includes(id))
      : [];
    return { people, days, hazards };
  } catch {
    return defaultKitPlan;
  }
}
export function waterLitres(plan: Pick<KitPlan, 'people' | 'days'>) {
  return {
    minimum: plan.people * plan.days * WATER_PER_DAY.senapred,
    ready: Math.ceil(plan.people * plan.days * WATER_PER_DAY.ready),
  };
}
/** Items that apply to the selected hazards; with no plan, every item. */
export function kitItemsFor(plan?: Pick<KitPlan, 'hazards'>) {
  return kitItems.filter(
    (item) => !item.hazards || !plan || item.hazards.some((h) => plan.hazards.includes(h)),
  );
}
// A traveler adaptation. Supplies for 72 hours need not all fit in one carry bag.
export const kitItems: KitItem[] = [
  {
    id: 'water',
    store: 'supermarket',
    group: 'supplies',
    title: ['Agua potable', 'Drinking water', 'Água potável'],
    detail: [
      'Referencia de SENAPRED (Chile) para beber: 2 litros por persona y día; 6 litros para 3 días. Con calor o para higiene, lleva más.',
      'SENAPRED (Chile) drinking baseline: 2 liters per person per day; 6 liters for 3 days. In heat or for hygiene, carry more.',
      'Referência do SENAPRED (Chile) para beber: 2 litros por pessoa por dia; 6 litros para 3 dias. No calor ou para higiene, leve mais.',
    ],
  },
  {
    id: 'food',
    store: 'supermarket',
    group: 'supplies',
    title: ['Comida sin cocinar', 'Ready-to-eat food', 'Comida pronta para consumo'],
    detail: [
      'Para 3 días. Considera alergias y un abrelatas si hace falta.',
      'For 3 days. Consider allergies and a can opener if needed.',
      'Para 3 dias. Leve em conta alergias e um abridor de latas, se precisar.',
    ],
  },
  {
    id: 'medicine',
    store: 'pharmacy',
    group: 'supplies',
    title: ['Medicamentos y recetas', 'Medication and prescriptions', 'Remédios e receitas'],
    detail: [
      'Los de uso habitual, con sus indicaciones de conservación.',
      'Your regular medication, with its storage instructions.',
      'Os de uso habitual, com as instruções de armazenamento.',
    ],
  },
  {
    id: 'firstaid',
    store: 'pharmacy',
    group: 'supplies',
    title: ['Botiquín', 'First-aid kit', 'Kit de primeiros socorros'],
    detail: [
      'Gasas, apósitos, vendas y guantes; revisa las fechas de vencimiento.',
      'Gauze, dressings, bandages and gloves; check expiry dates.',
      'Gaze, curativos, ataduras e luvas; confira as datas de validade.',
    ],
  },
  {
    id: 'light',
    store: 'hardware',
    group: 'tools',
    title: ['Linterna y pilas', 'Flashlight and batteries', 'Lanterna e pilhas'],
    detail: [
      'Prueba la luz y guarda pilas de repuesto.',
      'Test the light and pack spare batteries.',
      'Teste a lanterna e guarde pilhas de reserva.',
    ],
  },
  {
    id: 'radio',
    store: 'electronics',
    group: 'tools',
    title: ['Radio portátil', 'Portable radio', 'Rádio portátil'],
    detail: [
      'A pilas o con carga manual, para avisos sin internet.',
      'Battery-powered or hand-crank, for updates without internet.',
      'A pilha ou à manivela, para avisos sem internet.',
    ],
  },
  {
    id: 'power',
    store: 'electronics',
    group: 'tools',
    title: [
      'Teléfono, cable y batería externa',
      'Phone, cable and power bank',
      'Celular, cabo e carregador portátil',
    ],
    detail: [
      'Mantén la batería externa cargada. Adaptación de Faro para viajeros.',
      'Keep the power bank charged. Faro addition for travelers.',
      'Mantenha o carregador portátil carregado. Adaptação do Faro para viajantes.',
    ],
  },
  {
    id: 'whistle',
    store: 'hardware',
    group: 'tools',
    title: ['Silbato', 'Whistle', 'Apito'],
    detail: [
      'Para llamar la atención sin depender del teléfono.',
      'To attract attention without relying on your phone.',
      'Para chamar a atenção sem depender do celular.',
    ],
  },
  {
    id: 'documents',
    store: 'copies',
    group: 'personal',
    title: ['Documentos y contactos', 'Documents and contacts', 'Documentos e contatos'],
    detail: [
      'Copias de identidad, seguro, recetas y teléfonos en una funda impermeable.',
      'Copies of ID, insurance, prescriptions and phone numbers in a waterproof pouch.',
      'Cópias do documento de identidade, seguro, receitas e telefones em uma capa impermeável.',
    ],
  },
  {
    id: 'plan',
    store: 'copies',
    group: 'personal',
    title: [
      'Plan de evacuación en papel',
      'Printed evacuation plan',
      'Plano de evacuação impresso',
    ],
    detail: [
      'Salida del alojamiento, punto acordado y contacto familiar.',
      'Accommodation exit, agreed meeting point and family contact.',
      'Saída da hospedagem, ponto de encontro combinado e contato da família.',
    ],
  },
  {
    id: 'cash',
    store: 'atm',
    group: 'personal',
    title: ['Efectivo y llaves', 'Cash and keys', 'Dinheiro e chaves'],
    detail: [
      'Billetes pequeños y copia de las llaves que necesites.',
      'Small notes and copies of keys you need.',
      'Notas pequenas e cópias das chaves de que você precisa.',
    ],
  },
  {
    id: 'clothes',
    group: 'personal',
    title: ['Ropa, calzado y abrigo', 'Clothes, shoes and warmth', 'Roupa, calçado e agasalho'],
    detail: [
      'Muda seca, zapatos resistentes y manta, según el clima.',
      'Dry clothes, sturdy shoes and a blanket, suited to the climate.',
      'Muda de roupa seca, sapatos resistentes e cobertor, conforme o clima.',
    ],
  },
  {
    id: 'hygiene',
    store: 'supermarket',
    group: 'personal',
    title: ['Higiene', 'Hygiene', 'Higiene'],
    detail: [
      'Papel, jabón o gel, bolsas de basura y productos de higiene menstrual.',
      'Tissues, soap or sanitizer, waste bags and menstrual products.',
      'Papel, sabonete ou álcool em gel, sacos de lixo e produtos de higiene menstrual.',
    ],
  },
  {
    id: 'mask',
    group: 'supplies',
    store: 'pharmacy',
    hazards: ['earthquake', 'volcano'],
    title: ['Mascarilla N95 y gafas', 'N95 mask and goggles', 'Máscara N95 e óculos'],
    detail: [
      'Para ceniza volcánica o polvo después de un sismo. Debe quedar bien ajustada.',
      'For volcanic ash or dust after an earthquake. It must fit well.',
      'Para cinza vulcânica ou poeira depois de um terremoto. Ela deve ficar bem ajustada.',
    ],
  },
  {
    id: 'drybag',
    group: 'personal',
    store: 'hardware',
    hazards: ['hurricane', 'flood'],
    title: ['Bolsa impermeable', 'Waterproof bag', 'Bolsa impermeável'],
    detail: [
      'Para documentos, medicamentos y teléfono si llueve o hay agua.',
      'For documents, medication and phone in rain or flood water.',
      'Para documentos, remédios e celular se chover ou houver água.',
    ],
  },
  {
    id: 'access',
    group: 'personal',
    title: ['Necesidades de tu grupo', 'Your group’s needs', 'Necessidades do seu grupo'],
    detail: [
      'Lentes, ayudas técnicas, insumos para bebés y mascotas, según corresponda.',
      'Glasses, assistive supplies, baby and pet supplies, as applicable.',
      'Óculos, recursos de acessibilidade, itens para bebês e animais de estimação, conforme o caso.',
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
export const storeLabels: Record<PlaceKind, Localized> = {
  supermarket: ['Supermercado', 'Supermarket', 'Supermercado'],
  pharmacy: ['Farmacia', 'Pharmacy', 'Farmácia'],
  hardware: ['Ferretería', 'Hardware store', 'Loja de ferragens'],
  electronics: ['Electrónica', 'Electronics store', 'Loja de eletrônicos'],
  copies: ['Papelería o centro de copias', 'Print and copy shop', 'Papelaria ou copiadora'],
  atm: ['Cajero automático', 'ATM', 'Caixa eletrônico'],
  hospital: ['Hospital', 'Hospital', 'Hospital'],
};
/** Unchecked items that can be bought, grouped by the kind of place that usually sells them. */
export function shoppingList(checked: string[], plan?: Pick<KitPlan, 'hazards'>) {
  const groups = new Map<PlaceKind, KitItem[]>();
  for (const item of kitItemsFor(plan))
    if (item.store && !checked.includes(item.id))
      groups.set(item.store, [...(groups.get(item.store) || []), item]);
  return [...groups].map(([store, items]) => ({ store, items }));
}
export function planSummary(lang: Lang, plan: KitPlan) {
  const { minimum, ready } = waterLitres(plan);
  const one = plan.people === 1;
  const people = `${plan.people} ${pick(lang, one ? 'persona' : 'personas', one ? 'person' : 'people', one ? 'pessoa' : 'pessoas')}`;
  return pick(
    lang,
    `Para ${people} y ${plan.days} días. Agua: al menos ${minimum} L (SENAPRED, 2 L por persona y día). Ready.gov recomienda ${ready} L, para beber e higiene.`,
    `For ${people} and ${plan.days} days. Water: at least ${minimum} L (SENAPRED, 2 L per person per day). Ready.gov recommends ${ready} L, for drinking and hygiene.`,
    `Para ${people} e ${plan.days} dias. Água: pelo menos ${minimum} L (SENAPRED, 2 L por pessoa por dia). O Ready.gov recomenda ${ready} L, para beber e para higiene.`,
  );
}
/** An item's line, with water and food sized to the person's plan when there is one. */
export function itemDetail(item: KitItem, lang: Lang, plan?: KitPlan) {
  if (plan && item.id === 'water') {
    const { minimum } = waterLitres(plan);
    return pick(
      lang,
      `${minimum} L para tu reserva. Adapta la cantidad al clima y a tus necesidades.`,
      `${minimum} L for your supplies. Adapt the amount to the climate and your needs.`,
      `${minimum} L para seus suprimentos. Ajuste a quantidade ao clima e às suas necessidades.`,
    );
  }
  if (plan && item.id === 'food')
    return pick(
      lang,
      `Para ${plan.days} días. Considera alergias y un abrelatas si hace falta.`,
      `For ${plan.days} days. Consider allergies and a can opener if needed.`,
      `Para ${plan.days} dias. Leve em conta alergias e um abridor de latas, se precisar.`,
    );
  return item.detail[langIndex(lang)];
}
export function kitText(lang: Lang, checked: string[], plan?: KitPlan) {
  const i = langIndex(lang);
  const shopping = plan ? shoppingList(checked, plan) : [];
  return [
    pick(
      lang,
      'FARO · MOCHILA DE EMERGENCIA',
      'FARO · EMERGENCY KIT',
      'FARO · MOCHILA DE EMERGÊNCIA',
    ),
    pick(
      lang,
      `Prepara reservas para ${plan?.days ?? 3} días. Lleva una mochila que puedas cargar. No retrases una evacuación para buscarla.`,
      `Prepare supplies for ${plan?.days ?? 3} days. Keep your carry bag manageable. Do not delay evacuation to collect it.`,
      `Prepare suprimentos para ${plan?.days ?? 3} dias. Tenha uma mochila que você consiga carregar. Não atrase uma evacuação para buscá-la.`,
    ),
    ...(plan ? [planSummary(lang, plan)] : []),
    ...(plan?.hazards.length
      ? kitHazards
          .filter((h) => plan.hazards.includes(h.id))
          .map((h) => `${h.label[i]}: ${h.tip[i]}`)
      : []),
    ...kitItemsFor(plan).map(
      (item) =>
        `${checked.includes(item.id) ? '[x]' : '[ ]'} ${item.title[i]} — ${itemDetail(item, lang, plan)}`,
    ),
    ...(shopping.length
      ? [
          pick(
            lang,
            'Dónde comprar lo que falta',
            'Where to buy what is missing',
            'Onde comprar o que falta',
          ),
          ...shopping.map(
            ({ store, items }) =>
              `${storeLabels[store][i]}: ${items.map((item) => item.title[i]).join(', ')}`,
          ),
        ]
      : []),
    ...kitSources.map((s) => `${s.name}: ${s.url}`),
  ].join('\n\n');
}

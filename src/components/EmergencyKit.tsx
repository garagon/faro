import { downloadText } from '../lib/download.ts';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  ArrowUpRightIcon,
  BagSimpleIcon,
  BatteryChargingIcon,
  BowlFoodIcon,
  CheckCircleIcon,
  DownloadSimpleIcon,
  DropIcon,
  FaceMaskIcon,
  FirstAidKitIcon,
  FlashlightIcon,
  HammerIcon,
  HandSoapIcon,
  IdentificationCardIcon,
  InfoIcon,
  MapTrifoldIcon,
  MegaphoneSimpleIcon,
  MoneyIcon,
  PackageIcon,
  PillIcon,
  PrinterIcon,
  RadioIcon,
  ShoppingCartIcon,
  TShirtIcon,
  UsersThreeIcon,
  WarningIcon,
  type IconProps,
} from '@phosphor-icons/react';
import {
  kitDays,
  kitHazards,
  kitItemsFor,
  kitKey,
  kitPlanKey,
  kitSources,
  itemDetail,
  kitText,
  parseKit,
  parseKitPlan,
  shoppingList,
  storeLabels,
  waterShown,
  type KitGroup,
  type KitHazard,
  type KitPlan,
} from '../data/emergencyKit.ts';
import { careSearchUrl, type PlaceKind } from '../lib/nearbyCare.ts';
import { writeLocal, removeLocal } from '../lib/browserStorage.ts';
import { AreaFields, useSearchArea } from './AreaPicker.tsx';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';

// One recognizable picture per item, so the list can be scanned without reading every line.
const itemIcons: Record<string, ComponentType<IconProps>> = {
  water: DropIcon,
  food: BowlFoodIcon,
  medicine: PillIcon,
  firstaid: FirstAidKitIcon,
  light: FlashlightIcon,
  radio: RadioIcon,
  power: BatteryChargingIcon,
  whistle: MegaphoneSimpleIcon,
  documents: IdentificationCardIcon,
  plan: MapTrifoldIcon,
  cash: MoneyIcon,
  clothes: TShirtIcon,
  hygiene: HandSoapIcon,
  access: UsersThreeIcon,
  drybag: BagSimpleIcon,
  mask: FaceMaskIcon,
};
const storeIcons: Partial<Record<PlaceKind, ComponentType<IconProps>>> = {
  supermarket: ShoppingCartIcon,
  pharmacy: PillIcon,
  hardware: HammerIcon,
  electronics: BatteryChargingIcon,
  copies: PrinterIcon,
  atm: MoneyIcon,
};

function readStored<T>(key: string, parse: (raw: string | null) => T): T {
  try {
    return parse(localStorage.getItem(key));
  } catch {
    return parse(null);
  }
}

export default function EmergencyKit({ lang, country }: { lang: Lang; country: string }) {
  const [checked, setChecked] = useState<string[]>(() => readStored(kitKey, parseKit));
  const [plan, setPlanState] = useState<KitPlan>(() => readStored(kitPlanKey, parseKitPlan));
  const [error, setError] = useState(false),
    // While filtering, keep showing items that were pending when the filter was turned on,
    // so checking one does not remove it from under the pointer or keyboard focus.
    [pendingOnly, setPendingOnly] = useState<string[] | null>(null),
    [confirmReset, setConfirmReset] = useState(false);
  const confirmButton = useRef<HTMLButtonElement>(null),
    startOverButton = useRef<HTMLButtonElement>(null),
    downloadButton = useRef<HTMLButtonElement>(null);
  const focusLater = (target: { current: HTMLElement | null }) =>
    requestAnimationFrame(() => target.current?.focus());
  useEffect(() => {
    if (confirmReset) confirmButton.current?.focus();
  }, [confirmReset]);
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    i = langIndex(lang);
  const items = kitItemsFor(plan);
  const done = items.filter((item) => checked.includes(item.id)).length;
  const water = waterShown(plan, lang);
  const groups: { id: KitGroup; title: string }[] = [
    {
      id: 'supplies',
      title: t('Agua, comida y salud', 'Water, food and health', 'Água, comida e saúde'),
    },
    {
      id: 'tools',
      title: t('Luz y comunicación', 'Light and communication', 'Luz e comunicação'),
    },
    {
      id: 'personal',
      title: t(
        'Documentos y necesidades personales',
        'Documents and personal needs',
        'Documentos e necessidades pessoais',
      ),
    },
  ];
  function save(key: string, value: unknown) {
    try {
      writeLocal(key, JSON.stringify(value));
      setError(false);
    } catch {
      setError(true);
    }
  }
  function toggle(id: string) {
    const next = checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id];
    setChecked(next);
    save(kitKey, next);
  }
  function setPlan(next: KitPlan) {
    setPlanState(next);
    save(kitPlanKey, next);
  }
  function toggleHazard(id: KitHazard) {
    const hazards = plan.hazards.includes(id)
      ? plan.hazards.filter((h) => h !== id)
      : kitHazards.map((h) => h.id).filter((h) => h === id || plan.hazards.includes(h));
    setPlan({ ...plan, hazards });
    if (pendingOnly)
      setPendingOnly(
        kitItemsFor({ hazards })
          .filter((item) => !checked.includes(item.id))
          .map((item) => item.id),
      );
  }
  const people = (n: number) =>
    `${n} ${n === 1 ? t('persona', 'person', 'pessoa') : t('personas', 'people', 'pessoas')}`;
  const download = () =>
    downloadText(kitText(lang, checked, plan), `faro-emergency-kit-${lang}.txt`);
  return (
    <div className="fw-kit">
      <p className="fw-kit-warning">
        <WarningIcon size={17} weight="bold" aria-hidden="true" />
        {t(
          'Si tienes que evacuar, sal sin buscar la mochila y no vuelvas por el equipaje.',
          'If you have to evacuate, leave without looking for the bag and do not go back for luggage.',
          'Se precisar evacuar, saia sem procurar a mochila e não volte para buscar a bagagem.',
        )}
      </p>

      <section className="fw-kit-card fw-kit-plan" aria-labelledby="kit-plan-title">
        <h2 id="kit-plan-title">{t('Tu reserva', 'Your supplies', 'Seus suprimentos')}</h2>
        <div className="fw-kit-plan-fields">
          <div className="fw-stepper" role="group" aria-labelledby="kit-people">
            <span id="kit-people">{t('Personas', 'People', 'Pessoas')}</span>
            <div>
              <button
                type="button"
                aria-label={t('Una persona menos', 'One person fewer', 'Uma pessoa a menos')}
                disabled={plan.people <= 1}
                onClick={() => setPlan({ ...plan, people: plan.people - 1 })}
              >
                −
              </button>
              <output aria-live="polite">{plan.people}</output>
              <button
                type="button"
                aria-label={t('Una persona más', 'One more person', 'Uma pessoa a mais')}
                disabled={plan.people >= 12}
                onClick={() => setPlan({ ...plan, people: plan.people + 1 })}
              >
                +
              </button>
            </div>
          </div>
          <label className="fw-kit-days">
            {t('Días', 'Days', 'Dias')}
            <select
              value={plan.days}
              onChange={(e) => setPlan({ ...plan, days: Number(e.target.value) })}
            >
              {kitDays.map((d) => (
                <option key={d} value={d}>
                  {t(`${d} días`, `${d} days`, `${d} dias`)}
                </option>
              ))}
            </select>
          </label>
          <div className="fw-kit-hazards" role="group" aria-labelledby="kit-hazards-label">
            <span id="kit-hazards-label">
              {t('Te preparas para', 'Preparing for', 'Você se prepara para')}
            </span>
            <div>
              {kitHazards.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  aria-pressed={plan.hazards.includes(h.id)}
                  onClick={() => toggleHazard(h.id)}
                >
                  {h.label[i]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <dl className="fw-kit-stats">
          <div>
            <dt>{t('Agua', 'Water', 'Água')}</dt>
            <dd>
              <strong>{water.minimum}</strong>
              <span>
                {t(
                  `como mínimo, para ${people(plan.people)} y ${plan.days} días`,
                  `at least, for ${people(plan.people)} and ${plan.days} days`,
                  `no mínimo, para ${people(plan.people)} e ${plan.days} dias`,
                )}
              </span>
            </dd>
          </div>
          <div>
            <dt>{t('Comida', 'Food', 'Comida')}</dt>
            <dd>
              <strong>{t(`${plan.days} días`, `${plan.days} days`, `${plan.days} dias`)}</strong>
              <span>
                {t(
                  `lista para comer, para ${people(plan.people)}`,
                  `ready to eat, for ${people(plan.people)}`,
                  `pronta para consumo, para ${people(plan.people)}`,
                )}
              </span>
            </dd>
          </div>
          <div className={done === items.length ? 'is-complete' : ''}>
            <dt>{t('Tu mochila', 'Your bag', 'Sua mochila')}</dt>
            <dd>
              <strong role="status">
                {done === items.length ? (
                  <>
                    <CheckCircleIcon size={20} weight="fill" aria-hidden="true" />
                    {t('Completa', 'Complete', 'Completa')}
                  </>
                ) : (
                  t(
                    `${done} de ${items.length}`,
                    `${done} of ${items.length}`,
                    `${done} de ${items.length}`,
                  )
                )}
              </strong>
              <progress
                value={done}
                max={items.length}
                aria-label={t('Elementos marcados', 'Items checked', 'Itens marcados')}
              />
            </dd>
          </div>
        </dl>
        <p className="fw-kit-basis">
          <InfoIcon size={16} aria-hidden="true" />
          {t(
            `Agua: 2 L por persona y día para beber, según SENAPRED (Chile). Ready.gov recomienda ${water.ready} para este caso, porque incluye higiene; con calor, lleva más.`,
            `Water: about half a gallon (2 L) per person per day for drinking, according to SENAPRED (Chile). Ready.gov recommends ${water.ready} here, one per person per day, as it includes hygiene; in heat, carry more.`,
            `Água: 2 L por pessoa por dia para beber, segundo o SENAPRED (Chile). O Ready.gov recomenda ${water.ready} para este caso, porque inclui higiene; no calor, leve mais.`,
          )}
        </p>
        {plan.hazards.length > 0 && (
          <ul className="fw-kit-tips">
            {kitHazards
              .filter((h) => plan.hazards.includes(h.id))
              .map((h) => (
                <li key={h.id}>
                  <strong>{h.label[i]}.</strong> {h.tip[i]}
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="fw-kit-card fw-kit-list" aria-labelledby="kit-list-title">
        <div className="fw-kit-list-head">
          <h2 id="kit-list-title">{t('Qué llevar', 'What to pack', 'O que levar')}</h2>
          <label className="fw-kit-filter">
            <input
              type="checkbox"
              checked={pendingOnly !== null}
              onChange={(e) =>
                setPendingOnly(
                  e.target.checked
                    ? items.filter((item) => !checked.includes(item.id)).map((item) => item.id)
                    : null,
                )
              }
            />
            {t('Mostrar solo lo que falta', 'Show only what is missing', 'Mostrar só o que falta')}
          </label>
        </div>
        <p className="fw-kit-saved">
          {error
            ? t(
                'No se pudo guardar. Descarga tu lista para no perderla.',
                'Could not save. Download your list so you do not lose it.',
                'Não foi possível salvar. Baixe sua lista para não perdê-la.',
              )
            : t(
                'Lo que marcas se guarda solo en este navegador.',
                'What you tick is saved only in this browser.',
                'O que você marca fica salvo só neste navegador.',
              )}
        </p>
        {groups.map((group) => {
          const inGroup = items.filter((item) => item.group === group.id);
          const groupDone = inGroup.filter((item) => checked.includes(item.id)).length;
          const visible = pendingOnly
            ? inGroup.filter((item) => pendingOnly.includes(item.id))
            : inGroup;
          return (
            <fieldset key={group.id} className={groupDone === inGroup.length ? 'is-complete' : ''}>
              <legend>
                {group.title}
                <span className="fw-kit-count">
                  {t(
                    `${groupDone} de ${inGroup.length}`,
                    `${groupDone} of ${inGroup.length}`,
                    `${groupDone} de ${inGroup.length}`,
                  )}
                </span>
              </legend>
              {visible.length === 0 && (
                <p className="fw-kit-group-done">
                  {t(
                    'Todo marcado en este grupo.',
                    'Everything checked in this group.',
                    'Tudo marcado neste grupo.',
                  )}
                </p>
              )}
              <div className="fw-kit-items">
                {visible.map((item) => {
                  const Icon = itemIcons[item.id] ?? PackageIcon;
                  return (
                    <label className={checked.includes(item.id) ? 'is-checked' : ''} key={item.id}>
                      <input
                        type="checkbox"
                        checked={checked.includes(item.id)}
                        onChange={() => toggle(item.id)}
                      />
                      <Icon className="fw-kit-item-icon" size={22} aria-hidden="true" />
                      <span>
                        <strong>{item.title[i]}</strong>
                        <small>{itemDetail(item, lang, plan)}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </section>

      <KitShopping key={country} lang={lang} country={country} checked={checked} plan={plan} />

      <div className="fw-kit-actions">
        <button ref={downloadButton} className="fw-primary" onClick={download}>
          <DownloadSimpleIcon size={19} />
          {t('Descargar mi lista', 'Download my checklist', 'Baixar minha lista')}
        </button>
        {checked.length > 0 && !confirmReset && (
          <button ref={startOverButton} className="fw-text" onClick={() => setConfirmReset(true)}>
            {t('Empezar de nuevo', 'Start over', 'Começar de novo')}
          </button>
        )}
        {confirmReset && (
          <span
            className="fw-kit-confirm"
            role="group"
            aria-label={t('Confirmar', 'Confirm', 'Confirmar')}
          >
            {t('¿Desmarcar toda la lista?', 'Uncheck the whole list?', 'Desmarcar a lista toda?')}
            <button
              ref={confirmButton}
              className="fw-text"
              onClick={() => {
                try {
                  removeLocal(kitKey);
                  setChecked([]);
                  setError(false);
                } catch {
                  setError(true);
                }
                setConfirmReset(false);
                if (pendingOnly) setPendingOnly(items.map((item) => item.id));
                focusLater(downloadButton);
              }}
            >
              {t('Sí, desmarcar', 'Yes, uncheck', 'Sim, desmarcar')}
            </button>
            <button
              className="fw-text"
              onClick={() => {
                setConfirmReset(false);
                focusLater(startOverButton);
              }}
            >
              {t('Cancelar', 'Cancel', 'Cancelar')}
            </button>
          </span>
        )}
      </div>
      <p className="fw-kit-footnote">
        {t(
          'Revisa pilas, cargas y vencimientos antes de viajar. Marcar la lista no comprueba lo que hay en la mochila.',
          'Check batteries, charges and expiry dates before traveling. Ticking the list does not check what is in the bag.',
          'Confira pilhas, cargas e datas de validade antes de viajar. Marcar a lista não verifica o que há na mochila.',
        )}
      </p>
      <footer>
        <span>
          {t(
            'Adaptación para viajeros. Fuentes consultadas el 13 oct 2026:',
            'Traveler adaptation. Sources checked on Oct 13, 2026:',
            'Adaptação para viajantes. Fontes consultadas em 13 out. 2026:',
          )}
        </span>
        {kitSources.map((s) => (
          <a href={s.url} key={s.url} target="_blank" rel="noreferrer">
            {s.name}
            <ArrowUpRightIcon size={13} aria-hidden="true" />
          </a>
        ))}
      </footer>
    </div>
  );
}

/** Missing items grouped by the kind of shop that sells them, with a nearby search for each. */
function KitShopping({
  lang,
  country,
  checked,
  plan,
}: {
  lang: Lang;
  country: string;
  checked: string[];
  plan: KitPlan;
}) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    i = langIndex(lang);
  const search = useSearchArea(country, lang);
  const list = shoppingList(checked, plan);
  const water = waterShown(plan, lang);
  return (
    <section className="fw-kit-card fw-kit-shop" aria-labelledby="kit-shop-title">
      <h2 id="kit-shop-title">
        {t(
          'Dónde comprar lo que falta',
          'Where to buy what is missing',
          'Onde comprar o que falta',
        )}
      </h2>
      {list.length === 0 ? (
        <p className="fw-kit-group-done">
          {t(
            'Marcaste todo lo que se compra. Revisa vencimientos y cargas antes de viajar.',
            'Everything you can buy is checked. Review expiry dates and charges before traveling.',
            'Você marcou tudo o que se compra. Confira validades e cargas antes de viajar.',
          )}
        </p>
      ) : (
        <>
          <p>
            {t(
              'Lo que no marcaste, agrupado por tipo de tienda. Elige una zona y abre la búsqueda.',
              'What you have not checked, grouped by type of shop. Choose an area and open the search.',
              'O que você não marcou, agrupado por tipo de loja. Escolha uma área e abra a busca.',
            )}
          </p>
          <AreaFields state={search} lang={lang} />
          <ul className="fw-kit-stores">
            {list.map(({ store, items }) => {
              const url = careSearchUrl(store, search.area, lang);
              const Icon = storeIcons[store] || ShoppingCartIcon;
              return (
                <li key={store}>
                  <Icon size={22} aria-hidden="true" />
                  <div>
                    <strong>{storeLabels[store][i]}</strong>
                    <span>
                      {items
                        .map((item) =>
                          item.id === 'water'
                            ? `${item.title[i]} (${water.minimum})`
                            : item.title[i],
                        )
                        .join(', ')}
                    </span>
                  </div>
                  {url ? (
                    <a
                      className="fw-secondary"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t(
                        `Buscar ${storeLabels[store][0].toLowerCase()} cerca en Google Maps`,
                        `Find a ${storeLabels[store][1].toLowerCase()} nearby on Google Maps`,
                        `Buscar ${storeLabels[store][2].toLowerCase()} por perto no Google Maps`,
                      )}
                    >
                      {t('Buscar cerca', 'Find nearby', 'Buscar perto')}
                      <ArrowUpRightIcon size={15} aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="fw-kit-store-off">
                      {t('Elige una zona', 'Choose an area', 'Escolha uma área')}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <small>
            {t(
              'La búsqueda se abre en Google Maps con la zona o tu ubicación aproximada. Faro no la guarda. Después de un desastre, un resultado no garantiza que el lugar esté abierto ni que tenga existencias.',
              'The search opens in Google Maps with the area or your approximate location. Faro does not save it. After a disaster, a result does not guarantee the place is open or has stock.',
              'A busca abre no Google Maps com a área ou sua localização aproximada. O Faro não a salva. Depois de um desastre, um resultado não garante que o lugar esteja aberto nem que tenha estoque.',
            )}
          </small>
        </>
      )}
    </section>
  );
}

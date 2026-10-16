import { downloadText } from '../lib/download.ts';
import { useEffect, useRef, useState } from 'react';
import {
  BanknoteIcon,
  BatteryChargingIcon,
  CircleCheckIcon,
  CrosshairIcon,
  DownloadIcon,
  DropletIcon,
  HammerIcon,
  PillIcon,
  PrinterIcon,
  ShoppingCartIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  kitDays,
  kitHazards,
  kitItemsFor,
  kitKey,
  kitPlanKey,
  kitSources,
  itemCaption,
  kitText,
  parseKit,
  parseKitPlan,
  shopCaption,
  shoppingList,
  storeLabels,
  waterShown,
  type KitGroup,
  type KitHazard,
  type KitPlan,
} from '../data/emergencyKit.ts';
import { careAreas } from '../data/careAreas.ts';
import { careSearchUrl, type PlaceKind } from '../lib/nearbyCare.ts';
import { writeLocal, removeLocal } from '../lib/browserStorage.ts';
import { areaStatus, useSearchArea, type SearchArea } from './AreaPicker.tsx';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { caption, keepSeparators } from '../lib/caption.ts';
import {
  Actions,
  Button,
  CheckRow,
  ChoiceChip,
  Chips,
  Field,
  List,
  ListRow,
  Note,
  Progress,
  RowIcon,
  SafetyNotice,
  ScopeNote,
  Section,
  Segmented,
  SelectField,
} from '../ui/index.ts';

// Checklist rows are the box, a label and one caption line (CheckRow); shops keep an icon each.
const storeIcons: Partial<Record<PlaceKind, LucideIcon>> = {
  supermarket: ShoppingCartIcon,
  pharmacy: PillIcon,
  hardware: HammerIcon,
  electronics: BatteryChargingIcon,
  copies: PrinterIcon,
  atm: BanknoteIcon,
};
/** Up to twelve people, as before. */
const peopleChoices = Array.from({ length: 12 }, (_, n) => n + 1);

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
    startOverButton = useRef<HTMLButtonElement>(null);
  // The download button is a design-system Button; it is focused by its id.
  const focusDownload = () =>
    requestAnimationFrame(() => document.getElementById('kit-download')?.focus());
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
  // A number and its unit never break apart (non-breaking space).
  const people = (n: number) =>
    `${n}\u00a0${n === 1 ? t('persona', 'person', 'pessoa') : t('personas', 'people', 'pessoas')}`;
  const days = (n: number) => t(`${n}\u00a0días`, `${n}\u00a0days`, `${n}\u00a0dias`);
  const download = () =>
    downloadText(kitText(lang, checked, plan), `faro-emergency-kit-${lang}.txt`);
  return (
    <div className="f-column grid w-full max-w-2xl gap-8">
      <SafetyNotice>
        {t(
          'Si tienes que evacuar, sal sin buscar la mochila y no vuelvas por el equipaje.',
          'If you have to evacuate, leave without looking for the bag and do not go back for luggage.',
          'Se precisar evacuar, saia sem procurar a mochila e não volte para buscar a bagagem.',
        )}
      </SafetyNotice>

      <Section id="kit-plan" title={t('Tu reserva', 'Your supplies', 'Seus suprimentos')}>
        <div className="f-stack grid gap-4">
          <SelectField
            id="kit-people"
            label={t('Personas', 'People', 'Pessoas')}
            value={plan.people}
            onChange={(e) => setPlan({ ...plan, people: Number(e.target.value) })}
          >
            {peopleChoices.map((n) => (
              <option key={n} value={n}>
                {people(n)}
              </option>
            ))}
          </SelectField>
          <div className="f-field">
            <span className="f-field-label" aria-hidden="true">
              {t('Días', 'Days', 'Dias')}
            </span>
            <Segmented
              block
              label={t('Días', 'Days', 'Dias')}
              value={String(plan.days)}
              onChange={(value) => setPlan({ ...plan, days: Number(value) })}
              options={kitDays.map((d) => ({ value: String(d), label: days(d) }))}
            />
          </div>
          <div className="f-field">
            <span className="f-field-label" aria-hidden="true">
              {t('Te preparas para', 'Preparing for', 'Você se prepara para')}
            </span>
            <Chips label={t('Te preparas para', 'Preparing for', 'Você se prepara para')}>
              {kitHazards.map((h) => (
                <ChoiceChip
                  key={h.id}
                  pressed={plan.hazards.includes(h.id)}
                  onClick={() => toggleHazard(h.id)}
                >
                  {h.label[i]}
                </ChoiceChip>
              ))}
            </Chips>
          </div>
        </div>
        {/* Only what Faro calculates is a figure: the water for these people and days, by two
            references. The choices themselves (people, days) are the caption. */}
        <List>
          <ListRow
            lead={<RowIcon icon={<DropletIcon className="size-4" />} />}
            figure
            title={water.minimum}
            meta={caption(
              t('Mínimo para beber', 'Minimum to drink', 'Mínimo para beber'),
              `${people(plan.people)}, ${days(plan.days)}`,
            )}
          />
          <ListRow
            lead={<RowIcon icon={<DropletIcon className="size-4" />} />}
            figure
            title={water.ready}
            meta={t(
              'Con higiene, según Ready.gov (EE.\u00a0UU.)',
              'With hygiene, per Ready.gov (U.S.)',
              'Com higiene, pelo Ready.gov (EUA)',
            )}
          />
        </List>
        <Note>
          {t(
            'Mínimo: 2 L por persona y día, según SENAPRED (Chile), una guía en español que da esa cifra. Con calor, lleva más.',
            'Minimum: about half a gallon (2 L) per person per day, per SENAPRED (Chile), a Spanish-language guide that gives that figure. In heat, carry more.',
            'Mínimo: 2 L por pessoa por dia, segundo o SENAPRED (Chile), um guia em espanhol que traz esse número. No calor, leve mais.',
          )}
        </Note>
        {plan.hazards.length > 0 && (
          <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
            <ul>
              {kitHazards
                .filter((h) => plan.hazards.includes(h.id))
                .map((h) => (
                  <li key={h.id}>
                    <strong>{h.label[i]}.</strong> {h.tip[i]}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </Section>

      <Section id="kit-list" title={t('Qué llevar', 'What to pack', 'O que levar')}>
        <Progress
          value={done}
          max={items.length}
          label={t('Elementos marcados', 'Items checked', 'Itens marcados')}
        >
          {done === items.length ? (
            <>
              <CircleCheckIcon className="size-4" aria-hidden="true" />
              {t('Tu mochila está completa', 'Your bag is complete', 'Sua mochila está completa')}
            </>
          ) : (
            t(
              `Tu mochila: ${done} de ${items.length}`,
              `Your bag: ${done} of ${items.length}`,
              `Sua mochila: ${done} de ${items.length}`,
            )
          )}
        </Progress>
        <Segmented
          block
          label={t('Qué mostrar', 'What to show', 'O que mostrar')}
          value={pendingOnly ? 'missing' : 'all'}
          onChange={(view) => {
            // Choosing the view already on screen changes nothing, as with the old checkbox.
            if ((view === 'missing') === (pendingOnly !== null)) return;
            setPendingOnly(
              view === 'missing'
                ? items.filter((item) => !checked.includes(item.id)).map((item) => item.id)
                : null,
            );
          }}
          options={[
            { value: 'all', label: t('Todo', 'Everything', 'Tudo') },
            {
              value: 'missing',
              label: t('Solo lo que falta', 'Only what is missing', 'Só o que falta'),
            },
          ]}
        />
        <div role="status">
          {error && (
            <Note>
              {t(
                'No se pudo guardar. Descarga tu lista para no perderla.',
                'Could not save. Download your list so you do not lose it.',
                'Não foi possível salvar. Baixe sua lista para não perdê-la.',
              )}
            </Note>
          )}
        </div>
        <div className="f-stack grid gap-8" data-gap="lg">
          {groups.map((group) => {
            const inGroup = items.filter((item) => item.group === group.id);
            const groupDone = inGroup.filter((item) => checked.includes(item.id)).length;
            const visible = pendingOnly
              ? inGroup.filter((item) => pendingOnly.includes(item.id))
              : inGroup;
            return (
              <div
                key={group.id}
                className="f-stack grid gap-2"
                data-gap="sm"
                role="group"
                aria-labelledby={`kit-group-${group.id}`}
              >
                {/* The count follows the title in every group, as in the old legend, so it never
                    jumps to the other side when a long title wraps. */}
                <h3
                  className="f-subhead m-0 text-sm leading-snug font-medium"
                  id={`kit-group-${group.id}`}
                >
                  {group.title}{' '}
                  <span className="f-section-aside text-sm text-muted-foreground data-[state=stale]:text-amber-900">
                    {t(
                      `${groupDone}\u00a0de\u00a0${inGroup.length}`,
                      `${groupDone}\u00a0of\u00a0${inGroup.length}`,
                      `${groupDone}\u00a0de\u00a0${inGroup.length}`,
                    )}
                  </span>
                </h3>
                {visible.length === 0 ? (
                  <Note>
                    {t(
                      'Todo marcado en este grupo.',
                      'Everything checked in this group.',
                      'Tudo marcado neste grupo.',
                    )}
                  </Note>
                ) : (
                  <List>
                    {visible.map((item) => (
                      <CheckRow
                        key={item.id}
                        id={`kit-item-${item.id}`}
                        checked={checked.includes(item.id)}
                        onChange={() => toggle(item.id)}
                        title={item.title[i]}
                        meta={itemCaption(item, lang, plan)}
                      />
                    ))}
                  </List>
                )}
              </div>
            );
          })}
        </div>
        <Note>
          {t(
            'Revisa pilas, cargas y vencimientos antes de viajar.',
            'Check batteries, charges and expiry dates before traveling.',
            'Confira pilhas, cargas e datas de validade antes de viajar.',
          )}
        </Note>
      </Section>

      <KitShopping key={country} lang={lang} country={country} checked={checked} plan={plan} />

      <div className="f-stack grid gap-2" data-gap="sm">
        <Button
          id="kit-download"
          icon={<DownloadIcon className="size-4" aria-hidden="true" />}
          onClick={download}
        >
          {t('Descargar mi lista', 'Download my checklist', 'Baixar minha lista')}
        </Button>
        {checked.length > 0 && !confirmReset && (
          <Actions>
            <button type="button" ref={startOverButton} onClick={() => setConfirmReset(true)}>
              {t('Empezar de nuevo', 'Start over', 'Começar de novo')}
            </button>
          </Actions>
        )}
        {confirmReset && (
          <div
            className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5"
            role="group"
            aria-label={t('Confirmar', 'Confirm', 'Confirmar')}
          >
            <p>
              {t('¿Desmarcar toda la lista?', 'Uncheck the whole list?', 'Desmarcar a lista toda?')}
            </p>
            <Actions>
              <button
                type="button"
                ref={confirmButton}
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
                  focusDownload();
                }}
              >
                {t('Sí, desmarcar', 'Yes, uncheck', 'Sim, desmarcar')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  focusLater(startOverButton);
                }}
              >
                {t('Cancelar', 'Cancel', 'Cancelar')}
              </button>
            </Actions>
          </div>
        )}
      </div>

      <Note>
        {t(
          'Adaptación para viajeros, con la referencia de SENAPRED (Chile) y de Ready.gov (EE. UU.). Fuentes consultadas el 13 oct 2026:',
          'Traveler adaptation, with the SENAPRED (Chile) and Ready.gov (U.S.) references. Sources checked on Oct 13, 2026:',
          'Adaptação para viajantes, com a referência do SENAPRED (Chile) e do Ready.gov (EUA). Fontes consultadas em 13 out. 2026:',
        )}{' '}
        {kitSources.map((s, n) => (
          <span key={s.url}>
            {n > 0 && ', '}
            <a href={s.url} target="_blank" rel="noreferrer">
              {keepSeparators(s.name)}
            </a>
            {/* A title in another language is said to be so, kept on one line. */}
            {s.lang !== lang &&
              (s.lang === 'es'
                ? t('', ' (in\u00a0Spanish)', ' (em\u00a0espanhol)')
                : t(' (en\u00a0inglés)', '', ' (em\u00a0inglês)'))}
          </span>
        ))}
        .
      </Note>
      <ScopeNote>
        {t(
          'Lo que marcas se guarda solo en este navegador. Marcar la lista no comprueba lo que hay en la mochila.',
          'What you tick is saved only in this browser. Ticking the list does not check what is in the bag.',
          'O que você marca fica salvo só neste navegador. Marcar a lista não verifica o que há na mochila.',
        )}
      </ScopeNote>
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
  return (
    <Section
      id="kit-shop"
      title={t(
        'Dónde comprar lo que falta',
        'Where to buy what is missing',
        'Onde comprar o que falta',
      )}
    >
      {list.length === 0 ? (
        <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
          <p>
            {t(
              'Marcaste todo lo que se compra. Revisa vencimientos y cargas antes de viajar.',
              'Everything you can buy is checked. Review expiry dates and charges before traveling.',
              'Você marcou tudo o que se compra. Confira validades e cargas antes de viajar.',
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
            <p>
              {t(
                'Lo que no marcaste, por tipo de tienda. Elige una zona y abre la búsqueda. Tras un desastre, un resultado no garantiza que esté abierta ni que tenga existencias.',
                'What you have not checked, by type of shop. Choose an area and open the search. After a disaster, a result does not mean it is open or has stock.',
                'O que você não marcou, por tipo de loja. Escolha uma área e abra a busca. Depois de um desastre, um resultado não garante que esteja aberta nem que tenha estoque.',
              )}
            </p>
          </div>
          <AreaChoice state={search} lang={lang} />
          <List>
            {list.map(({ store, items }) => {
              const url = careSearchUrl(store, search.area, lang);
              const Icon = storeIcons[store] || ShoppingCartIcon;
              // Short names, so the shop's list stays one caption line.
              const what = shopCaption(items, lang, plan);
              return url ? (
                <ListRow
                  key={store}
                  lead={<RowIcon icon={<Icon className="size-4" />} />}
                  title={
                    <>
                      {storeLabels[store][i]}
                      <span className="sr-only">
                        {t(
                          `: buscar ${storeLabels[store][0].toLowerCase()} cerca en Google Maps`,
                          `: find a ${storeLabels[store][1].toLowerCase()} nearby on Google Maps`,
                          `: buscar ${storeLabels[store][2].toLowerCase()} por perto no Google Maps`,
                        )}
                      </span>
                    </>
                  }
                  meta={what}
                  href={url}
                  external
                />
              ) : (
                <ListRow
                  key={store}
                  lead={<RowIcon icon={<Icon className="size-4" />} />}
                  title={storeLabels[store][i]}
                  meta={what}
                />
              );
            })}
          </List>
          {/* What the third party receives, in one line next to its rows (as in Ayuda). */}
          <Note>
            {t(
              'Google Maps recibe la zona; Faro no la guarda.',
              'Google Maps gets the area; Faro keeps nothing.',
              'O Google Maps recebe a área; o Faro não a guarda.',
            )}
          </Note>
        </>
      )}
    </Section>
  );
}

/**
 * Where to search: a typed place, one of the country's common areas, or rounded coordinates
 * after an explicit tap. The same state and wording as the area picker in Ayuda (AreaPicker),
 * drawn with design-system fields. Nothing is stored.
 */
function AreaChoice({ state, lang }: { state: SearchArea; lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const { place, gps, status, country } = state;
  const common = careAreas[country] ?? [];
  return (
    <div className="f-stack grid gap-4">
      <Field
        id="kit-area-place"
        label={t(
          'Ciudad, barrio o dirección',
          'City, neighborhood or address',
          'Cidade, bairro ou endereço',
        )}
        maxLength={160}
        value={place}
        placeholder={t(
          'Ej.: El Cangrejo, Ciudad de Panamá',
          'E.g. El Cangrejo, Panama City',
          'Ex.: El Cangrejo, Cidade do Panamá',
        )}
        onChange={(e) => state.setPlace(e.target.value)}
      />
      <Button
        variant="secondary"
        icon={<CrosshairIcon className="size-4" aria-hidden="true" />}
        // aria-disabled rather than disabled: the older screens' styles fade disabled buttons
        // below 4.5:1; the design system draws aria-disabled with readable text.
        aria-disabled={status === 'pending' || undefined}
        onClick={() => status !== 'pending' && state.locate()}
      >
        {status === 'pending'
          ? t('Buscando ubicación…', 'Finding location…', 'Buscando localização…')
          : t('Usar mi ubicación', 'Use my location', 'Usar minha localização')}
      </Button>
      {common.length > 0 && (
        <SelectField
          id="kit-area-common"
          label={t('Zonas frecuentes', 'Common areas', 'Áreas frequentes')}
          value={!gps && common.includes(place.trim()) ? place.trim() : ''}
          onChange={(e) => state.setPlace(e.target.value)}
        >
          <option value="">{t('Elige una zona', 'Choose an area', 'Escolha uma área')}</option>
          {common.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
      )}
      <div role="status">
        <Note>{areaStatus(state, lang)}</Note>
      </div>
    </div>
  );
}

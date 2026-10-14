import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon, CheckIcon } from '@phosphor-icons/react';
import countries from '../data/countries.json';
import { countryAliases, isExactAlias } from '../lib/countryAliases.ts';
import { langTag, pick, type Lang } from '../lib/i18n.ts';
type Props = {
  label: string;
  value: string;
  lang: Lang;
  required?: boolean;
  includeWorld?: boolean;
  onChange: (code: string) => void;
};
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
export default function CountrySearch({
  label,
  value,
  lang,
  required = false,
  includeWorld = false,
  onChange,
}: Props) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null),
    [query, setQuery] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0),
    [invalid, setInvalid] = useState(false);
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const options = useMemo(() => {
    // Spanish (c.name), English and Portuguese names always match, whatever the interface language.
    const local = new Intl.DisplayNames([langTag(lang)], { type: 'region' }),
      english = new Intl.DisplayNames(['en'], { type: 'region' }),
      portuguese = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
    const list = countries
      .map((c) => ({
        code: c.code,
        name: local.of(c.code) || c.name,
        search: normalize(
          `${c.name} ${english.of(c.code)} ${portuguese.of(c.code)} ${local.of(c.code)} ${c.code} ${countryAliases[c.code] ?? ''}`,
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, langTag(lang)));
    return includeWorld
      ? [
          {
            code: 'WORLD',
            name: pick(lang, 'Todo el mundo', 'Worldwide', 'Mundo inteiro'),
            search: 'todo el mundo worldwide global world mundo inteiro todo o mundo',
          },
          ...list,
        ]
      : list;
  }, [lang, includeWorld]);
  const selected = options.find((c) => c.code === value),
    search = normalize(query ?? '');
  const matches = options
    .filter((c) => search.split(/\s+/).every((word) => c.search.includes(word)))
    .sort((a, b) =>
      query === null
        ? Number(b.code === value) - Number(a.code === value)
        : Number(b.code.toLowerCase() === search || isExactAlias(b.code, search)) -
          Number(a.code.toLowerCase() === search || isExactAlias(a.code, search)),
    );
  const shown = matches.slice(0, 8);
  const error = t(
    'Selecciona un país de los resultados.',
    'Select a country from the results.',
    'Selecione um país nos resultados.',
  );
  useEffect(() => {
    input.current?.setCustomValidity((required || !!query) && !selected ? error : '');
  }, [required, query, selected, error]);
  useEffect(() => {
    if (open)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, id, open]);
  function choose(code: string) {
    onChange(code);
    setQuery(null);
    setOpen(false);
    setInvalid(false);
    input.current?.setCustomValidity('');
    input.current?.focus();
  }
  return (
    <div className="fw-country-search">
      <label htmlFor={id}>{label}</label>
      <div className="fw-country-search-input">
        <MagnifyingGlassIcon size={19} />
        <input
          ref={input}
          id={id}
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          aria-activedescendant={open && shown[active] ? `${id}-option-${active}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          required={required}
          value={query ?? selected?.name ?? ''}
          placeholder={t('Buscar país…', 'Search countries…', 'Buscar país…')}
          onFocus={(e) => {
            setOpen(true);
            setActive(0);
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange('');
            setOpen(true);
            setActive(0);
            setInvalid(false);
          }}
          onBlur={() => {
            setOpen(false);
            if (selected) setQuery(null);
          }}
          onInvalid={() => {
            setInvalid(true);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setOpen(true);
              setActive((n) =>
                Math.max(0, Math.min(shown.length - 1, n + (e.key === 'ArrowDown' ? 1 : -1))),
              );
            } else if (e.key === 'Enter' && open) {
              e.preventDefault();
              if (shown[active]) choose(shown[active].code);
            } else if (e.key === 'Escape' && open) {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              if (selected) setQuery(null);
            }
          }}
        />
        {selected && query === null && <CheckIcon size={17} className="fw-country-search-check" />}
      </div>
      {open && (
        <div className="fw-country-search-menu">
          {/* Not a tab stop: Chrome would otherwise focus the scrolling list, which closes on blur
              and leaves focus on the page instead of the next control. */}
          <div id={`${id}-results`} role="listbox" aria-label={label} tabIndex={-1}>
            {shown.map((c, i) => (
              <button
                type="button"
                role="option"
                aria-selected={c.code === value}
                id={`${id}-option-${i}`}
                key={c.code}
                className={i === active ? 'active' : ''}
                tabIndex={-1}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(c.code)}
              >
                <span>{c.name}</span>
                <small>{c.code}</small>
              </button>
            ))}
          </div>
          <p role="status">
            {!matches.length
              ? t(
                  'No hay coincidencias. Prueba otro nombre.',
                  'No matches. Try another name.',
                  'Nenhum resultado. Tente outro nome.',
                )
              : !search
                ? t(
                    'Escribe para encontrar tu país.',
                    'Type to find your country.',
                    'Digite para encontrar seu país.',
                  )
                : matches.length > 8
                  ? t(
                      'Escribe más letras para acotar la búsqueda.',
                      'Keep typing to narrow your search.',
                      'Continue digitando para refinar a busca.',
                    )
                  : `${matches.length} ${t(matches.length === 1 ? 'resultado' : 'resultados', matches.length === 1 ? 'result' : 'results', matches.length === 1 ? 'resultado' : 'resultados')}`}
          </p>
        </div>
      )}
      {invalid && (
        <p id={`${id}-error`} className="fw-country-search-error">
          {error}
        </p>
      )}
    </div>
  );
}

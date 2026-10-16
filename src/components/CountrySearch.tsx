import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { countryOptions, matchCountries } from '../lib/countryMatch.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import { Combobox } from '../ui/index.ts';
type Props = {
  label: string;
  value: string;
  lang: Lang;
  required?: boolean;
  includeWorld?: boolean;
  /** One caption under the label, e.g. where the value was saved. */
  hint?: ReactNode;
  onChange: (code: string) => void;
};
export default function CountrySearch({
  label,
  value,
  lang,
  required = false,
  includeWorld = false,
  hint,
  onChange,
}: Props) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null),
    [query, setQuery] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0),
    [invalid, setInvalid] = useState(false);
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const options = useMemo(() => countryOptions(lang, includeWorld), [lang, includeWorld]);
  const selected = options.find((c) => c.code === value);
  const matches = matchCountries(options, query, value);
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
    <Combobox
      id={id}
      inputRef={input}
      label={label}
      hint={hint}
      error={invalid ? error : undefined}
      open={open}
      active={active}
      options={shown.map((c) => ({
        key: c.code,
        label: c.name,
        meta: c.code,
        selected: c.code === value,
      }))}
      onChoose={(i) => choose(shown[i].code)}
      done={!!selected && query === null}
      status={
        !matches.length
          ? t(
              'No hay coincidencias. Prueba otro nombre.',
              'No matches. Try another name.',
              'Nenhum resultado. Tente outro nome.',
            )
          : !(query ?? '').trim()
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
              : `${matches.length} ${t(matches.length === 1 ? 'resultado' : 'resultados', matches.length === 1 ? 'result' : 'results', matches.length === 1 ? 'resultado' : 'resultados')}`
      }
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
  );
}

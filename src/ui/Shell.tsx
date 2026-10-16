import type { ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { CaretDownIcon, GlobeSimpleIcon, PhoneIcon } from '@phosphor-icons/react';
import { LANGS, type Lang } from '../lib/i18n.ts';

const languageNames: Record<Lang, string> = { es: 'Español', en: 'English', pt: 'Português' };

export type Tab<T extends string = string> = { id: T; label: string; Icon: Icon };

/** The app root: the container every breakpoint is measured against. */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="f-app f-root">
      <div className="f-shell">{children}</div>
    </div>
  );
}

function Brand({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="f-brand f-pressable" onClick={onClick} aria-label={label}>
      <img src="/faro-mark.svg" alt="" />
      <span>Faro</span>
    </button>
  );
}

/**
 * "Panamá ▾": opens the country screen (search, my location, saved countries). In the phone
 * header it is drawn like the language picker beside it: a label and the same caret.
 */
function Place({ name, onClick, label }: { name: string; onClick: () => void; label: string }) {
  return (
    <button type="button" className="f-place f-pressable" onClick={onClick} aria-label={label}>
      <span>{name}</span>
      <CaretDownIcon className="f-caret" size={14} weight="bold" aria-hidden="true" />
    </button>
  );
}

/** Language over the device's own picker: the two-letter code, or the full name in the sidebar. */
function Language({
  lang,
  onChange,
  label,
  full,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
  label: string;
  full?: boolean;
}) {
  return (
    <label className="f-lang f-pressable">
      <GlobeSimpleIcon className="f-lang-globe" size={full ? 20 : 18} aria-hidden="true" />
      <span aria-hidden="true">{full ? languageNames[lang] : lang.toUpperCase()}</span>
      {!full && <CaretDownIcon className="f-caret" size={14} weight="bold" aria-hidden="true" />}
      <select
        className="f-lang-select"
        aria-label={label}
        value={lang}
        onChange={(e) => onChange(e.target.value as Lang)}
      >
        {LANGS.map((l) => (
          <option key={l} value={l} lang={l}>
            {languageNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}

function Emergency({
  label,
  onClick,
  current,
}: {
  label: string;
  onClick: () => void;
  current?: boolean;
}) {
  return (
    <button
      type="button"
      className="f-emergency f-pressable"
      aria-current={current ? 'page' : undefined}
      onClick={onClick}
    >
      <PhoneIcon size={18} weight="fill" aria-hidden="true" />
      {label}
    </button>
  );
}

export type ShellText = {
  home: string;
  place: string;
  language: string;
  emergency: string;
  menu: string;
};

type Common = {
  text: ShellText;
  placeName: string;
  lang: Lang;
  onHome: () => void;
  onPlace: () => void;
  onLanguage: (lang: Lang) => void;
  onEmergency: () => void;
  /** The emergency screen is open. */
  emergencyCurrent?: boolean;
};

/** Phone header: Faro · country · language · Emergency, on one line. */
export function Header(p: Common) {
  return (
    <header className="f-header">
      <Brand onClick={p.onHome} label={p.text.home} />
      <Place name={p.placeName} onClick={p.onPlace} label={p.text.place} />
      <div className="f-header-end">
        <Language lang={p.lang} onChange={p.onLanguage} label={p.text.language} />
        <Emergency label={p.text.emergency} onClick={p.onEmergency} current={p.emergencyCurrent} />
      </div>
    </header>
  );
}

/** Connection or freshness state for the whole app, under the header while it applies. */
export function StatusBar({ children }: { children: ReactNode }) {
  return (
    <div className="f-statusbar" role="status">
      {children}
    </div>
  );
}

type Nav<T extends string> = {
  tabs: readonly Tab<T>[];
  current: T | null;
  onSelect: (id: T) => void;
  label: string;
};

/** Phone bottom tabs: one word each, one line. */
export function TabBar<T extends string>({ tabs, current, onSelect, label }: Nav<T>) {
  return (
    <nav className="f-tabbar" aria-label={label}>
      {tabs.map(({ id, label: name, Icon }) => (
        <button
          key={id}
          type="button"
          className="f-tab"
          aria-current={current === id ? 'page' : undefined}
          onClick={() => onSelect(id)}
        >
          <span className="f-tab-icon">
            <Icon size={22} weight={current === id ? 'fill' : 'regular'} aria-hidden="true" />
          </span>
          {name}
        </button>
      ))}
    </nav>
  );
}

/**
 * Desktop sidebar: brand, country, Emergency, the menu, and at its foot the secondary links and
 * the language.
 */
export function Sidebar<T extends string>(p: Nav<T> & Common & { foot?: ReactNode }) {
  return (
    <aside className="f-sidebar">
      <Brand onClick={p.onHome} label={p.text.home} />
      <Place name={p.placeName} onClick={p.onPlace} label={p.text.place} />
      <Emergency label={p.text.emergency} onClick={p.onEmergency} current={p.emergencyCurrent} />
      <nav className="f-side-nav" aria-label={p.label}>
        {p.tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="f-side-link"
            aria-current={p.current === id ? 'page' : undefined}
            onClick={() => p.onSelect(id)}
          >
            <Icon size={20} weight={p.current === id ? 'fill' : 'regular'} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      <div className="f-side-foot">
        {p.foot}
        <Language lang={p.lang} onChange={p.onLanguage} label={p.text.language} full />
      </div>
    </aside>
  );
}

/** The scrolling content region and its reading width. */
export function Content({ children, id = 'main' }: { children: ReactNode; id?: string }) {
  return (
    <main className="f-content" id={id}>
      <div className="f-page">{children}</div>
    </main>
  );
}

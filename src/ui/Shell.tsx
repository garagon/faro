import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDownIcon, ChevronsUpDownIcon, LanguagesIcon, PhoneIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LANGS, type Lang } from '../lib/i18n.ts';

const languageNames: Record<Lang, string> = { es: 'Español', en: 'English', pt: 'Português' };

export type Tab<T extends string = string> = { id: T; label: string; Icon: LucideIcon };

/*
 * The frame around every screen. Phone: one-line header (Faro · country · language ·
 * Emergency), content, six one-word tabs. Desktop (900 px and up): a sidebar with the brand,
 * the country, Emergency and the menu; no top bar, each screen's head carries its freshness.
 *
 * Breakpoints are container queries on the `app` container (AppFrame), which fills the window
 * in the app; the same components therefore render correctly inside the phone and desktop
 * frames of the specimen. `desk` is 900 px and up.
 */

/** shadcn's focus ring, for the frame's own controls that are not a shadcn Button. */
const ring = 'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * A sidebar menu item in shadcn's sidebar-menu style: a ghost row, 36 px, the current one on the
 * sidebar accent. Also for the links at the sidebar's foot (App passes them in `foot`).
 */
export const sideLinkClass = cn(
  'flex h-9 w-full items-center gap-2 rounded-md px-2 text-start text-sm text-sidebar-foreground no-underline',
  'transition-[color,background-color] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  'aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground',
  'motion-reduce:transition-none [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground aria-[current=page]:[&>svg]:text-sidebar-accent-foreground',
  ring,
);

/** A skip link: hidden above the window until focused (to the content, past the map). */
export const skipLinkClass = cn(
  'f-skip absolute top-2 left-2 z-40 -translate-y-[300%] rounded-md border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg focus:translate-y-0',
  ring,
);

/** The app root: the container every breakpoint is measured against. */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="f-app f-root @container/app h-full">
      <div
        className={cn(
          'f-shell grid h-full min-h-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_minmax(0,1fr)_auto] bg-background text-foreground',
          '@min-[900px]/app:grid-cols-[16rem_minmax(0,1fr)] @min-[900px]/app:grid-rows-[auto_minmax(0,1fr)]',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Brand({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        'f-brand f-pressable inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-2 text-base font-semibold tracking-tight text-foreground transition-colors hover:bg-accent motion-reduce:transition-none',
        ring,
        className,
      )}
      onClick={onClick}
      aria-label={label}
    >
      <img src="/faro-mark.svg" alt="" className="size-[22px]" />
      <span>Faro</span>
    </button>
  );
}

/**
 * "Panamá ▾": opens the country screen (search, my location, saved countries). In the phone
 * header it is a ghost button like the language picker beside it; in the sidebar, an outline
 * button the width of the column.
 */
function Place({
  name,
  onClick,
  label,
  side,
}: {
  name: string;
  onClick: () => void;
  label: string;
  side?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={side ? 'outline' : 'ghost'}
      className={cn(
        'f-place f-pressable font-medium',
        side
          ? 'h-9 w-full justify-between px-3'
          : // The country says whose numbers these are: a long name takes a second line before it is cut.
            'h-10 min-w-[min(5.5em,40%)] shrink justify-start gap-1 px-2 whitespace-normal',
      )}
      onClick={onClick}
      aria-label={label}
    >
      <span className="line-clamp-2 text-start leading-tight">{name}</span>
      {side ? (
        <ChevronsUpDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />
      ) : (
        <ChevronDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </Button>
  );
}

/** Language over the device's own picker: the two-letter code, or the full name in the sidebar. */
function Language({
  lang,
  onChange,
  label,
  full,
  className,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
  label: string;
  full?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'f-lang f-pressable relative cursor-pointer has-[select:focus-visible]:ring-[3px] has-[select:focus-visible]:ring-ring/50',
        full
          ? sideLinkClass
          : 'inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground motion-reduce:transition-none',
        className,
      )}
    >
      {full && <LanguagesIcon aria-hidden="true" />}
      <span aria-hidden="true">{full ? languageNames[lang] : lang.toUpperCase()}</span>
      {!full && <ChevronDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />}
      <select
        className="f-lang-select absolute inset-0 m-0 size-full cursor-pointer text-base opacity-0 outline-none"
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

/** The frame's way to Emergency: always the same red outline; filled red belongs to the call. */
function Emergency({
  label,
  onClick,
  current,
  side,
}: {
  label: string;
  onClick: () => void;
  current?: boolean;
  side?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'f-emergency f-pressable border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive focus-visible:ring-destructive/40',
        'aria-[current=page]:cursor-default aria-[current=page]:bg-destructive/10',
        side ? 'h-9 w-full' : 'h-10 shrink-0 px-3',
      )}
      aria-current={current ? 'page' : undefined}
      onClick={onClick}
    >
      <PhoneIcon aria-hidden="true" />
      {label}
    </Button>
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
    <header
      className={cn(
        'f-header sticky top-0 z-20 row-start-1 flex h-14 items-center gap-1 border-b bg-background/95 pr-3 pl-2 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        '@min-[900px]/app:hidden',
      )}
    >
      {/* The country always gets its room: the wordmark goes below 400 px, the mark below 360;
          with large text the mark and the language go (the language is on the country screen). */}
      <Brand
        onClick={p.onHome}
        label={p.text.home}
        className="@max-[400px]/app:[&>span]:sr-only @max-[360px]/app:hidden [@container_app_(max-width:22.5em)]:hidden"
      />
      <Place name={p.placeName} onClick={p.onPlace} label={p.text.place} />
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Language
          lang={p.lang}
          onChange={p.onLanguage}
          label={p.text.language}
          className="[@container_app_(max-width:22.5em)]:hidden"
        />
        <Emergency label={p.text.emergency} onClick={p.onEmergency} current={p.emergencyCurrent} />
      </div>
    </header>
  );
}

/** Connection or freshness state for the whole app, under the header while it applies. */
export function StatusBar({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        'f-statusbar row-start-2 flex min-h-8 items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1 text-center text-sm font-medium text-amber-900 [&_svg]:size-4 [&_svg]:shrink-0',
        '@min-[900px]/app:col-start-2 @min-[900px]/app:row-start-1',
      )}
      role="status"
    >
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
    <nav
      className={cn(
        'f-tabbar z-20 row-start-4 flex justify-around border-t bg-background/95 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80',
        '@min-[900px]/app:hidden',
      )}
      aria-label={label}
    >
      {tabs.map(({ id, label: name, Icon }) => (
        <button
          key={id}
          type="button"
          className={cn(
            'f-tab group grid min-h-14 min-w-0 flex-auto content-center justify-items-center gap-0.5 rounded-md px-0.5 py-1 text-[11px] leading-tight font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none',
            'aria-[current=page]:text-foreground',
            ring,
          )}
          aria-current={current === id ? 'page' : undefined}
          onClick={() => onSelect(id)}
        >
          <span className="f-tab-icon grid h-7 w-12 place-items-center rounded-full transition-colors group-hover:bg-accent group-active:bg-accent group-aria-[current=page]:bg-accent motion-reduce:transition-none">
            <Icon className="size-5" aria-hidden="true" />
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
    <aside
      className={cn(
        'f-sidebar hidden min-h-0 flex-col gap-4 overflow-y-auto border-r bg-sidebar p-3 text-sidebar-foreground',
        '@min-[900px]/app:col-start-1 @min-[900px]/app:row-span-2 @min-[900px]/app:row-start-1 @min-[900px]/app:flex',
      )}
    >
      <div className="grid gap-3">
        <Brand onClick={p.onHome} label={p.text.home} className="justify-self-start" />
        <Place name={p.placeName} onClick={p.onPlace} label={p.text.place} side />
        <Emergency
          label={p.text.emergency}
          onClick={p.onEmergency}
          current={p.emergencyCurrent}
          side
        />
      </div>
      <nav className="f-side-nav grid gap-1" aria-label={p.label}>
        {p.tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={cn('f-side-link', sideLinkClass)}
            aria-current={p.current === id ? 'page' : undefined}
            onClick={() => p.onSelect(id)}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      <div className="f-side-foot mt-auto grid gap-1 border-t pt-3">
        {p.foot}
        <Language lang={p.lang} onChange={p.onLanguage} label={p.text.language} full />
      </div>
    </aside>
  );
}

/** The scrolling content region: the only scrolling region of the frame. */
export const contentClass = cn(
  'f-content row-start-3 min-h-0 overflow-y-auto overscroll-contain scroll-pt-4 bg-background text-sm text-foreground',
  '@min-[900px]/app:col-start-2 @min-[900px]/app:row-start-2',
);
/**
 * The page inside it: phone padding; on desktop wider padding. Its width (one centred reading
 * column, or two panes on wide screens) is in ds/helpers.css, next to the panes.
 */
export const pageClass = cn(
  'f-page mx-auto grid w-full grid-cols-[minmax(0,1fr)] gap-8 px-4 py-6',
  '@min-[900px]/app:px-8 @min-[900px]/app:py-8',
);

/** The scrolling content region and its reading width. */
export function Content({ children, id = 'main' }: { children: ReactNode; id?: string }) {
  return (
    <main className={contentClass} id={id}>
      <div className={pageClass}>{children}</div>
    </main>
  );
}

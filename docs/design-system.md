# Design system

Faro's interface is built on [shadcn/ui](https://ui.shadcn.com/) (new-york style, neutral
theme, Tailwind CSS 4, Geist, Lucide icons). Screens use Faro's wrappers in `src/ui`, which are
built on the shadcn components, so the same thing looks the same everywhere and screens never
restyle them. To add a shadcn component, use its CLI (`npx shadcn@latest add <name>`); do not
hand-write one it provides.

## Where things live

| Part                                                                      | File                                                                                |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Tokens: colour roles, type scale, spacing, radii, shadows, layers, motion | `src/styles/ds/tokens.css`                                                          |
| shadcn/ui components (generated with its CLI, adapted)                    | `src/components/ui/`                                                                |
| Faro's wrappers: the API screens use, built on the shadcn components      | `src/ui/` (exported from `src/ui/index.ts`)                                         |
| Shared text and layout helpers used directly by screens                   | `src/styles/ds/helpers.css` (Tailwind `@apply`)                                     |
| App frame: header, tabs, sidebar, layout helpers; sheet; map card         | Tailwind classes in `src/ui/Shell.tsx`, `Sheet.tsx`, `Map.tsx` (pins: `ds/map.css`) |
| Cascade order                                                             | `src/styles/index.css`                                                              |

## Cascade layers

`src/styles/index.css` loads every style into cascade layers, in this order:

1. `vendor`: the map libraries' own styles.
2. `theme`, `base`: Tailwind's theme and preflight, and the shadcn variables (`theme.css`).
3. `ds-base`: Faro's tokens (pointing at the shadcn variables) and the document defaults.
4. `components`, `ds`: the few Faro styles that are not Tailwind classes: shared helpers used
   directly by screens (`helpers.css`), map pins (`map.css`).
5. `utilities`: Tailwind classes, last, so a class on an element always wins.

The loading screen (`boot.css`) is linked from `index.html` and stays outside. A rule whose class
no source renders any more is deleted, not kept "just in case"; check with a visual regression
run before and after.

## Rules

- Colours, radii and type come from the shadcn theme (`theme.css`) through Tailwind classes or
  Faro's tokens; no literals in components.
- Variants are props of the wrappers (`variant`, `size`, `level`), drawn with the shadcn
  components' own variants (`cva`), never per-screen overrides.
- Components have no outer margin. Layouts (`f-stack`, `f-column`, `f-split`, sections) own gaps.
- Screens use one reading column (`f-column`, 42 rem), centred from 900 px. From 1200 px a screen
  with a side pane (`f-two`, marked `data-side`) uses two panes: Avisar (the message beside the
  form), the earthquake list (its map), Emergencia (embassy, latest earthquake and next steps),
  Situación and Guía. Phones keep one column in source order.
- No coloured side stripes or boxes inside boxes: hierarchy comes from type, space and one list
  container.
- Breakpoints are container queries on the app frame (`.f-app`): 360, 400, 900 and 1200 px, plus
  22.5 em so large browser text never scrolls sideways.
- One text edge per screen: every row with a leading element uses shadcn's `ItemMedia` (32 px).
- One row height per list: if one row has a caption, all do. Captions fit one line at 390 px in
  Spanish; numbers and their units never break ("24 h", "10 min").
- The Emergency button in the frame always has the same outline; filled red is only the call
  button. On the Emergency screen it is marked as the current place. It is the only outlined
  control in the phone header: the country and language pickers beside it are drawn alike, a
  label and a caret with no box.
- Situación answers first. Its heading is the answer in one sentence (`StatusHead`: "Sin avisos
  vigentes", "2 avisos vigentes", "Sin avisos en las fuentes que responden", "Sin respuesta de las
  fuentes", "Sin conexión"), never more than the sources say; under it the latest earthquake and
  when Faro checked. Warnings in force are `AlertCard`s in their level's colour, the first in
  full and the rest one line each; then the call, two `ActionTile`s, the `Board` (one line per
  hazard with a coloured dot), the map, and everything else folded under "Más información
  oficial", open on a bad day.
- Emergencia is read in seconds: the call at 64 px, the other numbers as `NumberTile`s in two
  columns, three `HazardPicker` tiles, the first four steps at 18 px and the rest one tap away.
  Nothing is removed from the screen; what is not in the first view opens in place.
- Every tappable element has a target of at least 40 px on phones and hover and press feedback,
  as the shadcn components draw it (accent fill on rows and menu items, shadcn's focus ring).
  Links inside sentences are underlined.
- One screen head everywhere (`ScreenHead`): the title, a short status at the end of its line when
  the screen has one (Situación's check time), and a lead of one line at 390 px in Spanish, or
  none. A lead says what the content does not (a caveat, the rule above every topic); it never
  describes the menu. The frame names the country, so no title, section title or status repeats it.
- A dialog or sheet is a history entry: Back closes it and leaves the screen as it was
  (`useBackToClose`; the earthquake sheet in `App.tsx`).
- `Section` renders its `id`, so a link can open a screen at one of its parts.
- Text sizes are in `rem`, so the reader's browser setting applies. Fields use 16 px.

## Colour roles

| Role                                 | Meaning                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| Call red                             | Only for calling for help: the call button and the Emergency button.                 |
| Level 1–3 (amber, orange, alert red) | Only official warning levels, and stale data (level 1). The level is always written. |
| Primary (near-black)                 | The main action (shadcn's `primary`).                                                |
| Green                                | Only the brand mark and "the source answered".                                       |
| Ink and neutrals                     | Everything else.                                                                     |

Magnitude uses one hue from light to dark, so a larger figure is always darker. The figure
carries the meaning, never the colour alone.

## Type

Geist, on shadcn's scale. Every text uses one of these roles:

| Role          | Tailwind                                | Used for                                                                               |
| ------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| Screen title  | `text-2xl font-semibold tracking-tight` | The title of a screen (the same words as its menu entry)                               |
| Section title | `text-base font-semibold`               | Section titles                                                                         |
| Label         | `text-sm font-medium`                   | Row titles, buttons, chips, field labels                                               |
| Text          | `text-sm`                               | Paragraphs and interface text                                                          |
| Instruction   | `text-base`                             | Steps and safety notices, read in a hurry (`text-lg` on Emergencia: `Steps size="lg"`) |
| Caption       | `text-sm text-muted-foreground`         | Row descriptions, sources and times, notes                                             |

Figures (phone numbers, magnitudes) are `font-semibold tabular-nums`; the magnitude in an
earthquake's detail is the one larger figure. Map attribution and legal text are `text-xs`, tab
labels 11 px. Fields stay at 16 px on phones so they do not zoom. A list row is always a label and
one caption line; state, source and time share that caption.

## Components

| Component                                                                          | Use                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CallButton`                                                                       | The main emergency number: the large button in call red, at most as wide as a phone (26 rem). Once per screen. `size="xl"` (64 px) on Emergencia only.                                                                                       |
| `PhoneRow`                                                                         | Other numbers, as list rows: the number first, who answers under it.                                                                                                                                                                         |
| `Button`, `LinkButton`, `IconButton`                                               | shadcn `Button`: primary (`default`, one per screen), secondary (`outline`), ghost; `call` (`destructive`) only for calling.                                                                                                                 |
| `List`, `ListRow`                                                                  | shadcn `ItemGroup` / `Item` in a card: a row opens a screen, leaves to a link, or shows a value.                                                                                                                                             |
| `StatusIcon`, `RowIcon`                                                            | shadcn `ItemMedia` (icon): a hazard icon tinted by the official level when something is listed (neutral, faded without an answer, pulsing while checking), or a neutral action icon. One text edge per screen.                               |
| `Section`, `ScreenHead`, `BackLink`                                                | A title and space instead of boxes. `ScreenHead`: the title (its menu label), a short status at the end of its line when the screen has one, and at most one line of lead.                                                                   |
| `Badge`                                                                            | An official level in the agency's own words, beside a row title. Warnings in force are the first rows of the list, never a separate coloured box.                                                                                            |
| `SafetyNotice`, `Note`, `ScopeNote`                                                | The three tiers below.                                                                                                                                                                                                                       |
| `SourceStamp`                                                                      | Who said it and when.                                                                                                                                                                                                                        |
| `Magnitude`, `Skeleton`                                                            | Published magnitude; placeholder while the first answer arrives.                                                                                                                                                                             |
| `ChoiceChip`, `Segmented`, `Field`                                                 | Choosing, switching views, typing. Segments are 44 px, one variant per screen; a `block` keeps one row while the labels fit (equal, then as wide as each label), stacking only when they do not.                                             |
| `AppFrame`, `Header`, `StatusBar`, `TabBar`, `Sidebar`, `Content`                  | The frame. Phone: header, offline/stale strip, content, tabs. Desktop: sidebar with brand, country, Emergency, menu, sources, privacy and language; no top bar.                                                                              |
| `SelectField`, `TextArea`, `CheckRow`, `Combobox`                                  | Long lists on the device's picker, multi-line text, checklist rows, country search with suggestions.                                                                                                                                         |
| `Tabs`, `Disclosure`, `ExpandRow`                                                  | Sibling panels; a whole optional part of a form (its caption turns to the error colour when something inside needs fixing); a row with detail. What opens fades in.                                                                          |
| `RadioList`, `ActionBar`, `ActionRow`, `MessageText`, `MessagePreview`, `Progress` | Avisar: one choice as rows, the main action kept in view on phones (natural width on desktop), share channels, the message as it will be sent, a checklist's progress.                                                                       |
| `Sheet`, `Facts`, `Pager`, `ScrollCue`                                             | A record over the screen (earthquake, install): from the bottom on phones, centred on desktop (see Motion), Back closes it; label/value rows; page numbers; the edge cue of a tab strip that scrolls.                                        |
| `StatusHead`, `AlertCard`, `ActionTile`, `NumberTile`, `Board`, `HazardPicker`     | For the person in a hurry (Situación, Emergencia): the answer as the heading; a warning in force as a card in its level's colour; large tile actions; numbers as large buttons; one line per hazard with a dot; the hazard chooser as tiles. |
| `Figure`, `IndexNav`, `Text`                                                       | An illustration with its credit; the guide's topic list beside the text on desktop; a paragraph in the text or caption role.                                                                                                                 |

## Motion

Three durations, in `tokens.css`: `--f-press` (100 ms) for hover and press colours, `--f-move`
(220 ms, `--f-ease`) for something arriving, `--f-leave` (160 ms, `--f-ease-exit`) for something
leaving.

- **Sheet:** on phones it is shadcn's Drawer (vaul), sliding up from the bottom edge; from 600 px
  it is shadcn's Dialog, fading and zooming in at the centre. The veil fades with it. Radix keeps
  the sheet mounted until its closing animation ends; meanwhile the sheet keeps showing its
  record, even if the app has already let it go.
- **Disclosure and ExpandRow:** what opens fades in and settles 4 px down; closing is immediate.
- **Reduced motion** (`prefers-reduced-motion`): nothing slides or scales. Sheets and opened parts
  fade in place, and hover and press colours change at once.

## Notices and sources

Nothing that is not data may outweigh an instruction. Every caveat belongs to one tier:

1. **SafetyNotice**: changes what the person does ("go on foot to high ground now"). Bold,
   next to the action.
2. **Note**: how to read a figure ("each agency calculates magnitude its own way"). One line
   with a link to the explanation on the Sources screen.
3. **ScopeNote**: what Faro does not do and where data stays. Once per screen, at the end.

Times and sources use one grammar: `Issuer · issued 12:36 · 10 min ago`. Faro's own check time
appears once per screen; polling countdowns belong on the Sources screen. Pending answers show a
placeholder, never a failure message.

## Specimen

In development, `/?muestra` shows the screens to approve (phone and desktop frames, ES/EN/PT),
the foundations and every component. `/?muestra&pantalla=situacion` (also `emergencia`, `pais`)
shows one mockup filling the window. Production builds do not include it.

## Not yet

Dark mode: tokens already separate roles from values, so it is a `prefers-color-scheme` block in
`tokens.css`. It waits for a contrast review of the official level colours, the map tiles and the
guide's drawings on a dark page.

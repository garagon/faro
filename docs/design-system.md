# Design system

Faro's interface is built from a small set of tokens and components so the same thing looks
the same everywhere. Screens compose these pieces; they do not restyle them.

## Where things live

| Part                                                                      | File                                        |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| Tokens: colour roles, type scale, spacing, radii, shadows, layers, motion | `src/styles/ds/tokens.css`                  |
| Component styles                                                          | `src/styles/ds/components.css`              |
| App frame: header, tabs, sidebar, top bar, layout helpers                 | `src/styles/ds/shell.css`                   |
| React components                                                          | `src/ui/` (exported from `src/ui/index.ts`) |
| Cascade order                                                             | `src/styles/index.css`                      |

## Cascade layers

`src/styles/index.css` loads every style into four layers, in this order:

1. `vendor`: the map libraries' own styles.
2. `ds-base`: tokens and the design system's defaults (type, links, focus), below the older
   screens so they keep their own colours and spacing.
3. `legacy`: the screen styles written before the design system.
4. `ds`: components and the app frame, above everything else.

A later layer always wins, whatever the selector, so design-system rules never need higher
specificity or `!important`. The loading screen (`boot.css`) is linked from `index.html` and stays
outside. Components set their own margins; nothing in `ds-base` resets elements globally.

Situación, Emergencia, the country screen and the app frame are on the design system. Ayuda,
Avisar, Mochila, Viaje, Guía, the detail pages and Fuentes still use `legacy` inside the new
frame (their content region keeps the `fw-app` and `fw-main` classes). Moving a screen means
rebuilding it with `src/ui` components and deleting the legacy rules it used, in the same change.

## Rules

- No colour, size, spacing, radius or shadow literals outside `tokens.css`.
- Selectors are one class, plus one attribute at most. Variants are data attributes
  (`data-variant`, `data-size`, `data-level`), never per-screen overrides.
- Components have no outer margin. Layouts (`f-stack`, `f-column`, `f-split`, sections) own gaps.
- Screens without a side column use one reading column (`f-column`, 42 rem); nothing stretches
  across a wide monitor.
- No coloured side stripes or boxes inside boxes: hierarchy comes from type, space and one list
  container.
- Breakpoints are container queries on the app frame (`.f-app`): 360, 400, 900 and 1200 px, plus
  22.5 em so large browser text never scrolls sideways.
- One text edge per screen: every row with a leading element uses the `--f-lead` column (36 px).
- One row height per list: if one row has a caption, all do. Captions fit one line at 390 px in
  Spanish; numbers and their units never break ("24 h", "10 min").
- The Emergency button in the frame always has the same outline; filled red is only the call
  button. On the Emergency screen it is marked as the current place.
- Order on Situación: on a normal day the actions come first; when a warning of level 2 or more is
  in force, "What is happening" moves up under the call button.
- Every tappable element has a 44 px target and pressed feedback (`f-pressable`).
- Text sizes are in `rem`, so the reader's browser setting applies. Fields use 16 px.

## Colour roles

| Role                                 | Meaning                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| Call red                             | Only for calling for help: the call button and the Emergency button.                 |
| Level 1–3 (amber, orange, alert red) | Only official warning levels, and stale data (level 1). The level is always written. |
| Action green                         | The brand and the main action; with a ring, "the source answered with nothing".      |
| Ink and neutrals                     | Everything else.                                                                     |

Magnitude uses one hue from light to dark, so a larger figure is always darker. The figure
carries the meaning, never the colour alone.

## Type

Public Sans. Every text uses one of five roles:

| Role                  | Size / weight   | Used for                                                 |
| --------------------- | --------------- | -------------------------------------------------------- |
| Screen title          | 28 / 700        | The title of a screen (the same words as its menu entry) |
| Section title, figure | 18 / 700        | Section titles; phone numbers and magnitudes in lists    |
| Label                 | 16 / 600        | Row titles, buttons, chips, field labels, safety notices |
| Text                  | 16 / 400        | Paragraphs and steps                                     |
| Caption               | 14 / 400, muted | Row descriptions, sources and times, notes               |

Exceptions: 34 / 700 for the magnitude in an earthquake's detail, 13 for map attribution and
legal text, 12 for tab labels. Figures that are compared (phone numbers, magnitudes, step
numbers) use tabular digits; running text keeps proportional digits. A list row is always
a label and one caption line; state, source and time share that caption.

## Components

| Component                                                         | Use                                                                                                                                                                                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CallButton`                                                      | The main emergency number: the large button in call red, at most as wide as a phone (26 rem). Once per screen.                                                                                                          |
| `PhoneRow`                                                        | Other numbers, as list rows: the number first, who answers under it.                                                                                                                                                    |
| `Button`, `LinkButton`, `IconButton`                              | One family, 44 and 56 px: primary (one per screen), secondary, ghost; `call` only for calling.                                                                                                                          |
| `List`, `ListRow`                                                 | Grouped rows; a row opens a screen, leaves to a link, or shows a value.                                                                                                                                                 |
| `StatusIcon`, `RowIcon`                                           | The 36 px circle that starts a row: a hazard icon tinted by the official level when something is listed (neutral, faded without an answer, pulsing while checking), or a neutral action icon. One text edge per screen. |
| `Section`, `ScreenHead`, `BackLink`                               | A title and space instead of boxes; the screen title equals its menu label.                                                                                                                                             |
| `Badge`                                                           | An official level in the agency's own words, beside a row title. Warnings in force are the first rows of the list, never a separate coloured box.                                                                       |
| `SafetyNotice`, `Note`, `ScopeNote`                               | The three tiers below.                                                                                                                                                                                                  |
| `SourceStamp`                                                     | Who said it and when.                                                                                                                                                                                                   |
| `Magnitude`, `Skeleton`                                           | Published magnitude; placeholder while the first answer arrives.                                                                                                                                                        |
| `ChoiceChip`, `Segmented`, `Field`                                | Choosing, switching views, typing.                                                                                                                                                                                      |
| `AppFrame`, `Header`, `StatusBar`, `TabBar`, `Sidebar`, `Content` | The frame. Phone: header, offline/stale strip, content, tabs. Desktop: sidebar with brand, country, Emergency, menu, sources, privacy and language; no top bar.                                                         |

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

Dark mode comes after every screen uses the design system: tokens already separate roles from
values, so it is a `prefers-color-scheme` block in `tokens.css`, but a dark frame around light
legacy screens would look worse than no dark mode.

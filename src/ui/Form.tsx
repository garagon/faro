import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { NativeSelect } from '@/components/ui/native-select';
import { Tabs as UITabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { fieldHint, invalidField } from './Choice.tsx';

/**
 * A labelled choice from a list, on the device's own picker: shadcn's native select, the same
 * frame as an Input, with its chevron.
 */
export function SelectField({
  label,
  hint,
  id,
  children,
  className,
  ...select
}: {
  label: ReactNode;
  hint?: ReactNode;
  id: string;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {hint && (
        <FieldDescription id={`${id}-hint`} className={fieldHint}>
          {hint}
        </FieldDescription>
      )}
      <NativeSelect
        className={cn('cursor-pointer py-1 text-base md:text-sm', invalidField, className)}
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...select}
      >
        {children}
      </NativeSelect>
    </Field>
  );
}

/** A labelled multi-line text (shadcn Textarea). */
export function TextArea({
  label,
  hint,
  id,
  className,
  ...area
}: {
  label: ReactNode;
  hint?: ReactNode;
  id: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {hint && (
        <FieldDescription id={`${id}-hint`} className={fieldHint}>
          {hint}
        </FieldDescription>
      )}
      <Textarea
        className={cn('min-h-30', invalidField, className)}
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...area}
      />
    </Field>
  );
}

/**
 * A checklist row inside a List: a shadcn Checkbox in an Item, then a label and one caption line.
 * The whole row toggles; a checked item keeps its text, greyed, never struck through.
 */
export function CheckRow({
  id,
  checked,
  onChange,
  title,
  meta,
  trail,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: ReactNode;
  meta?: ReactNode;
  trail?: ReactNode;
}) {
  return (
    <li>
      <Item
        asChild
        size="sm"
        className="f-row w-full cursor-pointer hover:bg-accent/50 motion-reduce:transition-none"
      >
        <label htmlFor={id}>
          <ItemMedia>
            <Checkbox
              id={id}
              className="size-5"
              checked={checked}
              onCheckedChange={(state) => onChange(state === true)}
            />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className={cn(checked && 'text-muted-foreground')}>{title}</ItemTitle>
            {meta && <ItemDescription className="line-clamp-none">{meta}</ItemDescription>}
          </ItemContent>
          {trail && <ItemActions className="text-muted-foreground">{trail}</ItemActions>}
        </label>
      </Item>
    </li>
  );
}

/**
 * shadcn's line tabs as one strip that scrolls sideways when the labels do not fit: a hairline
 * under the strip, the selected tab underlined on it. The strip keeps 3 px of padding so the
 * focus ring of a tab is not cut off by the scrolling edge.
 */
export const tabListLine =
  'h-auto w-full justify-start gap-4 overflow-x-auto overflow-y-hidden rounded-none border-b p-[3px] [scrollbar-width:none]';
export const tabTriggerLine =
  'h-10 flex-none rounded-sm px-1 text-sm group-data-[orientation=horizontal]/tabs:after:-bottom-[3px] motion-reduce:transition-none';

/**
 * Tabs that switch the panel below in place (the detail pages of one hazard family): shadcn
 * Tabs, line variant. Each tab is a button with aria-selected and the id `f-tab-<id>`; arrow keys
 * move between them (Home and End too). `panel` names the element each tab controls.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  panel,
}: {
  tabs: readonly { id: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** The id of the panel a tab controls (aria-controls). */
  panel?: (id: T) => string;
}) {
  return (
    <UITabs value={value} onValueChange={(id) => onChange(id as T)} className="min-w-0">
      <TabsList variant="line" aria-label={label} className={tabListLine}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            id={`f-tab-${tab.id}`}
            // Without a panel id, no aria-controls pointing at nothing.
            aria-controls={panel?.(tab.id)}
            className={tabTriggerLine}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="font-normal text-muted-foreground tabular-nums">{tab.count}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </UITabs>
  );
}

/**
 * A part of a long form or page that opens in place: a shadcn Collapsible in a card, its trigger
 * an Item row (a title, one caption line), then the content. For whole sections; rows inside a
 * list use ExpandRow. The content stays mounted while closed, as with details, so what was typed
 * inside is kept.
 */
export function Disclosure({
  title,
  meta,
  lead,
  open,
  onToggle,
  invalid,
  children,
}: {
  title: ReactNode;
  meta?: ReactNode;
  lead?: ReactNode;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  /** The caption says what to fix inside, in the error colour (a form part with an error). */
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => onToggle?.(next)}
      className="group/disclosure rounded-xl border bg-card text-card-foreground shadow-xs"
    >
      <CollapsibleTrigger asChild>
        <Item
          asChild
          size="sm"
          className="f-row w-full cursor-pointer rounded-xl text-left hover:bg-accent/50 data-[state=open]:rounded-b-none motion-reduce:transition-none"
        >
          <button type="button">
            {lead}
            <ItemContent className="min-w-0">
              <ItemTitle>{title}</ItemTitle>
              {meta && (
                <ItemDescription
                  data-state={invalid ? 'error' : undefined}
                  className="line-clamp-none data-[state=error]:text-amber-800 [&_svg]:inline [&_svg]:size-4 [&_svg]:align-[-0.125em]"
                >
                  {meta}
                </ItemDescription>
              )}
            </ItemContent>
            <ItemActions>
              <ChevronDownIcon
                className="size-4 text-muted-foreground transition-transform group-data-[state=open]/disclosure:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </ItemActions>
          </button>
        </Item>
      </CollapsibleTrigger>
      <CollapsibleContent
        forceMount
        className="grid gap-4 border-t p-4 data-[state=closed]:hidden data-[state=open]:animate-in data-[state=open]:fade-in-0"
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

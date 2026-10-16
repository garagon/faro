import { useRef, useSyncExternalStore, type ReactNode } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

type Content = {
  /** Language tag of the content (the portal sits outside the app's `lang`). */
  lang?: string;
  /** A figure before the title, e.g. the magnitude. */
  lead?: ReactNode;
  title: ReactNode;
  /** One caption line under the title: source, time, state. */
  description: ReactNode;
  /** Buttons at the foot, always visible. */
  actions?: ReactNode;
  children: ReactNode;
};

/** Centred from 600 px of window (the sheet renders in a portal, outside the app's container). */
const WIDE = '(min-width: 600px)';
const subscribe = (change: () => void) => {
  const query = matchMedia(WIDE);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};
const wideNow = () => matchMedia(WIDE).matches;

/**
 * The detail of one record over the screen: a shadcn Drawer from the bottom on phones, a shadcn
 * Dialog centred on wide screens. Both are Radix dialogs: focus moves in, Escape and the close
 * button close it, and focus returns to what opened it (a list row or a map pin) when that is
 * still on the page.
 *
 * While it leaves it keeps showing the record it showed, even if the app has already let go of it.
 */
export function Sheet({
  open,
  onClose,
  closeLabel,
  ...content
}: Content & {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
}) {
  const wide = useSyncExternalStore(subscribe, wideNow, () => true);
  const opener = useRef<HTMLElement | null>(null);
  const shown = useRef(content);
  if (open) shown.current = content;
  const { lang, lead, title, description, actions, children } = open ? content : shown.current;
  const focus = {
    onOpenAutoFocus: () => {
      opener.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    },
    onCloseAutoFocus: (event: Event) => {
      if (opener.current?.isConnected) {
        event.preventDefault();
        opener.current.focus({ preventScroll: true });
      }
    },
  };
  const change = (next: boolean) => {
    if (!next) onClose();
  };
  const close = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="f-sheet-close -mt-1 -mr-2 size-10 shrink-0 self-start text-muted-foreground hover:text-foreground"
      aria-label={closeLabel}
    >
      <XIcon className="size-5" aria-hidden="true" />
    </Button>
  );
  const head = 'f-sheet-head flex-row items-center gap-4 border-b text-left';
  const leadBox = lead && (
    <div className="f-sheet-lead grid shrink-0 place-items-center">{lead}</div>
  );
  const titleClass = 'text-base leading-snug font-semibold [overflow-wrap:anywhere]';
  const descriptionClass = 'text-sm leading-snug text-muted-foreground';
  const body =
    'f-sheet-body @container grid min-h-0 flex-1 content-start gap-5 overflow-y-auto overscroll-contain *:m-0';
  const foot =
    'f-sheet-actions mt-0 flex-row flex-wrap gap-3 border-t pb-[max(1rem,env(safe-area-inset-bottom))] *:flex-[1_0_auto]';

  if (wide)
    return (
      <Dialog open={open} onOpenChange={change}>
        <DialogContent
          showCloseButton={false}
          className="f-sheet f-root flex max-h-[calc(100dvh-4rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 motion-reduce:animate-none"
          lang={lang}
          {...focus}
        >
          <DialogHeader className={cn(head, 'px-6 py-4')}>
            {leadBox}
            <div className="grid min-w-0 flex-1 gap-1">
              <DialogTitle className={titleClass}>{title}</DialogTitle>
              <DialogDescription className={descriptionClass}>{description}</DialogDescription>
            </div>
            <DialogClose asChild>{close}</DialogClose>
          </DialogHeader>
          <div className={cn(body, 'p-6')}>{children}</div>
          {actions && (
            <DialogFooter className={cn(foot, 'px-6 pt-4 sm:justify-start')}>
              {actions}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  return (
    <Drawer open={open} onOpenChange={change} autoFocus>
      <DrawerContent
        className="f-sheet f-root max-h-[90dvh] data-[vaul-drawer-direction=bottom]:max-h-[90dvh] motion-reduce:animate-none! motion-reduce:transition-none!"
        lang={lang}
        {...focus}
      >
        <DrawerHeader
          className={cn(
            head,
            'px-4 pt-3 pb-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left',
          )}
        >
          {leadBox}
          <div className="grid min-w-0 flex-1 gap-1">
            <DrawerTitle className={titleClass}>{title}</DrawerTitle>
            <DrawerDescription className={descriptionClass}>{description}</DrawerDescription>
          </div>
          <DrawerClose asChild>{close}</DrawerClose>
        </DrawerHeader>
        <div className={cn(body, 'p-4')}>{children}</div>
        {actions && <DrawerFooter className={cn(foot, 'px-4 pt-4')}>{actions}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
}

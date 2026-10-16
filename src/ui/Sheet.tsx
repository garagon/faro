import { useRef, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XIcon } from '@phosphor-icons/react';

/**
 * The detail of one record over the screen: from the bottom on phones, centred on wide screens.
 * A Radix dialog: focus moves in, Escape and the close button close it, and focus returns to
 * what opened it (a list row or a map pin) when that is still on the page.
 */
export function Sheet({
  open,
  onClose,
  lang,
  closeLabel,
  lead,
  title,
  description,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Language tag of the content (the portal sits outside the app's `lang`). */
  lang?: string;
  closeLabel: string;
  /** A figure before the title, e.g. the magnitude. */
  lead?: ReactNode;
  title: ReactNode;
  /** One caption line under the title: source, time, state. */
  description: ReactNode;
  /** Buttons at the foot, always visible. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="f-sheet-overlay" />
        <Dialog.Content
          className="f-sheet f-root"
          lang={lang}
          onOpenAutoFocus={() => {
            opener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            if (opener.current?.isConnected) {
              event.preventDefault();
              opener.current.focus({ preventScroll: true });
            }
          }}
        >
          <header className="f-sheet-head">
            {lead && <div className="f-sheet-lead">{lead}</div>}
            <div className="f-sheet-heading">
              <Dialog.Title className="f-sheet-title">{title}</Dialog.Title>
              <Dialog.Description className="f-sheet-meta">{description}</Dialog.Description>
            </div>
            <Dialog.Close
              className="f-icon-button f-pressable f-sheet-close"
              aria-label={closeLabel}
            >
              <XIcon size={22} aria-hidden="true" />
            </Dialog.Close>
          </header>
          <div className="f-sheet-body">{children}</div>
          {actions && <footer className="f-sheet-actions">{actions}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

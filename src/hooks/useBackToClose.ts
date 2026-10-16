import { useEffect, useRef } from 'react';

/**
 * A dialog open over a screen is a history entry of its own: the phone's Back closes the dialog
 * and leaves the screen as it was. Closing it another way (the X, Escape) removes that entry, so
 * the next Back goes to the previous screen as usual.
 */
export function useBackToClose(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    history.pushState({ ...(history.state ?? {}), faroDialog: true }, '');
    const onBack = () => closeRef.current();
    window.addEventListener('popstate', onBack);
    return () => {
      window.removeEventListener('popstate', onBack);
      if ((history.state as { faroDialog?: boolean } | null)?.faroDialog) history.back();
    };
  }, [open]);
}

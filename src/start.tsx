import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

/**
 * Tells the offline copy (src/sw.ts) that this version started on this device, so it may replace
 * the previous one. Runs after the application's first render, never if it fails to start. The
 * worker that installs this version may only take over later, so it is told again then.
 */
function Started() {
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    const script = new URL(import.meta.url).pathname;
    const tell = () =>
      navigator.serviceWorker.controller?.postMessage({ type: 'faro-started', script });
    void navigator.serviceWorker.ready.then(tell);
    navigator.serviceWorker.addEventListener('controllerchange', tell);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', tell);
  }, []);
  return null;
}

/** Mounts the application over the loading screen in index.html. */
export function start(root: HTMLElement) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
        <Started />
      </ErrorBoundary>
    </StrictMode>,
  );
}

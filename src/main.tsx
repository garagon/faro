// The page's only render-blocking style is the small loading screen (boot.css, linked from
// index.html), so the call button and first steps show while the application downloads. The
// application and its styles arrive as one chunk; its styles are applied before it runs.

// Stores the application for offline opening (src/sw.ts). This module must not import from the
// worker's modules: shared code would split sw.js into chunks a classic worker cannot load.
// Failure leaves the app online-only.
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
// Development only: the design-system specimen at /?muestra (not part of production builds).
if (import.meta.env.DEV && new URLSearchParams(location.search).has('muestra'))
  import('./ui/specimen/start.tsx').then(({ start }) => start(root));
else
  import('./start.tsx')
    .then(({ start }) => start(root))
    .catch(() => {
      // The loading screen stays, with its call button; it says the app did not load.
      const status = document.querySelector('.fw-boot-status');
      if (status)
        status.textContent =
          'No se pudo cargar Faro. Recarga la página. · Faro could not load. Reload the page. · Não foi possível carregar o Faro. Recarregue a página.';
    });

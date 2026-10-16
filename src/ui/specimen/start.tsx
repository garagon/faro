import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/index.css';
import './specimen.css';
import Specimen from './Specimen.tsx';

/** Development only: the design-system specimen at /?muestra. */
export function start(root: HTMLElement) {
  document.title = 'Faro · muestra del sistema de diseño';
  createRoot(root).render(
    <StrictMode>
      <Specimen />
    </StrictMode>,
  );
}

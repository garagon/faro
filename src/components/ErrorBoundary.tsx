import { Component, type ReactNode } from 'react';
import { emergencyFor } from '../lib/emergency.ts';
import { langIndex, langTag, pick } from '../lib/i18n.ts';
import { readSiteLanguage } from '../lib/preferences.ts';
import { Button, CallButton, List, PhoneRow, ScreenHead, Section } from '../ui/index.ts';

type State = { failed: boolean };

/** Country to show numbers for when the app itself cannot render: the saved trip, or Panama. */
function savedCountry(): string {
  try {
    const raw = JSON.parse(localStorage.getItem('faro-preferences-v1') || 'null') as {
      destination?: unknown;
    } | null;
    return typeof raw?.destination === 'string' && /^[A-Z]{2}$/.test(raw.destination)
      ? raw.destination
      : 'PA';
  } catch {
    return 'PA';
  }
}

/**
 * If any screen throws, the emergency numbers must still be one tap away. This fallback uses
 * no app state, only the static directory and the saved country.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    // The language the person chose, else the browser's (Spanish, Portuguese, or English).
    const lang = readSiteLanguage();
    const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
    const country = savedCountry();
    const data = emergencyFor(country);
    const name = new Intl.DisplayNames([langTag(lang)], { type: 'region' }).of(country);
    const heading = t(`Emergencias en ${name}`, `Emergencies in ${name}`, `Emergência · ${name}`);
    const lead = data
      ? t(
          'Los números de emergencia siguen aquí. Recarga la página para volver a usar Faro.',
          'Emergency numbers are still here. Reload the page to use Faro again.',
          'Os números de emergência continuam aqui. Recarregue a página para voltar a usar o Faro.',
        )
      : t(
          'Faro no tiene teléfonos verificados para este país. Pregunta en tu alojamiento o a la autoridad local, y recarga la página para volver a usar Faro.',
          'Faro has no verified numbers for this country. Ask where you are staying or local authorities, and reload the page to use Faro again.',
          'O Faro não tem números verificados para este país. Pergunte na sua hospedagem ou às autoridades locais e recarregue a página para voltar a usar o Faro.',
        );
    const [main, ...others] = data?.numbers ?? [];
    const i = langIndex(lang);
    // Design-system parts only: plain presentation, no app state, so it renders after a crash.
    return (
      <main className="f-root" lang={langTag(lang)}>
        <div className="f-page">
          <ScreenHead
            title={t('Faro tuvo un problema', 'Faro ran into a problem', 'O Faro teve um problema')}
            lead={lead}
          />
          {main && (
            <Section id="fw-fallback-numbers" title={heading}>
              <CallButton
                number={main.number}
                label={t(
                  `Llamar al ${main.number}`,
                  `Call ${main.number}`,
                  `Ligar para ${main.number}`,
                )}
                note={main.label[i]}
              />
              {others.length > 0 && (
                <List>
                  {others.map((n) => (
                    <PhoneRow key={n.number} number={n.number} name={n.label[i]} />
                  ))}
                </List>
              )}
            </Section>
          )}
          <div>
            <Button variant="secondary" onClick={() => location.reload()}>
              {t('Recargar Faro', 'Reload Faro', 'Recarregar o Faro')}
            </Button>
          </div>
        </div>
      </main>
    );
  }
}

import { useEffect, useRef, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollCue } from '../ui/index.ts';
import { tabListLine, tabTriggerLine } from '../ui/Form.tsx';

export type HomeTab = { id: string; label: string; content: ReactNode };

/**
 * The detail pages of Situación (earthquakes, tsunami, cyclones, alerts), one panel at a time.
 * shadcn Tabs (line variant), which scroll on a phone with a cue at the hidden edge. The tabs
 * keep their ids because the app focuses `#fw-tab-<id>` when it opens a tab, and each tab names
 * the panel it controls (`#fw-panel-<id>`). Arrow keys, Home and End move between tabs.
 * Labels are one short word with no count (counts go in the panel's list title), so the four tabs
 * fit from 360 px; narrower, the strip scrolls with its cue.
 */
export default function HomeTabs({
  label,
  tabs,
  active,
  onChange,
}: {
  label: string;
  tabs: HomeTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];
  // On a narrow screen the strip scrolls sideways: keep the selected tab in view without moving
  // the page.
  useEffect(() => {
    const tab = refs.current[current.id];
    const strip = tab?.parentElement;
    if (!tab || !strip) return;
    const start = tab.offsetLeft - strip.offsetLeft;
    if (start < strip.scrollLeft || start + tab.offsetWidth > strip.scrollLeft + strip.clientWidth)
      strip.scrollLeft = Math.max(0, start - (strip.clientWidth - tab.offsetWidth) / 2);
  }, [current.id]);
  return (
    <Tabs asChild value={current.id} onValueChange={onChange} className="gap-4">
      <section className="f-stack" id="fw-detail">
        <ScrollCue>
          <TabsList variant="line" aria-label={label} className={tabListLine}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                ref={(el) => {
                  refs.current[tab.id] = el;
                }}
                value={tab.id}
                id={`fw-tab-${tab.id}`}
                aria-controls={`fw-panel-${tab.id}`}
                className={tabTriggerLine}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollCue>
        <TabsContent
          value={current.id}
          id={`fw-panel-${current.id}`}
          aria-labelledby={`fw-tab-${current.id}`}
          tabIndex={0}
          className="min-w-0"
        >
          {current.content}
        </TabsContent>
      </section>
    </Tabs>
  );
}

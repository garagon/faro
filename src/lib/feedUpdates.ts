import type { Quake } from './domain.ts';
export type FeedUpdate = { event: Quake; receivedAt: number };
// A session baseline prevents a cached catalogue or a first load becoming a new-event alarm.
export function createFeedTracker() {
  let known: Set<string> | null = null;
  let updates: FeedUpdate[] = [];
  return {
    observe(events: Quake[], receivedAt: number) {
      const current = new Map(events.map((event) => [event.id, event]));
      const added = known ? events.filter((event) => !known!.has(event.id)) : [];
      known ??= new Set();
      events.forEach((event) => known!.add(event.id));
      updates = [
        ...added.map((event) => ({ event, receivedAt })),
        ...updates.map((update) => ({
          ...update,
          event: current.get(update.event.id) ?? update.event,
        })),
      ]
        .sort((a, b) => b.receivedAt - a.receivedAt || b.event.time - a.event.time)
        .slice(0, 50);
      return updates;
    },
  };
}
export function ageLabel(time: number, now: number, lang: string) {
  const seconds = Math.max(0, Math.floor((now - time) / 1000));
  if (seconds < 60) return lang === 'es' ? `hace ${seconds} s` : `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return lang === 'es' ? `hace ${minutes} min` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === 'es' ? `hace ${hours} h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === 'es' ? `hace ${days} d` : `${days}d ago`;
}

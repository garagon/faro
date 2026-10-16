import type { ReactNode } from 'react';
import { InfoIcon, TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * Three tiers for everything that is not data, so a caveat never outweighs an instruction:
 * - SafetyNotice changes what you do (shadcn Alert, read in a hurry, next to the action);
 * - Note says how to read a figure (one muted line, links to the full explanation);
 * - ScopeNote says what Faro does not do, once per screen, at the end.
 * Official warnings in force are list rows with a Badge naming the agency's level.
 */
export function SafetyNotice({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    // An instruction on the page, not an announcement: no live region.
    <Alert role={undefined} className="text-base [&>svg]:translate-y-1">
      <TriangleAlertIcon aria-hidden="true" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="text-base text-card-foreground [&_p]:leading-normal">
        <p>{children}</p>
      </AlertDescription>
    </Alert>
  );
}

export function Note({ children, more }: { children: ReactNode; more?: ReactNode }) {
  return (
    <p className="flex gap-2 text-sm text-muted-foreground [&_a]:whitespace-nowrap">
      <InfoIcon className="size-4 shrink-0 translate-y-0.5" aria-hidden="true" />
      <span>
        {children} {more}
      </span>
    </p>
  );
}

export function ScopeNote({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4">
      <Separator />
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

/** Compact connection or freshness state, kept in the header while it applies. */
export function StatusChip({ children }: { children: ReactNode }) {
  return (
    <Badge variant="outline" role="status" className="text-amber-800">
      {children}
    </Badge>
  );
}

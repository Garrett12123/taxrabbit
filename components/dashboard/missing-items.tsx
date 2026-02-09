import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import type { MissingItem } from '@/server/services/analytics-service';

type Props = {
  items: MissingItem[];
};

export function MissingItems({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-muted/25 px-4 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="size-6 text-green-700 dark:text-green-300" />
        </div>
        <div>
          <p className="font-medium text-green-800 dark:text-green-300">All set!</p>
          <p className="text-sm text-muted-foreground">No missing items detected for this tax year.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          className="flex items-start gap-3 rounded-md border px-4 py-3 transition-smooth hover:bg-muted/50"
        >
          {item.severity === 'warning' ? (
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
          ) : (
            <Info className="mt-0.5 size-5 shrink-0 text-blue-500" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  Shield,
  ChevronDown,
  Container,
  Monitor,
  Lock,
  KeyRound,
  Cookie,
  Cpu,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getEnvironmentInfo,
  type EnvironmentInfo,
} from '@/app/(modules)/environment-action';

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-block size-1.5 rounded-full',
        active ? 'bg-positive' : 'bg-muted-foreground/40'
      )}
    />
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <Icon className="size-3.5 shrink-0 text-sidebar-foreground/50" />
      <span className="flex-1 text-[11px] text-sidebar-foreground/60">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {active !== undefined && <StatusDot active={active} />}
        <span className="text-[11px] font-medium text-sidebar-foreground/80">
          {value}
        </span>
      </div>
    </div>
  );
}

export function EnvironmentInfoPanel() {
  const [info, setInfo] = React.useState<EnvironmentInfo | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    getEnvironmentInfo().then(setInfo);
  }, []);

  if (!info) {
    return (
      <div className="flex h-8 items-center gap-2 rounded-md px-2">
        <Shield className="size-4 text-sidebar-foreground/40 animate-pulse" />
        <span className="text-xs text-sidebar-foreground/40">Loading...</span>
      </div>
    );
  }

  const isDocker = info.runtime === 'docker';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-sidebar-accent">
        <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-accent/80">
          {info.deviceKeyBound ? (
            <ShieldCheck className="size-3.5 text-positive" />
          ) : (
            <ShieldAlert className="size-3.5 text-warning" />
          )}
        </div>
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-sidebar-foreground/80">
            Security
          </span>
          <Badge
            variant={isDocker ? 'secondary' : 'muted'}
            className="h-4 px-1.5 text-[9px] font-semibold uppercase tracking-wider"
          >
            {isDocker ? (
              <><Container className="size-2.5" /> Docker</>
            ) : (
              <><Monitor className="size-2.5" /> Native</>
            )}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 text-sidebar-foreground/40 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 rounded-md border border-sidebar-border/50 bg-sidebar-accent/30 px-2.5 py-1.5">
          <InfoRow
            icon={Lock}
            label="Encryption"
            value={info.encryption}
            active
          />
          <InfoRow
            icon={KeyRound}
            label="KDF"
            value={info.kdf}
            active
          />
          <InfoRow
            icon={Shield}
            label="Device Key"
            value={info.deviceKeyBound ? 'Bound' : 'None'}
            active={info.deviceKeyBound}
          />
          <InfoRow
            icon={Cookie}
            label="Secure Cookies"
            value={info.secureCookies ? 'On' : 'Off'}
            active={info.secureCookies}
          />
          <InfoRow
            icon={Cpu}
            label="Node"
            value={info.nodeVersion}
          />
          <InfoRow
            icon={isDocker ? Container : Monitor}
            label="Runtime"
            value={isDocker ? 'Container' : info.platform}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

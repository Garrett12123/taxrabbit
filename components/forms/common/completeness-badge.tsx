'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CompletenessResult } from '@/lib/completeness';

type CompletenessBadgeProps = {
  completeness: CompletenessResult;
  showProgress?: boolean;
};

const STATUS_CONFIG = {
  complete: { label: 'Complete', variant: 'success' as const, color: 'stroke-positive' },
  'needs-review': { label: 'Needs Review', variant: 'secondary' as const, color: 'stroke-warning' },
  minimal: { label: 'Incomplete', variant: 'destructive' as const, color: 'stroke-destructive' },
};

/**
 * Circular progress ring indicator
 */
function ProgressRing({ 
  percentage, 
  className,
  strokeColor,
}: { 
  percentage: number;
  className?: string;
  strokeColor: string;
}) {
  const size = 20;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('transform -rotate-90', className)}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/50"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={cn('transition-all duration-500 ease-out', strokeColor)}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
        }}
      />
    </svg>
  );
}

export function CompletenessBadge({
  completeness,
  showProgress = false,
}: CompletenessBadgeProps) {
  const config = STATUS_CONFIG[completeness.status];
  const hasMissing = completeness.missingRequired.length > 0;

  const badge = hasMissing ? (
    <button
      type="button"
      className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={`${config.label}. Show missing required fields.`}
    >
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    </button>
  ) : (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );

  return (
    <div className="flex items-center gap-2">
      {showProgress && (
        <ProgressRing 
          percentage={completeness.percentage} 
          strokeColor={config.color}
        />
      )}
      {hasMissing ? (
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <span tabIndex={-1}>{badge}</span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Missing required fields:</p>
              <ul className="list-inside list-disc">
                {completeness.missingRequired.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        badge
      )}
    </div>
  );
}

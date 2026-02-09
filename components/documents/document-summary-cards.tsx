import {
  CardContent,
  CardHeader,
  CardTitle,
  CardMetric,
} from '@/components/ui/card';

type DocumentSummaryCardsProps = {
  totalCount: number;
  totalSize: number;
  linkedCount: number;
  unlinkedCount: number;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function DocumentSummaryCards({
  totalCount,
  totalSize,
  linkedCount,
  unlinkedCount,
}: DocumentSummaryCardsProps) {
  const linkedPercent = totalCount > 0 ? Math.round((linkedCount / totalCount) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight">{totalCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">Files in vault</p>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Size
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight">{formatFileSize(totalSize)}</div>
          <p className="mt-2 text-xs text-muted-foreground">Encrypted storage used</p>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Linked
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight">{linkedCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {totalCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-positive">
                <span className="size-1.5 rounded-full bg-positive" />
                {linkedPercent}% attached
              </span>
            ) : (
              'No documents yet'
            )}
          </p>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unlinked
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight">{unlinkedCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {unlinkedCount === 0 ? (
              <span className="inline-flex items-center gap-1 text-positive">
                <span className="size-1.5 rounded-full bg-positive" />
                All files organized
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-warning" />
                Available to attach
              </span>
            )}
          </p>
        </CardContent>
      </CardMetric>
    </div>
  );
}

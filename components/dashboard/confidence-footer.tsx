type Props = {
  recordCount: number;
  lastUpdated?: string;
};

export function ConfidenceFooter({ recordCount, lastUpdated }: Props) {
  const timestamp = lastUpdated
    ? new Date(lastUpdated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'now';

  return (
    <p className="text-xs text-muted-foreground">
      Based on {recordCount} record{recordCount !== 1 ? 's' : ''} &middot; Data
      as of {timestamp}
    </p>
  );
}

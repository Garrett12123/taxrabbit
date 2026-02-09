import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type InteractiveCardProps = React.ComponentProps<typeof Card> & {
  interactive?: boolean;
};

export function InteractiveCard({
  interactive = true,
  className,
  ...props
}: InteractiveCardProps) {
  return (
    <Card
      className={cn(
        interactive && 'cursor-pointer hover-lift active:scale-[0.99]',
        className
      )}
      {...props}
    />
  );
}

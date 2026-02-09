'use client';

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={cn('rounded-lg', className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-14 rounded-lg [&_svg]:size-7">
          {icon}
        </EmptyMedia>
        <EmptyTitle className="text-xl">{title}</EmptyTitle>
        <EmptyDescription className="max-w-xs">{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}

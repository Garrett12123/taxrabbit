import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BoxLayout } from '@/components/forms/box-layout';
import { DetailPageActions } from './detail-actions';
import { CompletenessBadge } from '@/components/forms/common/completeness-badge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardMetric,
} from '@/components/ui/card';
import {
  getIncomeDocument,
  computeCompleteness,
} from '@/server/services/income-service';
import { formatCents } from '@/lib/utils';
import type { IncomeFormType } from '@/lib/constants';

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function IncomeDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const doc = await getIncomeDocument(id);

  if (!doc) {
    notFound();
  }

  const completeness = computeCompleteness(
    doc.formType as IncomeFormType,
    doc.payload.boxes ?? {},
    doc.payload.issuerName
  );

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/income">Income</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{doc.payload.issuerName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="rounded-lg border bg-card px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                {doc.formType}
              </h1>
              <Badge variant="outline">{doc.entityType}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {doc.payload.issuerName}
              {doc.payload.issuerEin && ` (EIN: ${doc.payload.issuerEin})`}
            </p>
          </div>
          <DetailPageActions document={doc} />
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <CardMetric trend="up">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {formatCents(doc.amount)}
            </div>
          </CardContent>
        </CardMetric>
        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Federal Withholding
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tabular-nums">
              {formatCents(doc.fedWithholding)}
            </div>
          </CardContent>
        </CardMetric>
        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completeness
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CompletenessBadge completeness={completeness} showProgress />
          </CardContent>
        </CardMetric>
      </div>

      {/* Form Details */}
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BoxLayout
            formType={doc.formType as IncomeFormType}
            boxes={doc.payload.boxes ?? {}}
          />
        </CardContent>
      </Card>

      {/* Notes (with separator) */}
      {doc.payload.notes && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {doc.payload.notes}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

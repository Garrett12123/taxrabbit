import { Suspense } from 'react';
import { FileText } from 'lucide-react';

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentSummaryCards } from '@/components/documents/document-summary-cards';
import { DocumentFilters } from '@/components/documents/document-filters';
import { DocumentTable } from '@/components/documents/document-table';
import { DocumentPageActions } from './page-actions';
import {
  listDocumentFilesByYear,
  getDocumentSummary,
} from '@/server/services/document-service';
import { listIncomeDocumentsByYear } from '@/server/db/dal/income-documents';
import { listExpensesByYear } from '@/server/db/dal/expenses';
import { formatCents } from '@/lib/utils';
import { getDefaultTaxYear } from '@/server/services/settings-service';
import { TAX_YEARS } from '@/lib/constants';

type DocumentsPageProps = {
  searchParams: Promise<{
    year?: string;
    linkStatus?: string;
    fileType?: string;
  }>;
};

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && !isNaN(yearParam) && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();
  const linkStatus = params.linkStatus;
  const fileType = params.fileType;

  const [allDocuments, summary, incomeDocs, expenses] = await Promise.all([
    listDocumentFilesByYear(year),
    getDocumentSummary(year),
    listIncomeDocumentsByYear(year),
    listExpensesByYear(year),
  ]);

  // Server-side filtering
  let documents = allDocuments;

  if (linkStatus === 'linked') {
    documents = documents.filter((d) => d.linkedEntityType !== null);
  } else if (linkStatus === 'unlinked') {
    documents = documents.filter((d) => d.linkedEntityType === null);
  }

  if (fileType === 'pdf') {
    documents = documents.filter((d) => d.mimeType === 'application/pdf');
  } else if (fileType === 'image') {
    documents = documents.filter((d) => d.mimeType.startsWith('image/'));
  }

  // Build linkable entity lists for the link dialog
  const linkableIncomeDocs = incomeDocs.map((doc) => ({
    id: doc.id,
    label: `${doc.formType} — ${doc.payload.issuerName} (${formatCents(doc.amount)})`,
  }));

  const linkableExpenses = expenses.map((expense) => ({
    id: expense.id,
    label: `${expense.payload.vendor} — ${expense.category} (${formatCents(expense.amount)})`,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Store and organize encrypted copies of tax documents for {year}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<Skeleton className="h-9 w-64" />}>
            <DocumentFilters />
          </Suspense>
          <DocumentPageActions year={year} />
        </div>
      </div>

      <DocumentSummaryCards
        totalCount={summary.totalCount}
        totalSize={summary.totalSize}
        linkedCount={summary.linkedCount}
        unlinkedCount={summary.unlinkedCount}
      />

      {documents.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>
              Upload your first document to start organizing receipts, tax forms,
              and other files.
            </EmptyDescription>
          </EmptyHeader>
          <DocumentPageActions year={year} variant="empty" />
        </Empty>
      ) : (
        <DocumentTable
          documents={documents}
          incomeDocs={linkableIncomeDocs}
          expenses={linkableExpenses}
        />
      )}
    </div>
  );
}

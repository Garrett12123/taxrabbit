import { formatCents } from '@/lib/utils';
import type { YearEndSummary } from '@/server/services/report-service';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';

type Props = {
  summary: YearEndSummary;
};

export function YearEndSummaryView({ summary }: Props) {
  const { income, expenses, documents, checklist } = summary;

  const businessExpenses = expenses.byCategory.filter(
    (c) => c.entityType === 'business'
  );
  const personalExpenses = expenses.byCategory.filter(
    (c) => c.entityType === 'personal'
  );

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        <SummaryCard label="Total Income" value={formatCents(income.total)} />
        <SummaryCard
          label="Fed Withholding"
          value={formatCents(income.totalWithholding)}
        />
        <SummaryCard
          label="Total Expenses"
          value={formatCents(expenses.totalAll)}
        />
        <SummaryCard
          label="Business Expenses"
          value={formatCents(expenses.totalBusiness)}
        />
      </div>

      {/* Income by Form Type */}
      {income.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Income by Form Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {income.byType.map((row) => (
                  <TableRow key={row.formType}>
                    <TableCell className="font-medium">
                      {row.formType}
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCents(row.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">
                    {income.byType.reduce((s, r) => s + r.count, 0)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCents(income.total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Business Expenses by Category */}
      {businessExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessExpenses.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell className="font-medium">
                      {row.category}
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCents(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCents(expenses.totalBusiness)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Personal Expenses by Category */}
      {personalExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personalExpenses.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell className="font-medium">
                      {row.category}
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCents(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCents(expenses.totalPersonal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Documents Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
            <StatItem label="Total" value={String(documents.totalCount)} />
            <StatItem label="Linked" value={String(documents.linkedCount)} />
            <StatItem
              label="Unlinked"
              value={String(documents.unlinkedCount)}
            />
            <StatItem label="Total Size" value={formatBytes(documents.totalSize)} />
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      {checklist.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Checklist Progress</CardTitle>
            <CardDescription>
              {checklist.completed} of {checklist.total} items completed
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="py-4">
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

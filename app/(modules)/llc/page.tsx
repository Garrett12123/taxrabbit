import { Building2, Receipt } from 'lucide-react';

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseSummaryCards } from '@/components/expenses/expense-summary-cards';
import { ExpenseTable } from '@/components/expenses/expense-table';
import { BusinessProfileForm } from '@/components/expenses/business-profile-form';
import { LlcPageActions } from './page-actions';
import {
  getBusinessProfileForYear,
} from '@/server/services/business-service';
import {
  listExpensesByYear,
  getExpenseSummary,
} from '@/server/services/expense-service';
import { listCustomCategories } from '@/server/db/dal/custom-categories';
import { computeAuditFlags, hasAuditWarnings } from '@/lib/audit';
import { getDefaultTaxYear } from '@/server/services/settings-service';

type LlcPageProps = {
  searchParams: Promise<{
    year?: string;
  }>;
};

export default async function LlcPage({ searchParams }: LlcPageProps) {
  const params = await searchParams;
  const year = params.year ? Number(params.year) : getDefaultTaxYear();
  const previousYear = year - 1;

  const [profile, previousProfile, businessExpenses, summary, customCategories] =
    await Promise.all([
      getBusinessProfileForYear(year),
      getBusinessProfileForYear(previousYear),
      listExpensesByYear(year, { entityType: 'business' }),
      Promise.resolve(getExpenseSummary(year)),
      Promise.resolve(listCustomCategories(year)),
    ]);

  const customCategoryNames = customCategories.map((c) => c.name);

  const rows = businessExpenses.map((expense) => {
    const auditFlags = computeAuditFlags({
      category: expense.category,
      receiptRef: expense.payload.receiptRef,
      notes: expense.payload.notes,
    });
    return { expense, auditFlags };
  });

  const needsAttentionCount = rows.filter((r) =>
    hasAuditWarnings(r.auditFlags)
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">LLC / Business</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your business profile and track business expenses for {year}.
          </p>
        </div>
        <LlcPageActions
          year={year}
          hasProfile={!!profile}
          hasPreviousProfile={!!previousProfile}
          customCategories={customCategoryNames}
        />
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <Building2 className="size-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5">
            <Receipt className="size-3.5" />
            Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          {!profile ? (
            <Card className="border-dashed">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Set Up Your Business Profile</CardTitle>
                <CardDescription className="max-w-md mx-auto">
                  Adding your business info helps TaxRabbit organize LLC-related expenses
                  and generate accurate reports for your CPA.
                  {previousProfile && ' You can also copy last year\'s profile.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessProfileForm year={year} profile={profile} />
              </CardContent>
            </Card>
          ) : (
            <BusinessProfileForm year={year} profile={profile} />
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <div className="space-y-6">
            <ExpenseSummaryCards
              totalAll={summary.totalBusiness}
              totalPersonal={0}
              totalBusiness={summary.totalBusiness}
              needsAttentionCount={needsAttentionCount}
            />

            {businessExpenses.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Receipt />
                  </EmptyMedia>
                  <EmptyTitle>No business expenses yet</EmptyTitle>
                  <EmptyDescription>
                    Add your first business expense to start tracking LLC
                    deductions.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ExpenseTable
                rows={rows}
                year={year}
                customCategories={customCategoryNames}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { type ReactNode } from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type Props = {
  overviewTab: ReactNode;
  incomeTab: ReactNode;
  expensesTab: ReactNode;
  documentsTab: ReactNode;
};

export function DashboardTabs({
  overviewTab,
  incomeTab,
  expensesTab,
  documentsTab,
}: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="income">Income</TabsTrigger>
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-6">
        {overviewTab}
      </TabsContent>
      <TabsContent value="income" className="mt-6">
        {incomeTab}
      </TabsContent>
      <TabsContent value="expenses" className="mt-6">
        {expensesTab}
      </TabsContent>
      <TabsContent value="documents" className="mt-6">
        {documentsTab}
      </TabsContent>
    </Tabs>
  );
}

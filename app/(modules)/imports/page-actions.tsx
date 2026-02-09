'use client';

import { useState } from 'react';
import { Upload, FileText, Car, Receipt, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CsvImportWizard } from '@/components/imports/csv-import-wizard';
import { MileageImportWizard } from '@/components/imports/mileage-import-wizard';
import { QuickAddW2Dialog } from '@/components/imports/quick-add-w2-dialog';
import { TemplateDownload } from '@/components/imports/template-download';

type ImportsPageActionsProps = {
  year: number;
};

export function ImportsPageActions({ year }: ImportsPageActionsProps) {
  const [expenseWizardOpen, setExpenseWizardOpen] = useState(false);
  const [mileageWizardOpen, setMileageWizardOpen] = useState(false);
  const [w2Open, setW2Open] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex items-center gap-2">
        <TemplateDownload />
        <Button variant="outline" onClick={() => setW2Open(true)}>
          <FileText className="size-4" />
          Quick Add W-2
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Upload className="size-4" />
              Import CSV
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setExpenseWizardOpen(true)}>
              <Receipt className="size-4" />
              Import Expenses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMileageWizardOpen(true)}>
              <Car className="size-4" />
              Import Mileage
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CsvImportWizard
        year={year}
        open={expenseWizardOpen}
        onOpenChange={setExpenseWizardOpen}
        onComplete={() => {
          toast.success('Expenses imported successfully.');
          router.push('/expenses');
        }}
      />

      <MileageImportWizard
        year={year}
        open={mileageWizardOpen}
        onOpenChange={setMileageWizardOpen}
        onComplete={() => {
          toast.success('Mileage logs imported successfully.');
          router.push('/mileage');
        }}
      />

      <QuickAddW2Dialog
        open={w2Open}
        onOpenChange={setW2Open}
        year={year}
      />
    </>
  );
}

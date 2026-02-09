'use client';

import { useState } from 'react';
import { Download, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

type Props = {
  year: number;
};

export function CPAExportCard({ year }: Props) {
  const [includeDocs, setIncludeDocs] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        includeDocs: String(includeDocs),
      });
      const res = await fetch(`/api/export/cpa-packet?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ??
        `CPA-Packet-${year}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CPA export failed:', err);
      toast.error(err instanceof Error ? err.message : 'CPA export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CPA Packet Export</CardTitle>
        <CardDescription>
          Generate a ZIP file with income forms, expenses, and a summary report
          for your tax preparer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="include-docs"
            checked={includeDocs}
            onCheckedChange={(checked) => setIncludeDocs(checked === true)}
          />
          <Label htmlFor="include-docs">Include decrypted documents</Label>
        </div>

        {includeDocs && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              Exported documents will be decrypted and included as plain files.
              Store the export securely and delete it after sharing with your
              CPA.
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={handleExport} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {loading ? 'Generating...' : 'Generate CPA Packet'}
        </Button>
      </CardContent>
    </Card>
  );
}

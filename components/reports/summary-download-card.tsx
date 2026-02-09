'use client';

import { useState } from 'react';
import { Printer, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Props = {
  year: number;
};

export function SummaryDownloadCard({ year }: Props) {
  const [downloading, setDownloading] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const params = new URLSearchParams({ year: String(year) });
      const res = await fetch(`/api/export/summary-html?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Download failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-summary-${year}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Summary download failed:', err);
      toast.error(err instanceof Error ? err.message : 'Summary download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Year-End Summary</CardTitle>
        <CardDescription>
          View, print, or download a standalone summary of your tax year data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="size-4" />
          Print Summary
        </Button>
        <Button variant="outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Download HTML
        </Button>
      </CardContent>
    </Card>
  );
}

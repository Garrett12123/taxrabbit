'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DocumentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const linkStatus = searchParams.get('linkStatus') ?? 'all';
  const fileType = searchParams.get('fileType') ?? 'all';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/documents?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={linkStatus}
        onValueChange={(v) => updateParam('linkStatus', v)}
      >
        <SelectTrigger className="w-[140px]" aria-label="Filter by link status">
          <SelectValue placeholder="Link Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Documents</SelectItem>
          <SelectItem value="linked">Linked</SelectItem>
          <SelectItem value="unlinked">Unlinked</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={fileType}
        onValueChange={(v) => updateParam('fileType', v)}
      >
        <SelectTrigger className="w-[140px]" aria-label="Filter by file type">
          <SelectValue placeholder="File Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="image">Image</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

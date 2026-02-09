'use client';

import { useState, useMemo } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Link2,
  Unlink,
  FileText,
  ImageIcon,
  Search,
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DocumentDeleteDialog } from '@/components/documents/document-delete-dialog';
import { DocumentEditDialog } from '@/components/documents/document-edit-dialog';
import { DocumentLinkDialog } from '@/components/documents/document-link-dialog';
import { DocumentPreview } from '@/components/documents/document-preview';
import type { DocumentFileDecrypted } from '@/server/db/dal/document-files';

type LinkableEntity = {
  id: string;
  label: string;
};

type DocumentTableProps = {
  documents: DocumentFileDecrypted[];
  incomeDocs: LinkableEntity[];
  expenses: LinkableEntity[];
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getLinkedLabel(
  doc: DocumentFileDecrypted,
  incomeDocs: LinkableEntity[],
  expenses: LinkableEntity[]
): string | null {
  if (!doc.linkedEntityType || !doc.linkedEntityId) return null;
  const list = doc.linkedEntityType === 'income' ? incomeDocs : expenses;
  const entity = list.find((e) => e.id === doc.linkedEntityId);
  return entity?.label ?? `${doc.linkedEntityType} (${doc.linkedEntityId.slice(0, 8)}...)`;
}

export function DocumentTable({
  documents,
  incomeDocs,
  expenses,
}: DocumentTableProps) {
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentFileDecrypted | null>(
    null
  );
  const [editDoc, setEditDoc] = useState<DocumentFileDecrypted | null>(null);
  const [linkDoc, setLinkDoc] = useState<DocumentFileDecrypted | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<{
    id: string;
    filename: string;
  } | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) =>
      d.payload.originalFilename.toLowerCase().includes(q)
    );
  }, [documents, search]);

  return (
    <>
      <div className="flex items-center gap-2 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename..."
            aria-label="Search documents by filename"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px]" />
            <TableHead>Filename</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Linked To</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((doc) => {
            const isPdf = doc.mimeType === 'application/pdf';
            const linkedLabel = getLinkedLabel(doc, incomeDocs, expenses);

            return (
              <TableRow key={doc.id}>
                <TableCell>
                  {isPdf ? (
                    <FileText className="size-5 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium max-w-[200px]">
                  <span className="truncate block">
                    {doc.payload.originalFilename}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {isPdf ? 'PDF' : doc.mimeType.split('/')[1]?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono tabular-nums">
                  {formatFileSize(doc.sizeBytes)}
                </TableCell>
                <TableCell>
                  {linkedLabel ? (
                    <Badge variant="secondary">{linkedLabel}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Unlinked
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(doc.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye className="size-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditDoc(doc)}>
                        <Pencil className="size-4" />
                        Edit Metadata
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLinkDoc(doc)}>
                        {doc.linkedEntityType ? (
                          <>
                            <Unlink className="size-4" />
                            Manage Link
                          </>
                        ) : (
                          <>
                            <Link2 className="size-4" />
                            Link
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setDeleteDoc({
                            id: doc.id,
                            filename: doc.payload.originalFilename,
                          })
                        }
                        className="text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {previewDoc && (
        <DocumentPreview
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          documentId={previewDoc.id}
          filename={previewDoc.payload.originalFilename}
        />
      )}

      {editDoc && (
        <DocumentEditDialog
          open={!!editDoc}
          onOpenChange={(open) => !open && setEditDoc(null)}
          documentId={editDoc.id}
          filename={editDoc.payload.originalFilename}
          description={editDoc.payload.description}
          tags={editDoc.payload.tags}
        />
      )}

      {linkDoc && (
        <DocumentLinkDialog
          open={!!linkDoc}
          onOpenChange={(open) => !open && setLinkDoc(null)}
          documentId={linkDoc.id}
          filename={linkDoc.payload.originalFilename}
          linkedEntityType={linkDoc.linkedEntityType}
          linkedEntityId={linkDoc.linkedEntityId}
          incomeDocs={incomeDocs}
          expenses={expenses}
        />
      )}

      {deleteDoc && (
        <DocumentDeleteDialog
          open={!!deleteDoc}
          onOpenChange={(open) => !open && setDeleteDoc(null)}
          documentId={deleteDoc.id}
          filename={deleteDoc.filename}
        />
      )}
    </>
  );
}

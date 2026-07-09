import type { ReactNode } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@/types/entity-config'
import type { Paginated } from '@/hooks/use-crud'
import { cn } from '@/lib/utils'

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data?: Paginated<T>
  isLoading: boolean
  isError: boolean
  page: number
  onPageChange: (page: number) => void
  rowActions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  emptyLabel?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading,
  isError,
  page,
  onPageChange,
  rowActions,
  onRowClick,
  emptyLabel = 'No records found',
}: DataTableProps<T>) {
  const rows = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
              {rowActions && <TableHead className="w-1 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} className="h-40 text-center">
                  <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Loading…
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} className="h-40 text-center">
                  <div className="text-destructive flex flex-col items-center justify-center gap-2 text-sm">
                    <AlertTriangle className="size-5" />
                    Failed to load data. Please try again.
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} className="h-40 text-center">
                  <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 text-sm">
                    <Inbox className="size-5" />
                    {emptyLabel}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              rows.map((row, idx) => (
                <TableRow
                  key={(row.id as string | number | undefined) ?? idx}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row) : renderCell(row[col.key])}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">{rowActions(row)}</div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-muted-foreground text-xs">
            Page {meta.current_page} of {meta.last_page} &middot; {meta.total} total
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= meta.last_page}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/
const MIDNIGHT_RE = /T00:00:00(\.0+)?Z?$/

function renderCell(value: unknown): ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
    const date = new Date(value)
    return value.includes('T') && !MIDNIGHT_RE.test(value) ? date.toLocaleString() : date.toLocaleDateString()
  }
  return String(value)
}

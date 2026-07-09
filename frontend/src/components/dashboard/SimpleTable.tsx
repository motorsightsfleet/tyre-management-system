import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export interface SimpleColumn<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface SimpleTableProps<T> {
  columns: SimpleColumn<T>[]
  rows: T[]
  emptyLabel?: string
  rowKey: (row: T, index: number) => string | number
}

export function SimpleTable<T extends object>({
  columns,
  rows,
  emptyLabel = 'No records found',
  rowKey,
}: SimpleTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 flex-col items-center justify-center gap-2 text-sm">
        <Inbox className="size-5" />
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={rowKey(row, idx)}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

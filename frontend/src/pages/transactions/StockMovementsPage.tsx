import { useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data/DataTable'
import { useCrudList } from '@/hooks/use-crud'
import type { ColumnDef } from '@/types/entity-config'

interface MovementRow {
  [key: string]: unknown
  id: number
  movement_type: string
  moved_at: string
  tyre?: { serial_number: string }
  from_warehouse?: { name: string } | null
  to_warehouse?: { name: string } | null
  vehicle?: { code: string } | null
  user?: { name: string } | null
}

const TYPE_VARIANT: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  receipt: 'success',
  install: 'success',
  remove: 'warning',
  transfer: 'secondary',
  rotate: 'secondary',
}

const columns: ColumnDef<MovementRow>[] = [
  { key: 'moved_at', header: 'When', render: (row) => new Date(row.moved_at).toLocaleString() },
  { key: 'tyre', header: 'Tyre', render: (row) => row.tyre?.serial_number ?? '—' },
  { key: 'movement_type', header: 'Type', render: (row) => <Badge variant={TYPE_VARIANT[row.movement_type] ?? 'secondary'}>{row.movement_type}</Badge> },
  { key: 'from', header: 'From', render: (row) => row.from_warehouse?.name ?? '—' },
  { key: 'to', header: 'To', render: (row) => row.to_warehouse?.name ?? row.vehicle?.code ?? '—' },
  { key: 'user', header: 'By', render: (row) => row.user?.name ?? 'System' },
]

export function StockMovementsPage({ title = 'Stock Movement' }: { title?: string }) {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useCrudList<MovementRow>('transactions/stock-movements', { page, per_page: 20 })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <Card>
        <CardContent className="pt-5">
          <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Search } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data/DataTable'
import { TyreDetailPanel } from '@/components/axle-view/TyreDetailPanel'
import { RemoveTyreDialog } from '@/components/axle-view/RemoveTyreDialog'
import { useCrudList } from '@/hooks/use-crud'
import type { ColumnDef } from '@/types/entity-config'

interface TyreRow {
  [key: string]: unknown
  id: number
  serial_number: string
  status: string
  tyre_brand?: { name: string }
  tyre_size?: { code: string }
  current_vehicle?: { code: string }
  current_warehouse?: { name: string }
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'secondary' | 'destructive' | 'default'> = {
  installed: 'success',
  in_stock: 'secondary',
  in_repair: 'warning',
  retreaded: 'default',
  scrapped: 'destructive',
  lost: 'destructive',
}

export function TyreHistoryPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [detailTyreId, setDetailTyreId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeTyreId, setRemoveTyreId] = useState<number | null>(null)

  const { data, isLoading, isError } = useCrudList<TyreRow>('master-data/tyres', { page, per_page: 15, search })

  const columns: ColumnDef<TyreRow>[] = [
    { key: 'serial_number', header: 'Serial Number' },
    { key: 'tyre_brand', header: 'Brand', render: (row) => row.tyre_brand?.name ?? '—' },
    { key: 'tyre_size', header: 'Size', render: (row) => row.tyre_size?.code ?? '—' },
    { key: 'location', header: 'Location', render: (row) => row.current_vehicle?.code ?? row.current_warehouse?.name ?? '—' },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={STATUS_VARIANT[row.status] ?? 'default'}>{row.status.replace('_', ' ')}</Badge> },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Tyre History</h1>
        <p className="text-muted-foreground text-sm">Click any tyre to see its complete lifecycle, inspections, repairs, and rotations.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input placeholder="Search serial / barcode..." className="pl-8" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            onPageChange={setPage}
            onRowClick={(row) => {
              setDetailTyreId(row.id)
              setDetailOpen(true)
            }}
          />
        </CardContent>
      </Card>

      <TyreDetailPanel
        tyreId={detailTyreId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRemove={(tyre) => {
          setRemoveTyreId(tyre.id)
          setDetailOpen(false)
          setRemoveOpen(true)
        }}
      />
      <RemoveTyreDialog open={removeOpen} onOpenChange={setRemoveOpen} tyreId={removeTyreId} onRemoved={() => {}} />
    </div>
  )
}

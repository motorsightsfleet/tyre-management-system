import { useState } from 'react'
import { Search } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/data/DataTable'
import { useCrudList } from '@/hooks/use-crud'
import type { ColumnDef } from '@/types/entity-config'

interface TyreRow {
  [key: string]: unknown
  id: number
  serial_number: string
  barcode_code: string | null
  status: string
  cost: string
  tyre_brand?: { name: string }
  tyre_pattern?: { name: string }
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

const columns: ColumnDef<TyreRow>[] = [
  { key: 'serial_number', header: 'Serial Number' },
  { key: 'tyre_brand', header: 'Brand', render: (row) => row.tyre_brand?.name ?? '—' },
  { key: 'tyre_pattern', header: 'Pattern', render: (row) => row.tyre_pattern?.name ?? '—' },
  { key: 'tyre_size', header: 'Size', render: (row) => row.tyre_size?.code ?? '—' },
  {
    key: 'location',
    header: 'Location',
    render: (row) => row.current_vehicle?.code ?? row.current_warehouse?.name ?? '—',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge variant={STATUS_VARIANT[row.status] ?? 'default'}>{row.status.replace('_', ' ')}</Badge>,
  },
]

export function TyresPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')

  const { data, isLoading, isError } = useCrudList<TyreRow>('master-data/tyres', {
    page,
    per_page: 15,
    search,
    status: status === 'all' ? undefined : status,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Tyre</h1>
        <p className="text-muted-foreground text-sm">
          Browse the full tyre fleet. Tyres enter the system via Purchase / Goods Receipt / Initial Stock and move
          through Transactions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search serial / barcode..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="installed">Installed</SelectItem>
                <SelectItem value="in_repair">In Repair</SelectItem>
                <SelectItem value="retreaded">Retreaded</SelectItem>
                <SelectItem value="scrapped">Scrapped</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  )
}

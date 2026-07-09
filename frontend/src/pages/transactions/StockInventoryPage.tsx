import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/data/DataTable'
import { apiClient } from '@/lib/api-client'
import { useCrudList } from '@/hooks/use-crud'
import type { ColumnDef } from '@/types/entity-config'

interface TyreRow {
  [key: string]: unknown
  id: number
  serial_number: string
  cost: string
  tyre_brand?: { name: string }
  tyre_size?: { code: string }
  current_warehouse?: { name: string }
}

interface Summary {
  total_in_stock: number
  by_warehouse: { warehouse: string; total: number }[]
  by_brand: { brand: string; total: number }[]
}

const columns: ColumnDef<TyreRow>[] = [
  { key: 'serial_number', header: 'Serial Number' },
  { key: 'tyre_brand', header: 'Brand', render: (row) => row.tyre_brand?.name ?? '—' },
  { key: 'tyre_size', header: 'Size', render: (row) => row.tyre_size?.code ?? '—' },
  { key: 'current_warehouse', header: 'Warehouse', render: (row) => row.current_warehouse?.name ?? '—' },
  { key: 'cost', header: 'Cost', render: (row) => `Rp ${Number(row.cost).toLocaleString()}` },
]

export function StockInventoryPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data: summary } = useQuery<Summary>({
    queryKey: ['transactions/stock-inventory/summary'],
    queryFn: async () => (await apiClient.get('/transactions/stock-inventory/summary')).data.data,
  })

  const { data, isLoading, isError } = useCrudList<TyreRow>('transactions/stock-inventory', { page, per_page: 15, search })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Stock Inventory</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total In Stock</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary?.total_in_stock ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By Warehouse</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {summary?.by_warehouse.map((w) => (
              <div key={w.warehouse} className="flex justify-between">
                <span className="text-muted-foreground">{w.warehouse}</span>
                <span className="font-medium">{w.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By Brand</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {summary?.by_brand.map((b) => (
              <div key={b.brand} className="flex justify-between">
                <span className="text-muted-foreground">{b.brand}</span>
                <span className="font-medium">{b.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input placeholder="Search serial..." className="pl-8" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  )
}

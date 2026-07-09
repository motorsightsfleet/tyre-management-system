import { useState } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data/DataTable'
import { useCrudList } from '@/hooks/use-crud'
import type { ColumnDef } from '@/types/entity-config'

interface AuditLogRow {
  [key: string]: unknown
  id: number
  action: string
  auditable_type: string
  auditable_id: number
  created_at: string
  user?: { name: string } | null
}

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  created: 'success',
  updated: 'warning',
  deleted: 'destructive',
}

function modelName(fqcn: string) {
  return fqcn.split('\\').pop() ?? fqcn
}

const columns: ColumnDef<AuditLogRow>[] = [
  { key: 'created_at', header: 'When', render: (row) => new Date(row.created_at).toLocaleString() },
  { key: 'user', header: 'User', render: (row) => row.user?.name ?? 'System' },
  { key: 'action', header: 'Action', render: (row) => <Badge variant={ACTION_VARIANT[row.action] ?? 'default'}>{row.action}</Badge> },
  { key: 'auditable_type', header: 'Entity', render: (row) => modelName(row.auditable_type) },
  { key: 'auditable_id', header: 'Record ID' },
]

export function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useCrudList<AuditLogRow>('settings/audit-logs', {
    page,
    per_page: 20,
    auditable_type: search || undefined,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground text-sm">Every create/update/delete across the system, who did it, and when.</p>
      </div>
      <Card>
        <CardHeader>
          <Input
            placeholder="Filter by entity, e.g. App\Models\Tyre"
            className="max-w-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  )
}

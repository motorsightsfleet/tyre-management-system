import { useState } from 'react'
import { Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data/DataTable'
import { EntityForm } from '@/components/data/EntityForm'
import { useCrudList, useCrudCreate } from '@/hooks/use-crud'
import { useAuthStore } from '@/stores/auth-store'
import type { EntityConfig } from '@/types/entity-config'

/**
 * Like CrudPage, but for append-only transaction records: list + create
 * only (no edit/delete — these are immutable business events).
 */
export function CreateListPage({
  config,
  permission,
  extraParams,
  fixedValues,
}: {
  config: EntityConfig
  permission: string
  extraParams?: Record<string, string>
  /** Merged into every created record's payload (e.g. { type: 'daily' }) */
  fixedValues?: Record<string, unknown>
}) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const canManage = useAuthStore((s) => s.hasPermission(permission))

  const { data, isLoading, isError } = useCrudList(config.resource, { page, per_page: 15, search, ...extraParams })
  const createMutation = useCrudCreate(config.resource, { label: config.title })

  function handleSubmit(values: Record<string, unknown>) {
    createMutation.mutate({ ...values, ...fixedValues }, { onSuccess: () => setDialogOpen(false) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{config.title}</h1>
        {config.description && <p className="text-muted-foreground text-sm">{config.description}</p>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                placeholder={config.searchPlaceholder ?? 'Search...'}
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            {canManage && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                Add {config.title}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={config.columns} data={data} isLoading={isLoading} isError={isError} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {config.title}</DialogTitle>
          </DialogHeader>
          <EntityForm config={config} onSubmit={handleSubmit} onCancel={() => setDialogOpen(false)} isSubmitting={createMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

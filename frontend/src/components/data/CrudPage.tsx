import { useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data/DataTable'
import { EntityForm } from '@/components/data/EntityForm'
import { ConfirmDialog } from '@/components/data/ConfirmDialog'
import { useCrudList, useCrudCreate, useCrudUpdate, useCrudDelete } from '@/hooks/use-crud'
import { useAuthStore } from '@/stores/auth-store'
import type { EntityConfig } from '@/types/entity-config'

export function CrudPage({ config }: { config: EntityConfig }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [deleting, setDeleting] = useState<Record<string, unknown> | null>(null)

  const canManage = useAuthStore((s) => s.hasPermission('master.manage') || s.hasPermission('settings.manage'))

  const { data, isLoading, isError } = useCrudList(config.resource, { page, per_page: 15, search })
  const createMutation = useCrudCreate(config.resource, { label: config.title })
  const updateMutation = useCrudUpdate(config.resource, { label: config.title })
  const deleteMutation = useCrudDelete(config.resource, { label: config.title })

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row)
    setDialogOpen(true)
  }

  function handleSubmit(values: Record<string, unknown>) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id as number, payload: values },
        { onSuccess: () => setDialogOpen(false) }
      )
    } else {
      createMutation.mutate(values, { onSuccess: () => setDialogOpen(false) })
    }
  }

  function handleDelete() {
    if (!deleting) return
    deleteMutation.mutate(deleting.id as number, { onSuccess: () => setDeleting(null) })
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
                placeholder={config.searchPlaceholder ?? `Search ${config.title.toLowerCase()}...`}
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            {canManage && (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add {config.title}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={config.columns}
            data={data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            onPageChange={setPage}
            rowActions={
              canManage
                ? (row) => (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(row)}
                        aria-label="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${config.title}` : `Add ${config.title}`}</DialogTitle>
          </DialogHeader>
          <EntityForm
            config={config}
            defaultValues={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${config.title}?`}
        description="This will be removed from active lists but can be restored later if needed."
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data/DataTable'
import { ConfirmDialog } from '@/components/data/ConfirmDialog'
import { apiClient } from '@/lib/api-client'
import { extractError } from '@/hooks/use-crud'
import type { ColumnDef } from '@/types/entity-config'

interface RoleRow {
  [key: string]: unknown
  id: number
  name: string
  permissions: { id: number; name: string }[]
}

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  permissions: z.array(z.string()).default([]),
})

type RoleFormValues = z.infer<typeof roleSchema>

const columns: ColumnDef<RoleRow>[] = [
  { key: 'name', header: 'Role' },
  { key: 'permissions', header: 'Permissions', render: (row) => `${row.permissions.length} granted` },
]

function RoleForm({
  defaultValues,
  allPermissions,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  defaultValues?: Partial<RoleFormValues>
  allPermissions: string[]
  onSubmit: (values: RoleFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormValues>({ resolver: zodResolver(roleSchema as never), defaultValues: { permissions: [], ...defaultValues } })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Role Name *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label>Permissions</Label>
        <Controller
          control={control}
          name="permissions"
          render={({ field: { value, onChange } }) => (
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
              {allPermissions.map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={value.includes(perm)}
                    onCheckedChange={(checked) =>
                      onChange(checked ? [...value, perm] : value.filter((p) => p !== perm))
                    }
                  />
                  {perm}
                </label>
              ))}
            </div>
          )}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RolesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoleRow | null>(null)
  const [deleting, setDeleting] = useState<RoleRow | null>(null)

  const { data: roles, isLoading, isError } = useQuery<RoleRow[]>({
    queryKey: ['settings/roles'],
    queryFn: async () => (await apiClient.get('/settings/roles')).data.data,
  })

  const { data: allPermissions } = useQuery<string[]>({
    queryKey: ['settings/roles/permissions'],
    queryFn: async () => (await apiClient.get('/settings/roles/permissions')).data.data,
  })

  const createMutation = useMutation({
    mutationFn: async (values: RoleFormValues) => (await apiClient.post('/settings/roles', values)).data,
    onSuccess: () => {
      toast.success('Role created')
      queryClient.invalidateQueries({ queryKey: ['settings/roles'] })
      setDialogOpen(false)
    },
    onError: (error) => toast.error(extractError(error)),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: RoleFormValues }) =>
      (await apiClient.put(`/settings/roles/${id}`, values)).data,
    onSuccess: () => {
      toast.success('Role updated')
      queryClient.invalidateQueries({ queryKey: ['settings/roles'] })
      setDialogOpen(false)
    },
    onError: (error) => toast.error(extractError(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await apiClient.delete(`/settings/roles/${id}`)).data,
    onSuccess: () => {
      toast.success('Role deleted')
      queryClient.invalidateQueries({ queryKey: ['settings/roles'] })
      setDeleting(null)
    },
    onError: (error) => toast.error(extractError(error)),
  })

  function handleSubmit(values: RoleFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values })
    } else {
      createMutation.mutate(values)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Roles & Permissions</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="size-4" />
              Add Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={roles ? { data: roles, meta: { current_page: 1, last_page: 1, per_page: roles.length, total: roles.length } } : undefined}
            isLoading={isLoading}
            isError={isError}
            page={1}
            onPageChange={() => {}}
            rowActions={(row) => (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit"
                  onClick={() => {
                    setEditing({ ...row, permissions: row.permissions })
                    setDialogOpen(true)
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleting(row)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Role' : 'Add Role'}</DialogTitle>
          </DialogHeader>
          <RoleForm
            defaultValues={editing ? { name: editing.name, permissions: editing.permissions.map((p) => p.name) } : undefined}
            allPermissions={allPermissions ?? []}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Delete role?"
        description={deleting ? `Users assigned to "${deleting.name}" will lose its permissions.` : undefined}
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

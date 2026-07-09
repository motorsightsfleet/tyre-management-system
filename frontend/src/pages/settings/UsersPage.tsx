import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data/DataTable'
import { ConfirmDialog } from '@/components/data/ConfirmDialog'
import { apiClient } from '@/lib/api-client'
import { useCrudCreate, useCrudDelete, useCrudList, useCrudUpdate } from '@/hooks/use-crud'
import type { ColumnDef } from '@/types/entity-config'

interface UserRow {
  [key: string]: unknown
  id: number
  name: string
  email: string
  phone: string | null
  is_active: boolean
  roles: string[]
}

interface Role {
  id: number
  name: string
}

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().nullable(),
  password: z.string().optional(),
  is_active: z.boolean(),
  roles: z.array(z.string()).default([]),
})

type UserFormValues = z.infer<typeof userSchema>

const columns: ColumnDef<UserRow>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  {
    key: 'roles',
    header: 'Roles',
    render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.roles.map((r) => (
          <Badge key={r} variant="secondary">
            {r}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    key: 'is_active',
    header: 'Status',
    render: (row) => <Badge variant={row.is_active ? 'success' : 'secondary'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
  },
]

function UserForm({
  defaultValues,
  roles,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  defaultValues?: Partial<UserFormValues>
  roles: Role[]
  onSubmit: (values: UserFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema as never),
    defaultValues: { is_active: true, roles: [], ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register('phone')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password {defaultValues ? '(leave blank to keep)' : '*'}</Label>
          <Input id="password" type="password" {...register('password')} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Roles</Label>
          <Controller
            control={control}
            name="roles"
            render={({ field: { value, onChange } }) => (
              <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={value.includes(role.name)}
                      onCheckedChange={(checked) =>
                        onChange(checked ? [...value, role.name] : value.filter((r) => r !== role.name))
                      }
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            )}
          />
        </div>
        <Controller
          control={control}
          name="is_active"
          render={({ field: { value, onChange } }) => (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox checked={value} onCheckedChange={onChange} />
              Active
            </label>
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

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState<UserRow | null>(null)

  const { data, isLoading, isError } = useCrudList<UserRow>('settings/users', { page, per_page: 15, search })
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['settings/roles', 'all'],
    queryFn: async () => (await apiClient.get('/settings/roles')).data.data,
  })

  const createMutation = useCrudCreate('settings/users', { label: 'User' })
  const updateMutation = useCrudUpdate('settings/users', { label: 'User' })
  const deleteMutation = useCrudDelete('settings/users', { label: 'User' })

  useEffect(() => {
    if (!dialogOpen) setEditing(null)
  }, [dialogOpen])

  function handleSubmit(values: UserFormValues) {
    const payload = { ...values, password: values.password || undefined }
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) })
    } else {
      createMutation.mutate(payload, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Users</h1>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="size-4" />
              Add User
            </Button>
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
            rowActions={(row) => (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit"
                  onClick={() => {
                    setEditing(row)
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <UserForm
            defaultValues={editing ?? undefined}
            roles={roles ?? []}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Delete user?"
        description={deleting ? `${deleting.name} will lose access immediately.` : undefined}
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

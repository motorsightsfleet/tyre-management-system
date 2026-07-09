import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data/DataTable'
import { useCrudAll, useCrudList, extractError } from '@/hooks/use-crud'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import type { ColumnDef } from '@/types/entity-config'

interface POItem {
  tyre_brand_id: string
  tyre_size_id: string
  tyre_type_id: string
  quantity: string
  unit_price: string
}
interface FormValues {
  supplier_id: string
  warehouse_id: string
  order_date: string
  expected_date: string
  notes: string
  items: POItem[]
}

interface PORow {
  [key: string]: unknown
  id: number
  code: string
  status: string
  order_date: string
  total_amount: string
  supplier?: { name: string }
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  received: 'success',
  partially_received: 'warning',
  approved: 'secondary',
  submitted: 'secondary',
  draft: 'secondary',
  cancelled: 'destructive',
}

const columns: ColumnDef<PORow>[] = [
  { key: 'code', header: 'Code' },
  { key: 'supplier', header: 'Supplier', render: (row) => row.supplier?.name ?? '—' },
  { key: 'order_date', header: 'Order Date', render: (row) => new Date(row.order_date).toLocaleDateString() },
  { key: 'total_amount', header: 'Total', render: (row) => `Rp ${Number(row.total_amount).toLocaleString()}` },
  { key: 'status', header: 'Status', render: (row) => <Badge variant={STATUS_VARIANT[row.status] ?? 'secondary'}>{row.status.replace('_', ' ')}</Badge> },
]

export function PurchaseOrdersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const canManage = useAuthStore((s) => s.hasPermission('transaction.procurement.manage'))

  const { data, isLoading, isError } = useCrudList<PORow>('transactions/purchase-orders', { page, per_page: 15, search })
  const { data: suppliers } = useCrudAll<{ id: number; name: string }>('master-data/suppliers', { status: 'active' })
  const { data: warehouses } = useCrudAll<{ id: number; name: string }>('master-data/warehouses', { status: 'active' })
  const { data: brands } = useCrudAll<{ id: number; name: string }>('master-data/tyre-brands', { status: 'active' })
  const { data: sizes } = useCrudAll<{ id: number; code: string }>('master-data/tyre-sizes', { status: 'active' })
  const { data: types } = useCrudAll<{ id: number; name: string }>('master-data/tyre-types', { status: 'active' })

  const { control, register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { items: [{ tyre_brand_id: '', tyre_size_id: '', tyre_type_id: '', quantity: '1', unit_price: '0' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      (
        await apiClient.post('/transactions/purchase-orders', {
          supplier_id: Number(values.supplier_id),
          warehouse_id: values.warehouse_id ? Number(values.warehouse_id) : null,
          order_date: values.order_date,
          expected_date: values.expected_date || null,
          notes: values.notes || null,
          items: values.items.map((i) => ({
            tyre_brand_id: Number(i.tyre_brand_id),
            tyre_size_id: Number(i.tyre_size_id),
            tyre_type_id: Number(i.tyre_type_id),
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
          })),
        })
      ).data,
    onSuccess: () => {
      toast.success('Purchase order created')
      queryClient.invalidateQueries({ queryKey: ['transactions/purchase-orders'] })
      setDialogOpen(false)
      reset()
    },
    onError: (error) => toast.error(extractError(error)),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Purchase Tyre</h1>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input placeholder="Search PO code..." className="pl-8" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
            {canManage && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                New Purchase Order
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>Supplier *</Label>
                <Controller
                  control={control}
                  name="supplier_id"
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select value={value} onValueChange={onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Warehouse</Label>
                <Controller
                  control={control}
                  name="warehouse_id"
                  render={({ field: { value, onChange } }) => (
                    <Select value={value} onValueChange={onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses?.map((w) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Order Date *</Label>
                <Input type="date" {...register('order_date', { required: true })} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ tyre_brand_id: '', tyre_size_id: '', tyre_type_id: '', quantity: '1', unit_price: '0' })}
                >
                  <Plus className="size-3.5" /> Add Item
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_70px_100px_auto] items-end gap-2 rounded-md border p-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Brand</Label>
                      <Controller
                        control={control}
                        name={`items.${index}.tyre_brand_id`}
                        render={({ field: { value, onChange } }) => (
                          <Select value={value} onValueChange={onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Brand" />
                            </SelectTrigger>
                            <SelectContent>
                              {brands?.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Size</Label>
                      <Controller
                        control={control}
                        name={`items.${index}.tyre_size_id`}
                        render={({ field: { value, onChange } }) => (
                          <Select value={value} onValueChange={onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                              {sizes?.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                  {s.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Type</Label>
                      <Controller
                        control={control}
                        name={`items.${index}.tyre_type_id`}
                        render={({ field: { value, onChange } }) => (
                          <Select value={value} onValueChange={onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {types?.map((t) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" {...register(`items.${index}.quantity`)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Unit Price</Label>
                      <Input type="number" {...register(`items.${index}.unit_price`)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Create Purchase Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

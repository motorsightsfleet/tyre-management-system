import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DataTable } from '@/components/data/DataTable'
import { useCrudAll, useCrudList, extractError } from '@/hooks/use-crud'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import type { ColumnDef } from '@/types/entity-config'

interface GRRow {
  [key: string]: unknown
  id: number
  code: string
  receipt_date: string
  purchase_order?: { code: string }
  warehouse?: { name: string }
  items?: unknown[]
}

interface POOption {
  id: number
  code: string
  warehouse_id: number | null
  items: { id: number; tyre_brand_id: number; tyre_size_id: number; tyre_type_id: number; quantity: number; received_quantity: number }[]
}

interface ItemRow {
  purchase_order_item_id: string
  serial_number: string
  cost: string
}
interface FormValues {
  purchase_order_id: string
  warehouse_id: string
  receipt_date: string
  items: ItemRow[]
}

const columns: ColumnDef<GRRow>[] = [
  { key: 'code', header: 'Code' },
  { key: 'purchase_order', header: 'Purchase Order', render: (row) => row.purchase_order?.code ?? '—' },
  { key: 'warehouse', header: 'Warehouse', render: (row) => row.warehouse?.name ?? '—' },
  { key: 'receipt_date', header: 'Receipt Date' },
  { key: 'items', header: 'Items Received', render: (row) => row.items?.length ?? 0 },
]

export function GoodsReceiptsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const canManage = useAuthStore((s) => s.hasPermission('transaction.procurement.manage'))

  const { data, isLoading, isError } = useCrudList<GRRow>('transactions/goods-receipts', { page, per_page: 15, search })
  const { data: warehouses } = useCrudAll<{ id: number; name: string }>('master-data/warehouses', { status: 'active' })
  const { data: purchaseOrders } = useQuery<POOption[]>({
    queryKey: ['transactions/purchase-orders', 'all-for-receipt'],
    queryFn: async () => (await apiClient.get('/transactions/purchase-orders', { params: { per_page: 100 } })).data.data,
  })

  const { control, register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { items: [{ purchase_order_item_id: '', serial_number: '', cost: '0' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const selectedPoId = watch('purchase_order_id')
  const selectedPo = purchaseOrders?.find((po) => String(po.id) === selectedPoId)

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      (
        await apiClient.post('/transactions/goods-receipts', {
          purchase_order_id: values.purchase_order_id ? Number(values.purchase_order_id) : null,
          warehouse_id: Number(values.warehouse_id),
          receipt_date: values.receipt_date,
          items: values.items.map((i) => ({
            purchase_order_item_id: i.purchase_order_item_id ? Number(i.purchase_order_item_id) : null,
            serial_number: i.serial_number,
            cost: Number(i.cost),
          })),
        })
      ).data,
    onSuccess: () => {
      toast.success('Goods receipt recorded')
      queryClient.invalidateQueries({ queryKey: ['transactions/goods-receipts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions/purchase-orders'] })
      setDialogOpen(false)
      reset()
    },
    onError: (error) => toast.error(extractError(error)),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Goods Receipt</h1>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input placeholder="Search code..." className="pl-8" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
            {canManage && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                New Goods Receipt
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
            <DialogTitle>New Goods Receipt</DialogTitle>
            <DialogDescription>Record tyres physically received, optionally against a Purchase Order.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>Purchase Order</Label>
                <Controller
                  control={control}
                  name="purchase_order_id"
                  render={({ field: { value, onChange } }) => (
                    <Select value={value} onValueChange={onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None (manual entry)" />
                      </SelectTrigger>
                      <SelectContent>
                        {purchaseOrders?.map((po) => (
                          <SelectItem key={po.id} value={String(po.id)}>
                            {po.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Warehouse *</Label>
                <Controller
                  control={control}
                  name="warehouse_id"
                  rules={{ required: true }}
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
                <Label>Receipt Date *</Label>
                <Input type="date" {...register('receipt_date', { required: true })} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Items Received</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ purchase_order_item_id: '', serial_number: '', cost: '0' })}>
                  <Plus className="size-3.5" /> Add Item
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_100px_auto] items-end gap-2 rounded-md border p-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">PO Line Item</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.purchase_order_item_id`}
                      render={({ field: { value, onChange } }) => (
                        <Select value={value} onValueChange={onChange} disabled={!selectedPo}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={selectedPo ? 'Select line' : 'Select PO first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedPo?.items.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                #{item.id} ({item.received_quantity}/{item.quantity} received)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Serial Number</Label>
                    <Input {...register(`items.${index}.serial_number`, { required: true })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Cost</Label>
                    <Input type="number" {...register(`items.${index}.cost`)} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Record Receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Loader2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data/DataTable'
import { useCrudAll, useCrudList, extractError } from '@/hooks/use-crud'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import type { ColumnDef } from '@/types/entity-config'

interface TransferRow {
  [key: string]: unknown
  id: number
  code: string
  status: string
  transfer_date: string
  from_warehouse?: { name: string }
  to_warehouse?: { name: string }
}

interface FormValues {
  from_warehouse_id: string
  to_warehouse_id: string
  transfer_date: string
  notes: string
}

const columns: ColumnDef<TransferRow>[] = [
  { key: 'code', header: 'Code' },
  { key: 'from_warehouse', header: 'From', render: (row) => row.from_warehouse?.name ?? '—' },
  { key: 'to_warehouse', header: 'To', render: (row) => row.to_warehouse?.name ?? '—' },
  { key: 'transfer_date', header: 'Date' },
  { key: 'status', header: 'Status' },
]

export function StockTransfersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTyres, setSelectedTyres] = useState<number[]>([])
  const queryClient = useQueryClient()

  const canManage = useAuthStore((s) => s.hasPermission('transaction.warehouse.manage'))

  const { data, isLoading, isError } = useCrudList<TransferRow>('transactions/stock-transfers', { page, per_page: 15, search })
  const { data: warehouses } = useCrudAll<{ id: number; name: string }>('master-data/warehouses', { status: 'active' })

  const { control, register, handleSubmit, reset, watch } = useForm<FormValues>()
  const fromWarehouseId = watch('from_warehouse_id')

  const { data: availableTyres } = useCrudAll<{ id: number; serial_number: string }>('master-data/tyres', {
    status: 'in_stock',
    current_warehouse_id: fromWarehouseId,
  })

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      (
        await apiClient.post('/transactions/stock-transfers', {
          from_warehouse_id: Number(values.from_warehouse_id),
          to_warehouse_id: Number(values.to_warehouse_id),
          transfer_date: values.transfer_date,
          notes: values.notes || null,
          tyre_ids: selectedTyres,
        })
      ).data,
    onSuccess: () => {
      toast.success('Stock transfer completed')
      queryClient.invalidateQueries({ queryKey: ['transactions/stock-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['master-data/tyres'] })
      setDialogOpen(false)
      setSelectedTyres([])
      reset()
    },
    onError: (error) => toast.error(extractError(error)),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Stock Transfer</h1>
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
                New Transfer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Stock Transfer</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((v) => createMutation.mutate(v))}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>From Warehouse *</Label>
                <Controller
                  control={control}
                  name="from_warehouse_id"
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      value={value}
                      onValueChange={(v) => {
                        onChange(v)
                        setSelectedTyres([])
                      }}
                    >
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
                <Label>To Warehouse *</Label>
                <Controller
                  control={control}
                  name="to_warehouse_id"
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select value={value} onValueChange={onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses?.filter((w) => String(w.id) !== fromWarehouseId).map((w) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Transfer Date *</Label>
              <Input type="date" {...register('transfer_date', { required: true })} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tyres to Transfer {fromWarehouseId && `(${availableTyres?.length ?? 0} available)`}</Label>
              <div className="max-h-48 overflow-y-auto rounded-md border">
                {!fromWarehouseId && <p className="text-muted-foreground p-3 text-sm">Select a source warehouse first.</p>}
                {availableTyres?.map((tyre) => (
                  <label key={tyre.id} className="hover:bg-muted flex items-center gap-2 border-b p-2 text-sm last:border-b-0">
                    <Checkbox
                      checked={selectedTyres.includes(tyre.id)}
                      onCheckedChange={(checked) =>
                        setSelectedTyres((prev) => (checked ? [...prev, tyre.id] : prev.filter((id) => id !== tyre.id)))
                      }
                    />
                    {tyre.serial_number}
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || selectedTyres.length === 0}>
                {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Transfer {selectedTyres.length > 0 ? `(${selectedTyres.length})` : ''}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

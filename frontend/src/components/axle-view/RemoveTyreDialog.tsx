import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCrudAll, extractError } from '@/hooks/use-crud'
import { apiClient } from '@/lib/api-client'

interface FormValues {
  warehouse_id: string
  removal_reason_id: string
  notes: string
}

export function RemoveTyreDialog({
  open,
  onOpenChange,
  tyreId,
  onRemoved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tyreId: number | null
  onRemoved: () => void
}) {
  const queryClient = useQueryClient()
  const { control, register, handleSubmit, reset } = useForm<FormValues>()
  const { data: warehouses } = useCrudAll<{ id: number; name: string }>('master-data/warehouses', { status: 'active' })
  const { data: reasons } = useCrudAll<{ id: number; name: string }>('master-data/removal-reasons', { status: 'active' })
  const [submitting, setSubmitting] = useState(false)

  const removeMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      (
        await apiClient.post('/transactions/tyre-installations/remove', {
          tyre_id: tyreId,
          warehouse_id: Number(values.warehouse_id),
          removal_reason_id: values.removal_reason_id ? Number(values.removal_reason_id) : null,
          notes: values.notes || null,
        })
      ).data,
    onSuccess: () => {
      toast.success('Tyre removed')
      queryClient.invalidateQueries({ queryKey: ['transactions/vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['master-data/tyres'] })
      reset()
      onOpenChange(false)
      onRemoved()
    },
    onError: (error) => toast.error(extractError(error)),
    onSettled: () => setSubmitting(false),
  })

  function onSubmit(values: FormValues) {
    setSubmitting(true)
    removeMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove tyre</DialogTitle>
          <DialogDescription>The tyre returns to warehouse stock with status "In Stock".</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Destination Warehouse *</Label>
            <Controller
              control={control}
              name="warehouse_id"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select warehouse" />
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
            <Label>Removal Reason</Label>
            <Controller
              control={control}
              name="removal_reason_id"
              render={({ field: { value, onChange } }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasons?.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Remove Tyre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

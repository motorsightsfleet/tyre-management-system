import { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { BarcodeScanner } from '@/components/axle-view/BarcodeScanner'
import { useCrudList, extractError } from '@/hooks/use-crud'
import { apiClient } from '@/lib/api-client'
import type { AxlePosition } from '@/types/axle-view'

interface TyreOption {
  id: number
  serial_number: string
  barcode_code: string | null
  tyre_brand?: { name: string }
  tyre_size?: { code: string }
}

export function InstallTyreDialog({
  open,
  onOpenChange,
  vehicleId,
  position,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId: number
  position: AxlePosition | null
}) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useCrudList<TyreOption>('master-data/tyres', {
    status: 'in_stock',
    search,
    per_page: 20,
  })

  const installMutation = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post('/transactions/tyre-installations/install', {
          tyre_id: selectedId,
          vehicle_id: vehicleId,
          tyre_position_id: position?.tyre_position_id,
        })
      ).data,
    onSuccess: () => {
      toast.success('Tyre installed')
      queryClient.invalidateQueries({ queryKey: ['transactions/vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['master-data/tyres'] })
      onOpenChange(false)
      setSelectedId(null)
    },
    onError: (error) => toast.error(extractError(error)),
  })

  async function handleScan(code: string) {
    try {
      const res = await apiClient.get('/master-data/tyres/lookup', { params: { code } })
      setSelectedId(res.data.data.id)
      toast.success(`Found tyre ${res.data.data.serial_number}`)
    } catch {
      toast.error('No tyre found for that code')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install tyre — {position?.code}</DialogTitle>
          <DialogDescription>Pick a tyre from warehouse stock, or scan its barcode.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <BarcodeScanner onDetected={handleScan} />

          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input placeholder="Search serial / barcode..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-md border">
            {isLoading && (
              <div className="flex justify-center p-4">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
              </div>
            )}
            {!isLoading && data?.data.length === 0 && <p className="text-muted-foreground p-4 text-center text-sm">No tyres in stock.</p>}
            <RadioGroup value={selectedId ? String(selectedId) : ''} onValueChange={(v) => setSelectedId(Number(v))}>
              {data?.data.map((tyre) => (
                <Label
                  key={tyre.id}
                  htmlFor={`tyre-${tyre.id}`}
                  className="hover:bg-muted flex cursor-pointer items-center gap-3 border-b p-3 text-sm last:border-b-0"
                >
                  <RadioGroupItem value={String(tyre.id)} id={`tyre-${tyre.id}`} />
                  <div className="flex flex-col">
                    <span className="font-medium">{tyre.serial_number}</span>
                    <span className="text-muted-foreground text-xs">
                      {tyre.tyre_brand?.name} · {tyre.tyre_size?.code}
                    </span>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!selectedId || installMutation.isPending} onClick={() => installMutation.mutate()}>
            {installMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Install
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Truck } from 'lucide-react'

import { apiClient } from '@/lib/api-client'
import { extractError, useCrudAll } from '@/hooks/use-crud'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AxleSchematic } from '@/components/axle-view/AxleSchematic'
import { HealthLegend } from '@/components/axle-view/HealthLegend'
import { TyreDetailPanel } from '@/components/axle-view/TyreDetailPanel'
import { InstallTyreDialog } from '@/components/axle-view/InstallTyreDialog'
import { RemoveTyreDialog } from '@/components/axle-view/RemoveTyreDialog'
import type { AxlePosition, AxleViewResponse } from '@/types/axle-view'

interface VehicleOption {
  id: number
  code: string
  plate_number: string | null
  vehicle_model?: { name: string }
}

export function AxleViewPage() {
  const [vehicleId, setVehicleId] = useState<number | null>(null)
  const [detailTyreId, setDetailTyreId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [installPosition, setInstallPosition] = useState<AxlePosition | null>(null)
  const [installOpen, setInstallOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeTyreId, setRemoveTyreId] = useState<number | null>(null)

  const queryClient = useQueryClient()

  const { data: vehicles } = useCrudAll<VehicleOption>('master-data/vehicles', { status: 'active' })

  const { data, isLoading } = useQuery<AxleViewResponse>({
    queryKey: ['transactions/vehicles', vehicleId, 'axle-view'],
    queryFn: async () => (await apiClient.get(`/transactions/vehicles/${vehicleId}/axle-view`)).data.data,
    enabled: vehicleId !== null,
  })

  function invalidateAxleView() {
    queryClient.invalidateQueries({ queryKey: ['transactions/vehicles', vehicleId, 'axle-view'] })
  }

  function handlePositionClick(position: AxlePosition) {
    if (position.tyre) {
      setDetailTyreId(position.tyre.id)
      setDetailOpen(true)
    } else if (vehicleId) {
      setInstallPosition(position)
      setInstallOpen(true)
    }
  }

  async function handleSwap(fromPositionId: number, toPositionId: number) {
    if (!data || !vehicleId) return
    const fromPos = data.positions.find((p) => p.tyre_position_id === fromPositionId)
    const toPos = data.positions.find((p) => p.tyre_position_id === toPositionId)
    if (!fromPos?.tyre) return

    const moves = [{ tyre_id: fromPos.tyre.id, vehicle_id: vehicleId, tyre_position_id: toPositionId }]
    if (toPos?.tyre) {
      moves.push({ tyre_id: toPos.tyre.id, vehicle_id: vehicleId, tyre_position_id: fromPositionId })
    }

    try {
      await apiClient.post('/transactions/tyre-installations/rotate', { moves })
      toast.success(toPos?.tyre ? 'Tyres swapped' : 'Tyre moved')
      invalidateAxleView()
    } catch (error) {
      toast.error(extractError(error))
    }
  }

  function handleRemoveFromPanel(tyre: { id: number }) {
    setRemoveTyreId(tyre.id)
    setDetailOpen(false)
    setRemoveOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Interactive Axle View</h1>
        <p className="text-muted-foreground text-sm">
          Select a vehicle, click a position to inspect or install a tyre, or drag tyres between positions to rotate/swap.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="text-muted-foreground size-4" />
            <Select value={vehicleId ? String(vehicleId) : undefined} onValueChange={(v) => setVehicleId(Number(v))}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select a vehicle..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.code} {v.plate_number ? `(${v.plate_number})` : ''} — {v.vehicle_model?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!vehicleId && <p className="text-muted-foreground py-12 text-center text-sm">Choose a vehicle to view its axle layout.</p>}

          {vehicleId && isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          )}

          {vehicleId && data && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex flex-col items-center gap-4">
                <AxleSchematic positions={data.positions} onPositionClick={handlePositionClick} onSwap={handleSwap} />
                <HealthLegend />
              </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-semibold">{data.vehicle.code}</p>
                  <p className="text-muted-foreground">{data.vehicle.vehicle_model?.name}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Axle Config</span>
                      <p className="font-medium">{data.vehicle.axle_configuration?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Odometer</span>
                      <p className="font-medium">{data.vehicle.odometer_km.toLocaleString()} km</p>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Click an empty slot to install a tyre from stock. Click a filled slot to see full history. Drag a tyre onto
                  another slot to rotate or swap.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TyreDetailPanel tyreId={detailTyreId} open={detailOpen} onOpenChange={setDetailOpen} onRemove={handleRemoveFromPanel} />

      {vehicleId && (
        <InstallTyreDialog open={installOpen} onOpenChange={setInstallOpen} vehicleId={vehicleId} position={installPosition} />
      )}

      <RemoveTyreDialog open={removeOpen} onOpenChange={setRemoveOpen} tyreId={removeTyreId} onRemoved={invalidateAxleView} />
    </div>
  )
}

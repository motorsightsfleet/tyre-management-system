import { useQuery } from '@tanstack/react-query'
import { Loader2, Barcode as BarcodeIcon, Gauge, Thermometer, Ruler, MapPin, Calendar } from 'lucide-react'

import { apiClient } from '@/lib/api-client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface TyreDetail {
  id: number
  serial_number: string
  barcode_code: string | null
  rfid_code: string | null
  status: string
  cost: string
  retread_count: number
  tyre_brand?: { name: string }
  tyre_pattern?: { name: string }
  tyre_size?: { code: string }
  tyre_type?: { name: string }
  current_vehicle?: { code: string }
  current_tyre_position?: { name: string; code: string }
  current_warehouse?: { name: string }
  installations: {
    id: number
    installed_at: string
    removed_at: string | null
    odometer_km_at_install: number
    odometer_km_at_removal: number | null
    tyre_rotation_id: number | null
    vehicle?: { code: string; odometer_km: number }
    tyre_position?: { code: string }
    removal_reason?: { name: string }
  }[]
  inspections: {
    id: number
    type: string
    tread_depth_mm: string | null
    pressure_psi: string | null
    temperature_c: string | null
    inspected_at: string
    inspected_by?: { name: string }
  }[]
  repairs: { id: number; cost: string; repair_date: string; repair_type?: { name: string } }[]
  retreads: { id: number; cost: string; sent_date: string; received_date: string | null; retread_vendor?: { name: string } }[]
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-muted/50 flex flex-col gap-1 rounded-lg p-2.5">
      <div className="text-muted-foreground flex items-center gap-1 text-[10px] uppercase tracking-wide">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )
}

export function TyreDetailPanel({
  tyreId,
  open,
  onOpenChange,
  onRemove,
}: {
  tyreId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemove: (tyre: TyreDetail) => void
}) {
  const { data, isLoading } = useQuery<TyreDetail>({
    queryKey: ['transactions/tyres', tyreId, 'history'],
    queryFn: async () => (await apiClient.get(`/transactions/tyres/${tyreId}/history`)).data.data,
    enabled: open && tyreId !== null,
  })

  const latestInspection = data?.inspections?.[0]
  const rotations = data?.installations?.filter((i) => i.tyre_rotation_id !== null) ?? []

  const totalCost =
    data ? Number(data.cost) + (data.repairs?.reduce((s, r) => s + Number(r.cost), 0) ?? 0) + (data.retreads?.reduce((s, r) => s + Number(r.cost), 0) ?? 0) : 0
  const totalKm =
    data?.installations?.reduce((sum, i) => {
      const end = i.removed_at ? i.odometer_km_at_removal ?? i.odometer_km_at_install : i.vehicle?.odometer_km ?? i.odometer_km_at_install
      return sum + Math.max(0, (end ?? 0) - i.odometer_km_at_install)
    }, 0) ?? 0
  const costPerKm = totalKm > 0 ? totalCost / totalKm : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {isLoading || !data ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="flex items-center gap-2">
                {data.serial_number}
                <Badge variant={data.status === 'installed' ? 'success' : 'secondary'}>{data.status.replace('_', ' ')}</Badge>
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1">
                <BarcodeIcon className="size-3.5" />
                {data.barcode_code ?? 'No barcode assigned'}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 p-4">
              <div className="bg-muted flex h-32 items-center justify-center rounded-lg">
                <span className="text-muted-foreground text-xs">No photo uploaded</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Brand</span>
                  <p className="font-medium">{data.tyre_brand?.name ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pattern</span>
                  <p className="font-medium">{data.tyre_pattern?.name ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Size</span>
                  <p className="font-medium">{data.tyre_size?.code ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">{data.tyre_type?.name ?? '—'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StatCard label="Position" icon={MapPin} value={data.current_tyre_position?.code ?? data.current_warehouse?.name ?? '—'} />
                <StatCard label="Tread Depth" icon={Ruler} value={latestInspection?.tread_depth_mm ? `${latestInspection.tread_depth_mm} mm` : '—'} />
                <StatCard label="Pressure" icon={Gauge} value={latestInspection?.pressure_psi ? `${latestInspection.pressure_psi} psi` : '—'} />
                <StatCard label="Temperature" icon={Thermometer} value={latestInspection?.temperature_c ? `${latestInspection.temperature_c} °C` : '—'} />
                <StatCard label="Cost / KM" icon={Gauge} value={costPerKm ? costPerKm.toFixed(0) : '—'} />
                <StatCard label="Retreads" icon={Calendar} value={String(data.retread_count)} />
              </div>

              {data.current_vehicle && (
                <Button variant="outline" className="text-destructive" onClick={() => onRemove(data)}>
                  Remove from {data.current_vehicle.code}
                </Button>
              )}

              <Tabs defaultValue="lifecycle">
                <TabsList className="w-full">
                  <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
                  <TabsTrigger value="inspections">Inspections</TabsTrigger>
                  <TabsTrigger value="repairs">Repairs</TabsTrigger>
                  <TabsTrigger value="rotations">Rotations</TabsTrigger>
                </TabsList>

                <TabsContent value="lifecycle" className="flex flex-col gap-2 pt-2">
                  {data.installations.length === 0 && <p className="text-muted-foreground text-sm">No installations yet.</p>}
                  {data.installations.map((i) => (
                    <div key={i.id} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">
                        {i.vehicle?.code} — {i.tyre_position?.code}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(i.installed_at).toLocaleDateString()} → {i.removed_at ? new Date(i.removed_at).toLocaleDateString() : 'current'}
                        {i.removal_reason && ` · ${i.removal_reason.name}`}
                      </p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="inspections" className="flex flex-col gap-2 pt-2">
                  {data.inspections.length === 0 && <p className="text-muted-foreground text-sm">No inspections recorded.</p>}
                  {data.inspections.map((insp) => (
                    <div key={insp.id} className="rounded-md border p-2 text-xs">
                      <p className="font-medium capitalize">{insp.type} inspection</p>
                      <p className="text-muted-foreground">
                        {new Date(insp.inspected_at).toLocaleString()}
                        {insp.tread_depth_mm && ` · Tread ${insp.tread_depth_mm}mm`}
                        {insp.pressure_psi && ` · ${insp.pressure_psi}psi`}
                        {insp.inspected_by && ` · by ${insp.inspected_by.name}`}
                      </p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="repairs" className="flex flex-col gap-2 pt-2">
                  {data.repairs.length === 0 && data.retreads.length === 0 && (
                    <p className="text-muted-foreground text-sm">No repairs or retreads recorded.</p>
                  )}
                  {data.repairs.map((r) => (
                    <div key={`repair-${r.id}`} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">{r.repair_type?.name ?? 'Repair'}</p>
                      <p className="text-muted-foreground">
                        {new Date(r.repair_date).toLocaleDateString()} · Rp {Number(r.cost).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {data.retreads.map((r) => (
                    <div key={`retread-${r.id}`} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">Retread — {r.retread_vendor?.name}</p>
                      <p className="text-muted-foreground">
                        {new Date(r.sent_date).toLocaleDateString()} · Rp {Number(r.cost).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="rotations" className="flex flex-col gap-2 pt-2">
                  {rotations.length === 0 && <p className="text-muted-foreground text-sm">No rotations recorded.</p>}
                  {rotations.map((r) => (
                    <div key={r.id} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">
                        Moved to {r.tyre_position?.code} on {r.vehicle?.code}
                      </p>
                      <p className="text-muted-foreground">{new Date(r.installed_at).toLocaleString()}</p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

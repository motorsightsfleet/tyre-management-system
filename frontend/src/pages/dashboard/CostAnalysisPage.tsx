import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DollarSign, Truck } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/KpiCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { QueryState } from '@/components/dashboard/QueryState'
import { useApiQuery } from '@/hooks/use-crud'

interface FleetSummary {
  total_cost: number
  total_km: number
  total_hours: number
  cost_per_km: number
  cost_per_hour: number
  vehicle_count: number
}

interface VehicleCostRow {
  vehicle: { code: string }
  total_cost: number
  cost_per_km: number
}

interface GroupCostRow {
  group: string
  total_cost: number
}

const rupiah = (n: number) => `Rp ${Number(n).toLocaleString()}`

export function CostAnalysisPage() {
  const fleet = useApiQuery<FleetSummary>('/analytics/cost-per-fleet')
  const byVehicle = useApiQuery<VehicleCostRow[]>('/analytics/cost-per-vehicle')
  const bySite = useApiQuery<GroupCostRow[]>('/analytics/cost-per-site')

  const isLoading = fleet.isLoading || byVehicle.isLoading || bySite.isLoading
  const isError = fleet.isError || byVehicle.isError || bySite.isError

  const topVehicles = (byVehicle.data ?? [])
    .slice(0, 8)
    .map((row) => ({ vehicle: row.vehicle.code, total_cost: row.total_cost }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Cost Analysis</h1>
        <p className="text-muted-foreground text-sm">Fleet-wide tyre spend, normalized per km and per engine hour.</p>
      </div>

      <QueryState isLoading={isLoading} isError={isError}>
        {fleet.data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Total Tyre Cost" value={rupiah(fleet.data.total_cost)} icon={DollarSign} />
              <KpiCard label="Cost / KM" value={rupiah(fleet.data.cost_per_km)} icon={DollarSign} />
              <KpiCard label="Cost / Hour" value={rupiah(fleet.data.cost_per_hour)} icon={DollarSign} />
              <KpiCard label="Vehicles Tracked" value={fleet.data.vehicle_count} icon={Truck} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Top Cost Vehicles" description="Highest cumulative tyre spend">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topVehicles} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => rupiah(Number(v))} />
                    <Bar dataKey="total_cost" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Cost by Site" description="Tyre spend by operating site">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bySite.data ?? []} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="group" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => rupiah(Number(v))} />
                    <Bar dataKey="total_cost" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}

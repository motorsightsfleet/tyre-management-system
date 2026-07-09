import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { Truck, Gauge, Clock } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/KpiCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { QueryState } from '@/components/dashboard/QueryState'
import { SimpleTable } from '@/components/dashboard/SimpleTable'
import { Badge } from '@/components/ui/badge'
import { useApiQuery } from '@/hooks/use-crud'
import { CHART_COLORS } from '@/lib/chart-colors'

interface FleetOverviewResponse {
  total_vehicles: number
  by_category: { category: string; total: number }[]
  by_status: Record<string, number>
  by_site: { site: string; total: number }[]
  avg_odometer_km: number
  avg_engine_hours: number
  vehicles: { vehicle: string; category: string | null; status: string; odometer_km: number; engine_hours: number; tyre_count: number }[]
}

export function FleetOverviewPage() {
  const { data, isLoading, isError } = useApiQuery<FleetOverviewResponse>('/dashboard/fleet-overview')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Fleet Overview</h1>
        <p className="text-muted-foreground text-sm">Composition, distribution, and utilization of the vehicle fleet.</p>
      </div>

      <QueryState isLoading={isLoading} isError={isError}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard label="Total Vehicles" value={data.total_vehicles} icon={Truck} />
              <KpiCard label="Avg Odometer" value={`${data.avg_odometer_km.toLocaleString()} km`} icon={Gauge} />
              <KpiCard label="Avg Engine Hours" value={data.avg_engine_hours.toLocaleString()} icon={Clock} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Fleet by Category" description="Vehicle count per category">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.by_category} dataKey="total" nameKey="category" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {data.by_category.map((entry, i) => (
                        <Cell key={entry.category} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Fleet by Site" description="Vehicle count per operating site">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_site} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="site" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="total" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <SimpleTable
              rowKey={(row) => row.vehicle}
              rows={data.vehicles}
              columns={[
                { key: 'vehicle', header: 'Vehicle' },
                { key: 'category', header: 'Category', render: (r) => r.category ?? '—' },
                { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : 'secondary'}>{r.status}</Badge> },
                { key: 'odometer_km', header: 'Odometer (km)', render: (r) => r.odometer_km.toLocaleString() },
                { key: 'engine_hours', header: 'Engine Hours', render: (r) => r.engine_hours.toLocaleString() },
                { key: 'tyre_count', header: 'Tyres Installed' },
              ]}
            />
          </>
        )}
      </QueryState>
    </div>
  )
}

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Truck, CircleGauge, Warehouse, Ban, Gauge, DollarSign } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/KpiCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { QueryState } from '@/components/dashboard/QueryState'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useApiQuery } from '@/hooks/use-crud'
import { CHART_COLORS } from '@/lib/chart-colors'

interface KpisResponse {
  kpis: {
    total_vehicles: number
    total_tyres: number
    installed_tyres: number
    warehouse_stock: number
    scrap_tyres: number
    average_tyre_lifetime_km: number
    cost_per_km: number
    cost_per_hour: number
    upcoming_inspections: number
    upcoming_rotations: number
    monthly_tyre_cost: number
  }
  charts: {
    tyre_lifecycle: Record<string, number>
    monthly_cost_trend: { month: string; installs: number }[]
    brand_comparison: { brand: string; total: number }[]
    pattern_comparison: { pattern: string; total: number }[]
    failure_analysis: { failure_code: string; total: number }[]
  }
  top_cost_vehicles: { vehicle: string; total_cost: number }[]
}

const rupiah = (n: number) => `Rp ${Number(n).toLocaleString()}`

export function ExecutiveDashboardPage() {
  const { data, isLoading, isError } = useApiQuery<KpisResponse>('/dashboard/kpis')

  const statusData = data ? Object.entries(data.charts.tyre_lifecycle).map(([status, total]) => ({ status, total })) : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Executive Dashboard</h1>
        <p className="text-muted-foreground text-sm">Fleet-wide tyre program health, cost, and lifecycle at a glance.</p>
      </div>

      <QueryState isLoading={isLoading} isError={isError}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <KpiCard label="Fleet Vehicles" value={data.kpis.total_vehicles} icon={Truck} />
              <KpiCard label="Installed Tyres" value={data.kpis.installed_tyres} icon={CircleGauge} />
              <KpiCard label="Warehouse Stock" value={data.kpis.warehouse_stock} icon={Warehouse} />
              <KpiCard label="Scrapped Tyres" value={data.kpis.scrap_tyres} icon={Ban} tone="destructive" />
              <KpiCard label="Avg Lifetime" value={`${data.kpis.average_tyre_lifetime_km.toLocaleString()} km`} icon={Gauge} />
              <KpiCard label="Cost / KM" value={rupiah(data.kpis.cost_per_km)} icon={DollarSign} />
              <KpiCard label="Cost / Hour" value={rupiah(data.kpis.cost_per_hour)} icon={DollarSign} />
              <KpiCard label="Monthly Tyre Cost" value={rupiah(data.kpis.monthly_tyre_cost)} icon={DollarSign} />
              <KpiCard label="Inspections Overdue" value={data.kpis.upcoming_inspections} tone="warning" />
              <KpiCard label="Rotations Due" value={data.kpis.upcoming_rotations} tone="warning" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Tyre Lifecycle Status" description="Current distribution by lifecycle status">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="total" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {statusData.map((entry, i) => (
                        <Cell key={entry.status} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Monthly Installation Trend" description="Tyre installations per month">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.charts.monthly_cost_trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="installs" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Brand Comparison" description="Tyre count by brand">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.brand_comparison} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="brand" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="total" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Failure Analysis" description="Recorded inspection failures by cause" isEmpty={data.charts.failure_analysis.length === 0}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.failure_analysis} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="failure_code" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="total" fill="var(--color-status-replace)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Cost Vehicles</CardTitle>
                <CardDescription>Highest cumulative tyre spend</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col divide-y">
                {data.top_cost_vehicles.length === 0 && <p className="text-muted-foreground text-sm">No data yet.</p>}
                {data.top_cost_vehicles.map((row) => (
                  <div key={row.vehicle} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{row.vehicle}</span>
                    <span className="text-muted-foreground">{rupiah(row.total_cost)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </QueryState>
    </div>
  )
}

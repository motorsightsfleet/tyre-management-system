import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Route, TrendingUp, TrendingDown } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/KpiCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { QueryState } from '@/components/dashboard/QueryState'
import { useApiQuery } from '@/hooks/use-crud'
import { CHART_COLORS } from '@/lib/chart-colors'

interface TyreLifetime {
  sample_size: number
  avg_lifetime_km: number
  avg_lifetime_hours: number
  max_lifetime_km: number
  min_lifetime_km: number
}

interface TyreUtilization {
  by_status: Record<string, number>
  total_tyres: number
  utilization_rate: number
}

export function TyreLifecyclePage() {
  const lifetime = useApiQuery<TyreLifetime>('/analytics/tyre-lifetime')
  const utilization = useApiQuery<TyreUtilization>('/analytics/tyre-utilization')

  const isLoading = lifetime.isLoading || utilization.isLoading
  const isError = lifetime.isError || utilization.isError

  const statusData = utilization.data ? Object.entries(utilization.data.by_status).map(([status, total]) => ({ status, total })) : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Tyre Lifecycle</h1>
        <p className="text-muted-foreground text-sm">Lifetime performance and utilization across the tyre pool.</p>
      </div>

      <QueryState isLoading={isLoading} isError={isError}>
        {lifetime.data && utilization.data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Avg Lifetime" value={`${lifetime.data.avg_lifetime_km.toLocaleString()} km`} icon={Route} />
              <KpiCard label="Avg Engine Hours" value={lifetime.data.avg_lifetime_hours.toLocaleString()} icon={Route} />
              <KpiCard label="Best Performer" value={`${lifetime.data.max_lifetime_km.toLocaleString()} km`} icon={TrendingUp} tone="success" />
              <KpiCard label="Shortest Life" value={`${lifetime.data.min_lifetime_km.toLocaleString()} km`} icon={TrendingDown} tone="destructive" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Lifecycle Status Breakdown" description={`${utilization.data.total_tyres} tyres tracked · ${utilization.data.utilization_rate}% utilization`}>
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

              <ChartCard title="Lifetime Range" description={`Sample size: ${lifetime.data.sample_size} closed installations`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { label: 'Shortest', km: lifetime.data.min_lifetime_km },
                      { label: 'Average', km: lifetime.data.avg_lifetime_km },
                      { label: 'Longest', km: lifetime.data.max_lifetime_km },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="km" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={48} />
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

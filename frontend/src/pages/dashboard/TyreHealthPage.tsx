import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CircleGauge } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/KpiCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { QueryState } from '@/components/dashboard/QueryState'
import { SimpleTable } from '@/components/dashboard/SimpleTable'
import { Badge } from '@/components/ui/badge'
import { useApiQuery } from '@/hooks/use-crud'
import { HEALTH_COLORS, HEALTH_LABELS, type HealthStatus } from '@/types/axle-view'

interface TyreHealthResponse {
  total_installed: number
  distribution: Record<HealthStatus, number>
  at_risk: { tyre_id: number; serial_number: string; brand: string | null; vehicle: string | null; health_status: HealthStatus }[]
}

const BADGE_VARIANT: Record<HealthStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  healthy: 'success',
  inspection_due: 'warning',
  rotation_due: 'warning',
  replace: 'destructive',
  scrapped: 'secondary',
}

export function TyreHealthPage() {
  const { data, isLoading, isError } = useApiQuery<TyreHealthResponse>('/dashboard/tyre-health')

  const chartData = data
    ? (Object.entries(data.distribution) as [HealthStatus, number][])
        .filter(([, total]) => total > 0)
        .map(([status, total]) => ({ status, total }))
    : []

  const healthyPct = data && data.total_installed > 0 ? Math.round((data.distribution.healthy / data.total_installed) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Tyre Health</h1>
        <p className="text-muted-foreground text-sm">Live condition of every currently installed tyre.</p>
      </div>

      <QueryState isLoading={isLoading} isError={isError}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard label="Installed Tyres" value={data.total_installed} icon={CircleGauge} />
              <KpiCard label="Healthy" value={`${healthyPct}%`} tone="success" />
              <KpiCard label="Needing Attention" value={data.at_risk.length} tone="warning" />
            </div>

            <ChartCard title="Health Distribution" description="Status of all installed tyres">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="total" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={HEALTH_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => HEALTH_LABELS[value as HealthStatus] ?? value} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value, _name, item) => [value, HEALTH_LABELS[(item.payload as { status: HealthStatus }).status]]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <SimpleTable
              rowKey={(row) => row.tyre_id}
              rows={data.at_risk}
              emptyLabel="No tyres currently need attention."
              columns={[
                { key: 'serial_number', header: 'Serial Number' },
                { key: 'brand', header: 'Brand', render: (r) => r.brand ?? '—' },
                { key: 'vehicle', header: 'Vehicle', render: (r) => r.vehicle ?? '—' },
                {
                  key: 'health_status',
                  header: 'Status',
                  render: (r) => <Badge variant={BADGE_VARIANT[r.health_status]}>{HEALTH_LABELS[r.health_status]}</Badge>,
                },
              ]}
            />
          </>
        )}
      </QueryState>
    </div>
  )
}

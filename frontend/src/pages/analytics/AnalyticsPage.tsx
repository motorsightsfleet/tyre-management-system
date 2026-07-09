import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { KpiCard } from '@/components/dashboard/KpiCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { QueryState } from '@/components/dashboard/QueryState'
import { SimpleTable } from '@/components/dashboard/SimpleTable'
import { useApiQuery } from '@/hooks/use-crud'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { AnalyticsConfig } from '@/config/analytics'

const rupiah = (n: number) => `Rp ${Number(n ?? 0).toLocaleString()}`

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
  cost_per_hour: number
  tyre_count: number
  odometer_km: number
  engine_hours: number
}

export function AnalyticsPage({ config }: { config: AnalyticsConfig }) {
  const { data, isLoading, isError } = useApiQuery<unknown>(config.endpoint)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{config.title}</h1>
        <p className="text-muted-foreground text-sm">{config.description}</p>
      </div>

      <QueryState isLoading={isLoading} isError={isError}>
        {data !== undefined && <AnalyticsBody config={config} data={data} />}
      </QueryState>
    </div>
  )
}

function AnalyticsBody({ config, data }: { config: AnalyticsConfig; data: unknown }) {
  switch (config.kind) {
    case 'vehicle-cost-summary': {
      const { summary, by_vehicle: byVehicle } = data as { summary: FleetSummary; by_vehicle: VehicleCostRow[] }
      const chartData = byVehicle.slice(0, 10).map((row) => ({ vehicle: row.vehicle.code, value: row[config.metricKey] }))

      return (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Total Cost" value={rupiah(summary.total_cost)} />
            <KpiCard label={config.metricLabel} value={rupiah(summary[config.metricKey])} />
            <KpiCard label="Vehicles" value={summary.vehicle_count} />
            <KpiCard label="Total KM / Hours" value={`${summary.total_km.toLocaleString()} / ${summary.total_hours.toLocaleString()}`} />
          </div>
          <ChartCard title={`Top Vehicles by ${config.metricLabel}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => rupiah(Number(v))} />
                <Bar dataKey="value" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <SimpleTable
            rowKey={(row) => row.vehicle.code}
            rows={byVehicle}
            columns={[
              { key: 'vehicle', header: 'Vehicle', render: (r) => r.vehicle.code },
              { key: 'tyre_count', header: 'Tyres' },
              { key: 'total_cost', header: 'Total Cost', render: (r) => rupiah(r.total_cost) },
              { key: 'cost_per_km', header: 'Cost / KM', render: (r) => rupiah(r.cost_per_km) },
              { key: 'cost_per_hour', header: 'Cost / Hour', render: (r) => rupiah(r.cost_per_hour) },
            ]}
          />
        </>
      )
    }

    case 'vehicle-cost-flat': {
      const rows = data as VehicleCostRow[]
      const chartData = rows.slice(0, 10).map((row) => ({ vehicle: row.vehicle.code, total_cost: row.total_cost }))

      return (
        <>
          <ChartCard title="Top Vehicles by Total Cost">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => rupiah(Number(v))} />
                <Bar dataKey="total_cost" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <SimpleTable
            rowKey={(row) => row.vehicle.code}
            rows={rows}
            columns={[
              { key: 'vehicle', header: 'Vehicle', render: (r) => r.vehicle.code },
              { key: 'tyre_count', header: 'Tyres' },
              { key: 'total_cost', header: 'Total Cost', render: (r) => rupiah(r.total_cost) },
            ]}
          />
        </>
      )
    }

    case 'fleet-summary': {
      const summary = data as FleetSummary
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard label="Total Cost" value={rupiah(summary.total_cost)} />
          <KpiCard label="Cost / KM" value={rupiah(summary.cost_per_km)} />
          <KpiCard label="Cost / Hour" value={rupiah(summary.cost_per_hour)} />
          <KpiCard label="Total KM" value={summary.total_km.toLocaleString()} />
          <KpiCard label="Total Engine Hours" value={summary.total_hours.toLocaleString()} />
          <KpiCard label="Vehicles" value={summary.vehicle_count} />
        </div>
      )
    }

    case 'grouped-cost': {
      const rows = data as (FleetSummary & { group: string })[]
      return (
        <>
          <ChartCard title="Total Cost by Group">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="group" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => rupiah(Number(v))} />
                <Bar dataKey="total_cost" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <SimpleTable
            rowKey={(row) => row.group}
            rows={rows}
            columns={[
              { key: 'group', header: 'Group' },
              { key: 'vehicle_count', header: 'Vehicles' },
              { key: 'total_cost', header: 'Total Cost', render: (r) => rupiah(r.total_cost) },
              { key: 'cost_per_km', header: 'Cost / KM', render: (r) => rupiah(r.cost_per_km) },
              { key: 'cost_per_hour', header: 'Cost / Hour', render: (r) => rupiah(r.cost_per_hour) },
            ]}
          />
        </>
      )
    }

    case 'performance': {
      const rows = data as Record<string, unknown>[]
      return (
        <>
          <ChartCard title={`Tyre Count by ${config.labelHeader}`} isEmpty={rows.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey={config.labelKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="tyre_count" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <SimpleTable
            rowKey={(row) => String(row[config.labelKey])}
            rows={rows}
            columns={[
              { key: config.labelKey, header: config.labelHeader },
              { key: 'tyre_count', header: 'Tyre Count' },
              { key: 'avg_cost', header: 'Avg Cost', render: (r) => rupiah(r.avg_cost as number) },
              { key: 'scrapped_count', header: 'Scrapped' },
              ...(rows[0] && 'avg_lifetime_km' in rows[0]
                ? [{ key: 'avg_lifetime_km', header: 'Avg Lifetime (km)', render: (r: Record<string, unknown>) => (r.avg_lifetime_km as number).toLocaleString() }]
                : []),
            ]}
          />
        </>
      )
    }

    case 'tyre-lifetime': {
      const d = data as { sample_size: number; avg_lifetime_km: number; avg_lifetime_hours: number; max_lifetime_km: number; min_lifetime_km: number }
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard label="Sample Size" value={d.sample_size} />
          <KpiCard label="Avg Lifetime" value={`${d.avg_lifetime_km.toLocaleString()} km`} />
          <KpiCard label="Avg Engine Hours" value={d.avg_lifetime_hours.toLocaleString()} />
          <KpiCard label="Longest Life" value={`${d.max_lifetime_km.toLocaleString()} km`} tone="success" />
          <KpiCard label="Shortest Life" value={`${d.min_lifetime_km.toLocaleString()} km`} tone="destructive" />
        </div>
      )
    }

    case 'tyre-utilization': {
      const d = data as { by_status: Record<string, number>; total_tyres: number; utilization_rate: number }
      const chartData = Object.entries(d.by_status).map(([status, total]) => ({ status, total }))
      return (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <KpiCard label="Total Tyres" value={d.total_tyres} />
            <KpiCard label="Utilization Rate" value={`${d.utilization_rate}%`} tone="success" />
          </div>
          <ChartCard title="Tyres by Status">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="total" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {chartData.map((entry, i) => (
                    <Cell key={entry.status} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )
    }

    case 'analysis': {
      const rows = data as Record<string, unknown>[]
      return (
        <>
          <ChartCard title={`Occurrences by ${config.labelHeader}`} isEmpty={rows.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey={config.labelKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="total" fill="var(--color-status-replace)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <SimpleTable
            rowKey={(row) => String(row[config.labelKey])}
            rows={rows}
            columns={[
              { key: config.labelKey, header: config.labelHeader },
              { key: 'total', header: 'Total' },
              ...(config.costKey
                ? [{ key: config.costKey, header: 'Cost Written Off', render: (r: Record<string, unknown>) => rupiah(r[config.costKey!] as number) }]
                : []),
            ]}
          />
        </>
      )
    }

    default:
      return null
  }
}

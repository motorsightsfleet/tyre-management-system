export type AnalyticsConfig =
  | { kind: 'vehicle-cost-summary'; endpoint: string; title: string; description: string; metricKey: 'cost_per_km' | 'cost_per_hour'; metricLabel: string }
  | { kind: 'vehicle-cost-flat'; endpoint: string; title: string; description: string }
  | { kind: 'fleet-summary'; endpoint: string; title: string; description: string }
  | { kind: 'grouped-cost'; endpoint: string; title: string; description: string }
  | { kind: 'performance'; endpoint: string; title: string; description: string; labelKey: string; labelHeader: string }
  | { kind: 'tyre-lifetime'; endpoint: string; title: string; description: string }
  | { kind: 'tyre-utilization'; endpoint: string; title: string; description: string }
  | { kind: 'analysis'; endpoint: string; title: string; description: string; labelKey: string; labelHeader: string; costKey?: string }

export const analyticsConfigs: Record<string, AnalyticsConfig> = {
  '/analytics/cost-per-km': {
    kind: 'vehicle-cost-summary', endpoint: '/analytics/cost-per-km', metricKey: 'cost_per_km', metricLabel: 'Cost per KM',
    title: 'Cost per KM', description: 'Tyre cost normalized by distance traveled, per vehicle.',
  },
  '/analytics/cost-per-hour': {
    kind: 'vehicle-cost-summary', endpoint: '/analytics/cost-per-hour', metricKey: 'cost_per_hour', metricLabel: 'Cost per Hour',
    title: 'Cost per Hour', description: 'Tyre cost normalized by engine hours, per vehicle.',
  },
  '/analytics/cost-per-vehicle': {
    kind: 'vehicle-cost-flat', endpoint: '/analytics/cost-per-vehicle',
    title: 'Cost per Vehicle', description: 'Total cumulative tyre spend per vehicle.',
  },
  '/analytics/cost-per-fleet': {
    kind: 'fleet-summary', endpoint: '/analytics/cost-per-fleet',
    title: 'Cost per Fleet', description: 'Fleet-wide tyre spend summary.',
  },
  '/analytics/cost-per-site': {
    kind: 'grouped-cost', endpoint: '/analytics/cost-per-site',
    title: 'Cost per Site', description: 'Tyre spend aggregated by operating site.',
  },
  '/analytics/cost-per-project': {
    kind: 'grouped-cost', endpoint: '/analytics/cost-per-project',
    title: 'Cost per Project', description: 'Tyre spend aggregated by project.',
  },
  '/analytics/brand-performance': {
    kind: 'performance', endpoint: '/analytics/brand-performance', labelKey: 'brand', labelHeader: 'Brand',
    title: 'Brand Performance', description: 'Tyre count, average cost, and scrap rate by brand.',
  },
  '/analytics/pattern-performance': {
    kind: 'performance', endpoint: '/analytics/pattern-performance', labelKey: 'pattern', labelHeader: 'Pattern',
    title: 'Pattern Performance', description: 'Tyre count, average cost, and scrap rate by tread pattern.',
  },
  '/analytics/tyre-lifetime': {
    kind: 'tyre-lifetime', endpoint: '/analytics/tyre-lifetime',
    title: 'Tyre Lifetime', description: 'Average and range of tyre service life across closed installations.',
  },
  '/analytics/tyre-utilization': {
    kind: 'tyre-utilization', endpoint: '/analytics/tyre-utilization',
    title: 'Tyre Utilization', description: 'Share of the tyre pool currently installed vs. in stock.',
  },
  '/analytics/failure-analysis': {
    kind: 'analysis', endpoint: '/analytics/failure-analysis', labelKey: 'failure_code', labelHeader: 'Failure Code',
    title: 'Failure Analysis', description: 'Inspection failures grouped by cause.',
  },
  '/analytics/damage-analysis': {
    kind: 'analysis', endpoint: '/analytics/damage-analysis', labelKey: 'damage_type', labelHeader: 'Damage Type',
    title: 'Damage Analysis', description: 'Inspection damage findings grouped by type.',
  },
  '/analytics/scrap-analysis': {
    kind: 'analysis', endpoint: '/analytics/scrap-analysis', labelKey: 'scrap_reason', labelHeader: 'Scrap Reason', costKey: 'total_cost_written_off',
    title: 'Scrap Analysis', description: 'Scrapped tyres grouped by reason, with cost written off.',
  },
}

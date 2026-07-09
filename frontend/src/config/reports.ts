export interface ReportConfig {
  key: string
  title: string
  description: string
}

export const reportConfigs: Record<string, ReportConfig> = {
  '/reports/inventory': { key: 'inventory', title: 'Inventory Report', description: 'Tyres currently in warehouse stock.' },
  '/reports/purchase': { key: 'purchase', title: 'Purchase Report', description: 'All purchase orders and their status.' },
  '/reports/installation': { key: 'installation', title: 'Installation Report', description: 'Currently mounted tyres by vehicle and position.' },
  '/reports/removal': { key: 'removal', title: 'Removal Report', description: 'Tyres removed from service, with reason and distance run.' },
  '/reports/rotation': { key: 'rotation', title: 'Rotation Report', description: 'Recorded tyre rotations by vehicle.' },
  '/reports/inspection': { key: 'inspection', title: 'Inspection Report', description: 'Most recent 500 tyre inspections.' },
  '/reports/repair': { key: 'repair', title: 'Repair Report', description: 'Tyre repair history and cost.' },
  '/reports/retread': { key: 'retread', title: 'Retread Report', description: 'Tyre retread history and turnaround.' },
  '/reports/scrap': { key: 'scrap', title: 'Scrap Report', description: 'Scrapped tyres, reason, and cost written off.' },
  '/reports/lifecycle': { key: 'lifecycle', title: 'Tyre Lifecycle Report', description: 'Full tyre pool with current status and retread count.' },
  '/reports/cost-per-km': { key: 'cost-per-km', title: 'Cost per KM Report', description: 'Tyre cost normalized by distance, per vehicle.' },
  '/reports/cost-per-hour': { key: 'cost-per-hour', title: 'Cost per Hour Report', description: 'Tyre cost normalized by engine hours, per vehicle.' },
  '/reports/cost-per-vehicle': { key: 'cost-per-vehicle', title: 'Cost per Vehicle Report', description: 'Total cumulative tyre spend per vehicle.' },
  '/reports/brand-comparison': { key: 'brand-comparison', title: 'Brand Comparison', description: 'Tyre count and average cost by brand.' },
}

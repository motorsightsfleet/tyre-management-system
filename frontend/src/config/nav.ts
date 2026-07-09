import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Database,
  Layers,
  ShoppingCart,
  Warehouse as WarehouseIcon,
  PlugZap,
  ClipboardCheck,
  Wrench as WrenchIcon,
  History,
  Ban,
  BarChart3,
  FileText,
  Settings as SettingsIcon,
} from 'lucide-react'

export interface NavLeaf {
  label: string
  path: string
  permission?: string | string[]
}

export interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavLeaf[]
  permission?: string | string[]
}

export interface NavSection {
  label: string
  icon: LucideIcon
  children: (NavLeaf | NavGroup)[]
  permission?: string | string[]
}

export function isNavGroup(item: NavLeaf | NavGroup): item is NavGroup {
  return 'items' in item
}

export interface FlatNavLeaf extends NavLeaf {
  sectionLabel: string
}

export function flattenNav(): FlatNavLeaf[] {
  const leaves: FlatNavLeaf[] = []

  for (const section of NAV) {
    for (const child of section.children) {
      if (isNavGroup(child)) {
        for (const item of child.items) {
          leaves.push({ ...item, sectionLabel: section.label })
        }
      } else {
        leaves.push({ ...child, sectionLabel: section.label })
      }
    }
  }

  return leaves
}

export const NAV: NavSection[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    children: [
      { label: 'Executive Dashboard', path: '/dashboard', permission: 'analytics.view' },
      { label: 'Fleet Overview', path: '/dashboard/fleet-overview', permission: 'analytics.view' },
      { label: 'Tyre Health', path: '/dashboard/tyre-health', permission: 'analytics.view' },
      { label: 'Tyre Lifecycle', path: '/dashboard/tyre-lifecycle', permission: 'analytics.view' },
      { label: 'Cost Analysis', path: '/dashboard/cost-analysis', permission: 'analytics.view' },
      { label: 'Upcoming Activities', path: '/dashboard/upcoming-activities', permission: 'analytics.view' },
      { label: 'Notifications', path: '/dashboard/notifications' },
    ],
  },
  {
    label: 'Master Data',
    icon: Database,
    permission: 'master.view',
    children: [
      { label: 'Vehicle', path: '/master-data/vehicles' },
      { label: 'Vehicle Model', path: '/master-data/vehicle-models' },
      { label: 'Vehicle Category', path: '/master-data/vehicle-categories' },
      { label: 'Axle Configuration', path: '/master-data/axle-configurations' },
      { label: 'Tyre', path: '/master-data/tyres' },
      { label: 'Tyre Brand', path: '/master-data/tyre-brands' },
      { label: 'Tyre Pattern', path: '/master-data/tyre-patterns' },
      { label: 'Tyre Size', path: '/master-data/tyre-sizes' },
      { label: 'Tyre Type', path: '/master-data/tyre-types' },
      { label: 'Supplier', path: '/master-data/suppliers' },
      { label: 'Warehouse', path: '/master-data/warehouses' },
      { label: 'Site', path: '/master-data/sites' },
      { label: 'Project', path: '/master-data/projects' },
      { label: 'Customer', path: '/master-data/customers' },
      { label: 'Tyre Position', path: '/master-data/tyre-positions' },
      { label: 'Failure Code', path: '/master-data/failure-codes' },
      { label: 'Damage Type', path: '/master-data/damage-types' },
      { label: 'Removal Reason', path: '/master-data/removal-reasons' },
      { label: 'Scrap Reason', path: '/master-data/scrap-reasons' },
      { label: 'Repair Type', path: '/master-data/repair-types' },
      { label: 'Retread Vendor', path: '/master-data/retread-vendors' },
      { label: 'Inspection Checklist', path: '/master-data/inspection-checklists' },
    ],
  },
  {
    label: 'Transaction',
    icon: Layers,
    children: [
      {
        label: 'Procurement',
        icon: ShoppingCart,
        permission: ['transaction.procurement.view', 'transaction.procurement.manage'],
        items: [
          { label: 'Purchase Tyre', path: '/transactions/purchase-orders' },
          { label: 'Goods Receipt', path: '/transactions/goods-receipts' },
          { label: 'Initial Stock', path: '/transactions/initial-stock-entries' },
        ],
      },
      {
        label: 'Warehouse',
        icon: WarehouseIcon,
        permission: ['transaction.warehouse.view', 'transaction.warehouse.manage'],
        items: [
          { label: 'Stock Inventory', path: '/transactions/stock-inventory' },
          { label: 'Stock Movement', path: '/transactions/stock-movements' },
          { label: 'Stock Transfer', path: '/transactions/stock-transfers' },
          { label: 'Stock Adjustment', path: '/transactions/stock-adjustments' },
          { label: 'Barcode / RFID Management', path: '/transactions/barcode-rfid' },
        ],
      },
      {
        label: 'Tyre Installation',
        icon: PlugZap,
        permission: ['transaction.installation.view', 'transaction.installation.manage'],
        items: [
          { label: 'Interactive Axle View', path: '/transactions/axle-view' },
          { label: 'Install Tyre', path: '/transactions/install-tyre' },
          { label: 'Remove Tyre', path: '/transactions/remove-tyre' },
          { label: 'Rotation', path: '/transactions/rotation' },
          { label: 'Change Position', path: '/transactions/change-position' },
        ],
      },
      {
        label: 'Tyre Inspection',
        icon: ClipboardCheck,
        permission: ['transaction.inspection.view', 'transaction.inspection.manage'],
        items: [
          { label: 'Daily Inspection', path: '/transactions/inspections/daily' },
          { label: 'Periodic Inspection', path: '/transactions/inspections/periodic' },
          { label: 'Pressure Check', path: '/transactions/inspections/pressure' },
          { label: 'Tread Depth', path: '/transactions/inspections/tread' },
          { label: 'Damage Inspection', path: '/transactions/inspections/damage' },
        ],
      },
      {
        label: 'Maintenance',
        icon: WrenchIcon,
        permission: ['transaction.maintenance.view', 'transaction.maintenance.manage'],
        items: [
          { label: 'Repair', path: '/transactions/repairs' },
          { label: 'Retread', path: '/transactions/retreads' },
          { label: 'Warranty Claim', path: '/transactions/warranty-claims' },
        ],
      },
      {
        label: 'Lifecycle',
        icon: History,
        permission: ['transaction.installation.view', 'transaction.installation.manage'],
        items: [
          { label: 'Tyre History', path: '/transactions/tyre-history' },
          { label: 'Lifecycle Timeline', path: '/transactions/lifecycle-timeline' },
          { label: 'Movement History', path: '/transactions/movement-history' },
        ],
      },
      {
        label: 'Disposal',
        icon: Ban,
        permission: ['transaction.disposal.view', 'transaction.disposal.manage'],
        items: [
          { label: 'Scrap Tyre', path: '/transactions/scraps' },
          { label: 'Lost Tyre', path: '/transactions/lost-tyres' },
        ],
      },
    ],
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    permission: 'analytics.view',
    children: [
      { label: 'Cost per KM', path: '/analytics/cost-per-km' },
      { label: 'Cost per Hour', path: '/analytics/cost-per-hour' },
      { label: 'Cost per Vehicle', path: '/analytics/cost-per-vehicle' },
      { label: 'Cost per Fleet', path: '/analytics/cost-per-fleet' },
      { label: 'Cost per Site', path: '/analytics/cost-per-site' },
      { label: 'Cost per Project', path: '/analytics/cost-per-project' },
      { label: 'Brand Performance', path: '/analytics/brand-performance' },
      { label: 'Pattern Performance', path: '/analytics/pattern-performance' },
      { label: 'Tyre Lifetime', path: '/analytics/tyre-lifetime' },
      { label: 'Tyre Utilization', path: '/analytics/tyre-utilization' },
      { label: 'Failure Analysis', path: '/analytics/failure-analysis' },
      { label: 'Damage Analysis', path: '/analytics/damage-analysis' },
      { label: 'Scrap Analysis', path: '/analytics/scrap-analysis' },
    ],
  },
  {
    label: 'Reports',
    icon: FileText,
    permission: 'reports.view',
    children: [
      { label: 'Inventory Report', path: '/reports/inventory' },
      { label: 'Purchase Report', path: '/reports/purchase' },
      { label: 'Installation Report', path: '/reports/installation' },
      { label: 'Removal Report', path: '/reports/removal' },
      { label: 'Rotation Report', path: '/reports/rotation' },
      { label: 'Inspection Report', path: '/reports/inspection' },
      { label: 'Repair Report', path: '/reports/repair' },
      { label: 'Retread Report', path: '/reports/retread' },
      { label: 'Scrap Report', path: '/reports/scrap' },
      { label: 'Tyre Lifecycle Report', path: '/reports/lifecycle' },
      { label: 'Cost per KM Report', path: '/reports/cost-per-km' },
      { label: 'Cost per Hour Report', path: '/reports/cost-per-hour' },
      { label: 'Cost per Vehicle Report', path: '/reports/cost-per-vehicle' },
      { label: 'Brand Comparison', path: '/reports/brand-comparison' },
    ],
  },
  {
    label: 'Settings',
    icon: SettingsIcon,
    permission: 'settings.view',
    children: [
      { label: 'Users', path: '/settings/users', permission: 'users.manage' },
      { label: 'Roles & Permissions', path: '/settings/roles', permission: 'users.manage' },
      { label: 'Company Profile', path: '/settings/company-profile' },
      { label: 'Notification', path: '/settings/notifications' },
      { label: 'Approval Workflow', path: '/settings/approval-workflows' },
      { label: 'Barcode / RFID Configuration', path: '/settings/barcode-rfid-config' },
      { label: 'Audit Log', path: '/settings/audit-log' },
      { label: 'System Configuration', path: '/settings/system-configuration' },
    ],
  },
]

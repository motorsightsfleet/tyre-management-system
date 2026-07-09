import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ComponentType } from 'react'

import { flattenNav } from '@/config/nav'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth, RequirePermission } from '@/components/layout/RequireAuth'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { CrudPage } from '@/components/data/CrudPage'
import { CreateListPage } from '@/components/data/CreateListPage'
import { masterDataEntityConfigs } from '@/config/entities'
import { approvalWorkflowConfig } from '@/config/entities/settings'
import {
  repairConfig,
  retreadConfig,
  warrantyClaimConfig,
  scrapConfig,
  lostTyreConfig,
  stockAdjustmentConfig,
  initialStockEntryConfig,
} from '@/config/entities/simple-transactions'
import {
  dailyInspectionConfig,
  periodicInspectionConfig,
  pressureCheckConfig,
  treadDepthConfig,
  damageInspectionConfig,
} from '@/config/entities/inspections'
import { TyresPage } from '@/pages/master-data/TyresPage'
import { UsersPage } from '@/pages/settings/UsersPage'
import { RolesPage } from '@/pages/settings/RolesPage'
import { CompanyProfilePage } from '@/pages/settings/CompanyProfilePage'
import { NotificationsPage } from '@/pages/settings/NotificationsPage'
import { BarcodeConfigPage } from '@/pages/settings/BarcodeConfigPage'
import { AuditLogPage } from '@/pages/settings/AuditLogPage'
import { SystemConfigurationPage } from '@/pages/settings/SystemConfigurationPage'
import { AxleViewPage } from '@/pages/transactions/AxleViewPage'
import { PurchaseOrdersPage } from '@/pages/transactions/PurchaseOrdersPage'
import { GoodsReceiptsPage } from '@/pages/transactions/GoodsReceiptsPage'
import { StockTransfersPage } from '@/pages/transactions/StockTransfersPage'
import { StockInventoryPage } from '@/pages/transactions/StockInventoryPage'
import { StockMovementsPage } from '@/pages/transactions/StockMovementsPage'
import { TyreHistoryPage } from '@/pages/transactions/TyreHistoryPage'
import { LifecycleTimelinePage } from '@/pages/transactions/LifecycleTimelinePage'
import { BarcodeRfidPage } from '@/pages/transactions/BarcodeRfidPage'
import { ExecutiveDashboardPage } from '@/pages/dashboard/ExecutiveDashboardPage'
import { FleetOverviewPage } from '@/pages/dashboard/FleetOverviewPage'
import { TyreHealthPage } from '@/pages/dashboard/TyreHealthPage'
import { TyreLifecyclePage } from '@/pages/dashboard/TyreLifecyclePage'
import { CostAnalysisPage } from '@/pages/dashboard/CostAnalysisPage'
import { UpcomingActivitiesPage } from '@/pages/dashboard/UpcomingActivitiesPage'
import { DashboardNotificationsPage } from '@/pages/dashboard/DashboardNotificationsPage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import { analyticsConfigs } from '@/config/analytics'
import { ReportPage } from '@/pages/reports/ReportPage'
import { reportConfigs } from '@/config/reports'

/**
 * Populated by feature modules as real pages are built (master data CRUD,
 * transactions, dashboard/analytics/reports). Any nav path without an entry
 * here falls back to ComingSoonPage so the full nav is always clickable.
 */
export const pageOverrides: Record<string, ComponentType> = {
  // Dashboard
  '/dashboard': ExecutiveDashboardPage,
  '/dashboard/fleet-overview': FleetOverviewPage,
  '/dashboard/tyre-health': TyreHealthPage,
  '/dashboard/tyre-lifecycle': TyreLifecyclePage,
  '/dashboard/cost-analysis': CostAnalysisPage,
  '/dashboard/upcoming-activities': UpcomingActivitiesPage,
  '/dashboard/notifications': DashboardNotificationsPage,

  '/master-data/tyres': TyresPage,
  '/settings/users': UsersPage,
  '/settings/roles': RolesPage,
  '/settings/company-profile': CompanyProfilePage,
  '/settings/notifications': NotificationsPage,
  '/settings/barcode-rfid-config': BarcodeConfigPage,
  '/settings/audit-log': AuditLogPage,
  '/settings/system-configuration': SystemConfigurationPage,
  '/settings/approval-workflows': () => <CrudPage config={approvalWorkflowConfig} />,

  // Tyre Installation — the Interactive Axle View is the tool for all four.
  '/transactions/axle-view': AxleViewPage,
  '/transactions/install-tyre': AxleViewPage,
  '/transactions/remove-tyre': AxleViewPage,
  '/transactions/rotation': AxleViewPage,
  '/transactions/change-position': AxleViewPage,

  // Procurement
  '/transactions/purchase-orders': PurchaseOrdersPage,
  '/transactions/goods-receipts': GoodsReceiptsPage,
  '/transactions/initial-stock-entries': () => (
    <CreateListPage config={initialStockEntryConfig} permission="transaction.procurement.manage" />
  ),

  // Warehouse
  '/transactions/stock-inventory': StockInventoryPage,
  '/transactions/stock-movements': StockMovementsPage,
  '/transactions/stock-transfers': StockTransfersPage,
  '/transactions/stock-adjustments': () => (
    <CreateListPage config={stockAdjustmentConfig} permission="transaction.warehouse.manage" />
  ),
  '/transactions/barcode-rfid': BarcodeRfidPage,

  // Tyre Inspection
  '/transactions/inspections/daily': () => (
    <CreateListPage config={dailyInspectionConfig} permission="transaction.inspection.manage" fixedValues={{ type: 'daily' }} extraParams={{ type: 'daily' }} />
  ),
  '/transactions/inspections/periodic': () => (
    <CreateListPage config={periodicInspectionConfig} permission="transaction.inspection.manage" fixedValues={{ type: 'periodic' }} extraParams={{ type: 'periodic' }} />
  ),
  '/transactions/inspections/pressure': () => (
    <CreateListPage config={pressureCheckConfig} permission="transaction.inspection.manage" fixedValues={{ type: 'pressure' }} extraParams={{ type: 'pressure' }} />
  ),
  '/transactions/inspections/tread': () => (
    <CreateListPage config={treadDepthConfig} permission="transaction.inspection.manage" fixedValues={{ type: 'tread' }} extraParams={{ type: 'tread' }} />
  ),
  '/transactions/inspections/damage': () => (
    <CreateListPage config={damageInspectionConfig} permission="transaction.inspection.manage" fixedValues={{ type: 'damage' }} extraParams={{ type: 'damage' }} />
  ),

  // Maintenance
  '/transactions/repairs': () => <CreateListPage config={repairConfig} permission="transaction.maintenance.manage" />,
  '/transactions/retreads': () => <CreateListPage config={retreadConfig} permission="transaction.maintenance.manage" />,
  '/transactions/warranty-claims': () => <CreateListPage config={warrantyClaimConfig} permission="transaction.maintenance.manage" />,

  // Lifecycle
  '/transactions/tyre-history': TyreHistoryPage,
  '/transactions/lifecycle-timeline': LifecycleTimelinePage,
  '/transactions/movement-history': () => <StockMovementsPage title="Movement History" />,

  // Disposal
  '/transactions/scraps': () => <CreateListPage config={scrapConfig} permission="transaction.disposal.manage" />,
  '/transactions/lost-tyres': () => <CreateListPage config={lostTyreConfig} permission="transaction.disposal.manage" />,
}

for (const [path, config] of Object.entries(masterDataEntityConfigs)) {
  pageOverrides[path] = () => <CrudPage config={config} />
}

for (const [path, config] of Object.entries(analyticsConfigs)) {
  pageOverrides[path] = () => <AnalyticsPage config={config} />
}

for (const [path, config] of Object.entries(reportConfigs)) {
  pageOverrides[path] = () => <ReportPage config={config} />
}

function resolveElement(path: string, label: string) {
  const Override = pageOverrides[path]
  return Override ? <Override /> : <ComingSoonPage title={label} />
}

function buildNavRoutes() {
  return flattenNav().map((leaf) => {
    const element = resolveElement(leaf.path, leaf.label)

    if (leaf.permission) {
      return {
        path: leaf.path.slice(1),
        element: <RequirePermission permission={leaf.permission} />,
        children: [{ index: true, element }],
      }
    }

    return { path: leaf.path.slice(1), element }
  })
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <Navigate to="/dashboard" replace /> }, ...buildNavRoutes()],
      },
    ],
  },
])

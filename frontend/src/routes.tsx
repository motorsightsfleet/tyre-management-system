import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ComponentType } from 'react'

import { flattenNav } from '@/config/nav'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth, RequirePermission } from '@/components/layout/RequireAuth'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { CrudPage } from '@/components/data/CrudPage'
import { masterDataEntityConfigs } from '@/config/entities'
import { approvalWorkflowConfig } from '@/config/entities/settings'
import { TyresPage } from '@/pages/master-data/TyresPage'
import { UsersPage } from '@/pages/settings/UsersPage'
import { RolesPage } from '@/pages/settings/RolesPage'
import { CompanyProfilePage } from '@/pages/settings/CompanyProfilePage'
import { NotificationsPage } from '@/pages/settings/NotificationsPage'
import { BarcodeConfigPage } from '@/pages/settings/BarcodeConfigPage'
import { AuditLogPage } from '@/pages/settings/AuditLogPage'
import { SystemConfigurationPage } from '@/pages/settings/SystemConfigurationPage'

/**
 * Populated by feature modules as real pages are built (master data CRUD,
 * transactions, dashboard/analytics/reports). Any nav path without an entry
 * here falls back to ComingSoonPage so the full nav is always clickable.
 */
export const pageOverrides: Record<string, ComponentType> = {
  '/master-data/tyres': TyresPage,
  '/settings/users': UsersPage,
  '/settings/roles': RolesPage,
  '/settings/company-profile': CompanyProfilePage,
  '/settings/notifications': NotificationsPage,
  '/settings/barcode-rfid-config': BarcodeConfigPage,
  '/settings/audit-log': AuditLogPage,
  '/settings/system-configuration': SystemConfigurationPage,
  '/settings/approval-workflows': () => <CrudPage config={approvalWorkflowConfig} />,
}

for (const [path, config] of Object.entries(masterDataEntityConfigs)) {
  pageOverrides[path] = () => <CrudPage config={config} />
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

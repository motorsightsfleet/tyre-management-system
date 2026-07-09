import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ComponentType } from 'react'

import { flattenNav } from '@/config/nav'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth, RequirePermission } from '@/components/layout/RequireAuth'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'

/**
 * Populated by feature modules as real pages are built (master data CRUD,
 * transactions, dashboard/analytics/reports). Any nav path without an entry
 * here falls back to ComingSoonPage so the full nav is always clickable.
 */
export const pageOverrides: Record<string, ComponentType> = {}

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

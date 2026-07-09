import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useAuthStore } from '@/stores/auth-store'

export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <div className="flex h-svh w-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function RequirePermission({ permission }: { permission: string | string[] }) {
  const hasPermission = useAuthStore((s) => s.hasPermission)

  if (!hasPermission(permission)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-lg font-semibold">Access restricted</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          You don't have permission to view this page. Contact your administrator if you believe this is a mistake.
        </p>
      </div>
    )
  }

  return <Outlet />
}

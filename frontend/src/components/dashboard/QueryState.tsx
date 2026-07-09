import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface QueryStateProps {
  isLoading: boolean
  isError: boolean
  children: ReactNode
}

export function QueryState({ isLoading, isError, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-destructive flex h-64 flex-col items-center justify-center gap-2 text-sm">
        <AlertTriangle className="size-5" />
        Failed to load data. Please try again.
      </div>
    )
  }

  return <>{children}</>
}

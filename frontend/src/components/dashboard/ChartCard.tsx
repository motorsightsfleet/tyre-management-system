import type { ReactNode } from 'react'
import { BarChart3 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ChartCardProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  isEmpty?: boolean
  emptyLabel?: string
  children: ReactNode
}

export function ChartCard({ title, description, action, className, isEmpty, emptyLabel = 'No data available yet', children }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-sm">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="h-72 pb-4">
        {isEmpty ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-sm">
            <BarChart3 className="size-5" />
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

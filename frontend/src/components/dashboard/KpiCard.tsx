import type { LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  hint?: string
  tone?: 'default' | 'success' | 'warning' | 'destructive'
}

const TONE_CLASS: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

export function KpiCard({ label, value, icon: Icon, hint, tone = 'default' }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
          <p className={cn('text-2xl font-semibold break-words', TONE_CLASS[tone])}>{value}</p>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
        {Icon && (
          <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon className="text-muted-foreground size-4.5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

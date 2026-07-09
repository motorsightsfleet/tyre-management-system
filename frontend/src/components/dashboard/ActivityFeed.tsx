import { AlertTriangle, Ban, ClipboardCheck, RefreshCw, ShoppingCart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ActivityItem {
  type: 'replacement' | 'rotation' | 'inspection' | 'purchase_order'
  severity: 'high' | 'medium' | 'low'
  title: string
  subtitle: string
  date: string | null
}

const TYPE_ICON: Record<ActivityItem['type'], LucideIcon> = {
  replacement: Ban,
  rotation: RefreshCw,
  inspection: ClipboardCheck,
  purchase_order: ShoppingCart,
}

const SEVERITY_VARIANT: Record<ActivityItem['severity'], 'destructive' | 'warning' | 'secondary'> = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
}

const SEVERITY_LABEL: Record<ActivityItem['severity'], string> = {
  high: 'Urgent',
  medium: 'Due Soon',
  low: 'Info',
}

export function activityKey(item: ActivityItem, index: number): string {
  return `${item.type}:${item.title}:${index}`
}

export function ActivityRow({ item, unread }: { item: ActivityItem; unread?: boolean }) {
  const Icon = TYPE_ICON[item.type] ?? AlertTriangle

  return (
    <div className={cn('flex items-start gap-3 py-3', unread && 'bg-accent/40 -mx-3 rounded-md px-3')}>
      <div className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', unread ? 'bg-primary/10' : 'bg-muted')}>
        <Icon className="size-4" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{item.title}</p>
          {unread && <span className="bg-primary size-1.5 rounded-full" />}
        </div>
        <p className="text-muted-foreground text-xs">{item.subtitle}</p>
      </div>
      <Badge variant={SEVERITY_VARIANT[item.severity]}>{SEVERITY_LABEL[item.severity]}</Badge>
    </div>
  )
}

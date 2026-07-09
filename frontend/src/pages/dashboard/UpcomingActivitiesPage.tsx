import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/KpiCard'
import { QueryState } from '@/components/dashboard/QueryState'
import { ActivityRow, activityKey, type ActivityItem } from '@/components/dashboard/ActivityFeed'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApiQuery } from '@/hooks/use-crud'
import { cn } from '@/lib/utils'

const FILTERS: { value: ActivityItem['severity'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'Urgent' },
  { value: 'medium', label: 'Due Soon' },
  { value: 'low', label: 'Info' },
]

export function UpcomingActivitiesPage() {
  const { data, isLoading, isError } = useApiQuery<ActivityItem[]>('/dashboard/upcoming-activities')
  const [filter, setFilter] = useState<ActivityItem['severity'] | 'all'>('all')

  const items = (data ?? []).filter((item) => filter === 'all' || item.severity === filter)
  const counts = {
    high: (data ?? []).filter((i) => i.severity === 'high').length,
    medium: (data ?? []).filter((i) => i.severity === 'medium').length,
    low: (data ?? []).filter((i) => i.severity === 'low').length,
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Upcoming Activities</h1>
        <p className="text-muted-foreground text-sm">Replacements, rotations, inspections, and orders that need action.</p>
      </div>

      <QueryState isLoading={isLoading} isError={isError}>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Urgent" value={counts.high} icon={AlertTriangle} tone="destructive" />
          <KpiCard label="Due Soon" value={counts.medium} tone="warning" />
          <KpiCard label="Informational" value={counts.low} />
        </div>

        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'default' : 'outline'}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className={cn('divide-y', items.length === 0 && 'py-8')}>
            {items.length === 0 && <p className="text-muted-foreground text-center text-sm">Nothing to show here.</p>}
            {items.map((item, idx) => (
              <ActivityRow key={activityKey(item, idx)} item={item} />
            ))}
          </CardContent>
        </Card>
      </QueryState>
    </div>
  )
}

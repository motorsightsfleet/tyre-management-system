import { useEffect, useState } from 'react'
import { BellOff } from 'lucide-react'

import { QueryState } from '@/components/dashboard/QueryState'
import { ActivityRow, activityKey, type ActivityItem } from '@/components/dashboard/ActivityFeed'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApiQuery } from '@/hooks/use-crud'

const READ_STORAGE_KEY = 'tms.notifications.read'

function loadRead(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function saveRead(read: Set<string>) {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...read]))
}

export function DashboardNotificationsPage() {
  const { data, isLoading, isError } = useApiQuery<ActivityItem[]>('/dashboard/upcoming-activities')
  const [read, setRead] = useState<Set<string>>(() => loadRead())

  useEffect(() => saveRead(read), [read])

  const items = data ?? []
  const unreadCount = items.filter((item, idx) => !read.has(activityKey(item, idx))).length

  function markAllRead() {
    setRead(new Set(items.map((item, idx) => activityKey(item, idx))))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground text-sm">System-generated alerts from fleet and tyre activity.</p>
      </div>

      <QueryState isLoading={isLoading} isError={isError}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</CardTitle>
            <CardDescription>{items.length} total notifications</CardDescription>
            {unreadCount > 0 && (
              <CardAction>
                <Button size="sm" variant="outline" onClick={markAllRead}>
                  Mark all as read
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="divide-y">
            {items.length === 0 && (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
                <BellOff className="size-5" />
                No notifications right now.
              </div>
            )}
            {items.map((item, idx) => {
              const key = activityKey(item, idx)
              return (
                <button
                  key={key}
                  type="button"
                  className="block w-full text-left"
                  onClick={() => setRead((prev) => new Set(prev).add(key))}
                >
                  <ActivityRow item={item} unread={!read.has(key)} />
                </button>
              )
            })}
          </CardContent>
        </Card>
      </QueryState>
    </div>
  )
}

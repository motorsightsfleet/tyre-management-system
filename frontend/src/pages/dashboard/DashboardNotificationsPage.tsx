import { BellOff } from 'lucide-react'

import { QueryState } from '@/components/dashboard/QueryState'
import { ActivityRow, activityKey } from '@/components/dashboard/ActivityFeed'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/use-notifications'

export function DashboardNotificationsPage() {
  const { items, isLoading, read, unreadCount, markRead, markAllRead } = useNotifications()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground text-sm">System-generated alerts from fleet and tyre activity.</p>
      </div>

      <QueryState isLoading={isLoading} isError={false}>
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
                <button key={key} type="button" className="block w-full text-left" onClick={() => markRead(key)}>
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

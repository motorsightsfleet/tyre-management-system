import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { extractError } from '@/hooks/use-crud'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

const EVENT_TYPES = [
  { key: 'inspection_due', label: 'Inspection Due' },
  { key: 'rotation_due', label: 'Rotation Due' },
  { key: 'low_stock', label: 'Low Warehouse Stock' },
  { key: 'purchase_order_approval', label: 'Purchase Order Approval' },
  { key: 'scrap_approval', label: 'Scrap Approval' },
  { key: 'warranty_claim_update', label: 'Warranty Claim Update' },
]

interface Preference {
  event_type: string
  channel: string
  enabled: boolean
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<Preference[]>({
    queryKey: ['settings/notification-preferences'],
    queryFn: async () => (await apiClient.get('/settings/notification-preferences')).data.data,
  })

  const [state, setState] = useState<Record<string, { app: boolean; email: boolean }>>({})

  useEffect(() => {
    const initial: Record<string, { app: boolean; email: boolean }> = {}
    for (const evt of EVENT_TYPES) {
      initial[evt.key] = { app: true, email: false }
    }
    for (const pref of data ?? []) {
      initial[pref.event_type] = { ...initial[pref.event_type], [pref.channel]: pref.enabled }
    }
    setState(initial)
  }, [data])

  const mutation = useMutation({
    mutationFn: async () => {
      const preferences: Preference[] = []
      for (const [eventType, channels] of Object.entries(state)) {
        preferences.push({ event_type: eventType, channel: 'app', enabled: channels.app })
        preferences.push({ event_type: eventType, channel: 'email', enabled: channels.email })
      }
      return (await apiClient.put('/settings/notification-preferences', { preferences })).data
    },
    onSuccess: () => {
      toast.success('Notification preferences saved')
      queryClient.invalidateQueries({ queryKey: ['settings/notification-preferences'] })
    },
    onError: (error) => toast.error(extractError(error)),
  })

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Notification Preferences</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Choose how you're notified for each event type.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-muted-foreground grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-medium">
            <span />
            <span className="text-center">In-App</span>
            <span className="text-center">Email</span>
          </div>
          {EVENT_TYPES.map((evt) => (
            <div key={evt.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
              <span className="text-sm">{evt.label}</span>
              <Switch
                checked={state[evt.key]?.app ?? false}
                onCheckedChange={(checked) => setState((s) => ({ ...s, [evt.key]: { ...s[evt.key], app: checked } }))}
              />
              <Switch
                checked={state[evt.key]?.email ?? false}
                onCheckedChange={(checked) => setState((s) => ({ ...s, [evt.key]: { ...s[evt.key], email: checked } }))}
              />
            </div>
          ))}
          <div>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

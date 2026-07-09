import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCrudAll } from '@/hooks/use-crud'
import { apiClient } from '@/lib/api-client'

interface TimelineEvent {
  id: number
  event_type: string
  event_date: string
  user: string | null
  notes: string | null
  reference: Record<string, unknown> | null
}

export function LifecycleTimelinePage() {
  const [tyreId, setTyreId] = useState<string>('')

  const { data: tyres } = useCrudAll<{ id: number; serial_number: string }>('master-data/tyres', {})

  const { data: events, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['transactions/tyres', tyreId, 'timeline'],
    queryFn: async () => (await apiClient.get(`/transactions/tyres/${tyreId}/timeline`)).data.data,
    enabled: !!tyreId,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Lifecycle Timeline</h1>
        <p className="text-muted-foreground text-sm">A chronological log of every event recorded against a tyre.</p>
      </div>

      <Card>
        <CardHeader>
          <Select value={tyreId} onValueChange={setTyreId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Select a tyre..." />
            </SelectTrigger>
            <SelectContent>
              {tyres?.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.serial_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {!tyreId && <p className="text-muted-foreground py-8 text-center text-sm">Select a tyre to view its timeline.</p>}
          {tyreId && isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          )}
          {tyreId && events && events.length === 0 && <p className="text-muted-foreground py-8 text-center text-sm">No events recorded yet.</p>}

          <div className="flex flex-col gap-3">
            {events?.map((event) => (
              <div key={event.id} className="flex gap-3 border-l-2 pl-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {event.event_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-muted-foreground text-xs">{new Date(event.event_date).toLocaleString()}</span>
                  </div>
                  {event.user && <p className="text-muted-foreground mt-1 text-xs">by {event.user}</p>}
                  {event.notes && <p className="mt-1 text-sm">{event.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

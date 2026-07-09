import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { extractError } from '@/hooks/use-crud'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface ConfigItem {
  key: string
  value: string | null
  group: string | null
}

export function SystemConfigurationPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<ConfigItem[]>({
    queryKey: ['settings/system-configurations'],
    queryFn: async () => (await apiClient.get('/settings/system-configurations')).data.data,
  })

  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (data) {
      setValues(Object.fromEntries(data.map((c) => [c.key, c.value ?? ''])))
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await apiClient.put('/settings/system-configurations', {
          configs: Object.entries(values).map(([key, value]) => ({ key, value })),
        })
      ).data,
    onSuccess: () => {
      toast.success('System configuration updated')
      queryClient.invalidateQueries({ queryKey: ['settings/system-configurations'] })
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
      <h1 className="text-xl font-semibold">System Configuration</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Fleet-wide defaults</CardTitle>
          <CardDescription>Thresholds and defaults used across dashboards and lifecycle calculations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
            className="flex flex-col gap-4"
          >
            {data?.map((item) => (
              <div key={item.key} className="flex flex-col gap-1.5">
                <Label htmlFor={item.key}>{item.key.replace(/_/g, ' ')}</Label>
                <Input
                  id={item.key}
                  value={values[item.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

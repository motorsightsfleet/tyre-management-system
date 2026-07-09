import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { extractError } from '@/hooks/use-crud'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const schema = z.object({
  code_prefix: z.string().min(1, 'Prefix is required'),
  code_length: z.coerce.number().min(6).max(32),
  symbology: z.string(),
  auto_generate: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function BarcodeConfigPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings/barcode-rfid-config'],
    queryFn: async () => (await apiClient.get('/settings/barcode-rfid-config')).data.data,
  })

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema as never) })

  useEffect(() => {
    if (data) reset(data)
  }, [data, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => (await apiClient.put('/settings/barcode-rfid-config', values)).data,
    onSuccess: () => {
      toast.success('Barcode / RFID configuration updated')
      queryClient.invalidateQueries({ queryKey: ['settings/barcode-rfid-config'] })
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
      <h1 className="text-xl font-semibold">Barcode / RFID Configuration</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Code generation defaults</CardTitle>
          <CardDescription>Used when auto-generating a barcode for a tyre from its detail panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code_prefix">Code Prefix</Label>
              <Input id="code_prefix" {...register('code_prefix')} />
              {errors.code_prefix && <p className="text-destructive text-xs">{errors.code_prefix.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code_length">Code Length</Label>
              <Input id="code_length" type="number" {...register('code_length', { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Symbology</Label>
              <Controller
                control={control}
                name="symbology"
                render={({ field: { value, onChange } }) => (
                  <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code128">Code 128</SelectItem>
                      <SelectItem value="qr">QR Code</SelectItem>
                      <SelectItem value="ean13">EAN-13</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <Controller
              control={control}
              name="auto_generate"
              render={({ field: { value, onChange } }) => (
                <div className="flex items-center gap-2">
                  <Checkbox id="auto_generate" checked={value} onCheckedChange={onChange} />
                  <Label htmlFor="auto_generate" className="font-normal">
                    Auto-generate barcode on tyre creation
                  </Label>
                </div>
              )}
            />
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

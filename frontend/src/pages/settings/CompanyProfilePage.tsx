import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const schema = z.object({
  name: z.string().min(1, 'Company name is required'),
  legal_name: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')).nullable(),
  logo_url: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

export function CompanyProfilePage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings/company-profile'],
    queryFn: async () => (await apiClient.get('/settings/company-profile')).data.data,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (data) reset(data)
  }, [data, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => (await apiClient.put('/settings/company-profile', values)).data,
    onSuccess: () => {
      toast.success('Company profile updated')
      queryClient.invalidateQueries({ queryKey: ['settings/company-profile'] })
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
      <h1 className="text-xl font-semibold">Company Profile</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Organization details</CardTitle>
          <CardDescription>Shown on reports, exports, and the application header.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="legal_name">Legal Name</Label>
              <Input id="legal_name" {...register('legal_name')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input id="tax_id" {...register('tax_id')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...register('email')} />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={3} {...register('address')} />
            </div>
            <div className="sm:col-span-2">
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

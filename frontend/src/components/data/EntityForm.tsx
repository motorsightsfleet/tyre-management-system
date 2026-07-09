import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

import { useCrudAll } from '@/hooks/use-crud'
import type { EntityConfig, EntityField, SelectOption } from '@/types/entity-config'
import { cn } from '@/lib/utils'

function FieldOptionsSelect({
  field,
  value,
  onChange,
}: {
  field: EntityField
  value: unknown
  onChange: (value: string) => void
}) {
  const { data: options } = useCrudAll<Record<string, unknown>>(field.optionsResource ?? '', {
    status: 'active',
  })

  const dynamicOptions: SelectOption[] = (options ?? []).map((o) => ({
    value: o[field.optionValueKey ?? 'id'] as string | number,
    label: String(o[field.optionLabelKey ?? 'name'] ?? o[field.optionLabelKey ?? 'code']),
  }))

  const allOptions = field.options ?? dynamicOptions

  return (
    <Select value={value != null ? String(value) : undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {allOptions.map((opt) => (
          <SelectItem key={opt.value} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

interface EntityFormProps {
  config: EntityConfig
  defaultValues?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function EntityForm({ config, defaultValues, onSubmit, onCancel, isSubmitting }: EntityFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(config.schema as never),
    defaultValues: defaultValues ?? { status: 'active' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {config.fields.map((field) => {
          const error = errors[field.name]?.message as string | undefined
          const wrapperClass = cn(field.colSpan === 2 || field.type === 'textarea' ? 'sm:col-span-2' : '')

          return (
            <div key={field.name} className={cn('flex flex-col gap-1.5', wrapperClass)}>
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>

              {field.type === 'text' && (
                <Input id={field.name} placeholder={field.placeholder} {...register(field.name)} />
              )}

              {field.type === 'number' && (
                <Input
                  id={field.name}
                  type="number"
                  step="any"
                  placeholder={field.placeholder}
                  {...register(field.name, { valueAsNumber: true })}
                />
              )}

              {field.type === 'date' && <Input id={field.name} type="date" {...register(field.name)} />}

              {field.type === 'textarea' && (
                <Textarea id={field.name} placeholder={field.placeholder} rows={3} {...register(field.name)} />
              )}

              {field.type === 'checkbox' && (
                <Controller
                  control={control}
                  name={field.name}
                  render={({ field: { value, onChange } }) => (
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox id={field.name} checked={!!value} onCheckedChange={onChange} />
                      <span className="text-muted-foreground text-sm">{field.placeholder ?? field.label}</span>
                    </div>
                  )}
                />
              )}

              {field.type === 'status' && (
                <Controller
                  control={control}
                  name={field.name}
                  render={({ field: { value, onChange } }) => (
                    <Select value={value != null ? String(value) : 'active'} onValueChange={onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}

              {field.type === 'select' && (
                <Controller
                  control={control}
                  name={field.name}
                  render={({ field: { value, onChange } }) => (
                    <FieldOptionsSelect field={field} value={value} onChange={onChange} />
                  )}
                />
              )}

              {field.description && <p className="text-muted-foreground text-xs">{field.description}</p>}
              {error && <p className="text-destructive text-xs">{error}</p>}
            </div>
          )
        })}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}

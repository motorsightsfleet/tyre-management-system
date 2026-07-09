import type { ReactNode } from 'react'
import type { z } from 'zod'

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'status' | 'date' | 'checkbox'

export interface SelectOption {
  value: string | number
  label: string
}

export interface EntityField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  /** Fetch options dynamically from this API resource (e.g. "master-data/tyre-brands") */
  optionsResource?: string
  optionLabelKey?: string
  optionValueKey?: string
  /** Extra query params for optionsResource; defaults to { status: 'active' } */
  optionsParams?: Record<string, string>
  optionLabelFn?: (row: Record<string, unknown>) => string
  colSpan?: 1 | 2
  description?: string
}

export interface ColumnDef<T = Record<string, unknown>> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

export interface EntityConfig<T = Record<string, unknown>> {
  key: string
  title: string
  description?: string
  resource: string
  columns: ColumnDef<T>[]
  fields: EntityField[]
  schema: z.ZodType
  searchPlaceholder?: string
  hasStatus?: boolean
}

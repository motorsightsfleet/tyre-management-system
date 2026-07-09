import { z } from 'zod'
import type { EntityConfig, EntityField } from '@/types/entity-config'

function tyreSelectField(): EntityField {
  return {
    name: 'tyre_id',
    label: 'Tyre',
    type: 'select',
    required: true,
    optionsResource: 'master-data/tyres',
    optionsParams: { status: 'installed' },
    optionLabelFn: (row) => `${row.serial_number} — ${(row.current_vehicle as { code?: string })?.code ?? 'unassigned'}`,
  }
}

const baseColumns = [
  { key: 'tyre', header: 'Tyre', render: (row: Record<string, unknown>) => (row.tyre as { serial_number?: string })?.serial_number ?? '—' },
  { key: 'vehicle', header: 'Vehicle', render: (row: Record<string, unknown>) => (row.vehicle as { code?: string })?.code ?? '—' },
  { key: 'tread_depth_mm', header: 'Tread (mm)' },
  { key: 'pressure_psi', header: 'Pressure (psi)' },
  { key: 'inspected_at', header: 'When', render: (row: Record<string, unknown>) => new Date(String(row.inspected_at)).toLocaleString() },
]

function inspectionConfig(type: string, title: string, extraFields: EntityField[]): EntityConfig {
  return {
    key: `inspections-${type}`,
    title,
    resource: 'transactions/inspections',
    schema: z.object({
      tyre_id: z.coerce.number({ message: 'Tyre is required' }),
      type: z.literal(type),
      tread_depth_mm: z.coerce.number().optional().nullable(),
      pressure_psi: z.coerce.number().optional().nullable(),
      temperature_c: z.coerce.number().optional().nullable(),
      damage_type_id: z.coerce.number().optional().nullable(),
      failure_code_id: z.coerce.number().optional().nullable(),
      notes: z.string().optional().nullable(),
    }),
    columns: baseColumns,
    fields: [tyreSelectField(), ...extraFields, { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 }],
  }
}

export const dailyInspectionConfig = inspectionConfig('daily', 'Daily Inspection', [
  { name: 'tread_depth_mm', label: 'Tread Depth (mm)', type: 'number' },
  { name: 'pressure_psi', label: 'Pressure (psi)', type: 'number' },
])

export const periodicInspectionConfig = inspectionConfig('periodic', 'Periodic Inspection', [
  { name: 'tread_depth_mm', label: 'Tread Depth (mm)', type: 'number' },
  { name: 'pressure_psi', label: 'Pressure (psi)', type: 'number' },
  { name: 'temperature_c', label: 'Temperature (°C)', type: 'number' },
])

export const pressureCheckConfig = inspectionConfig('pressure', 'Pressure Check', [
  { name: 'pressure_psi', label: 'Pressure (psi)', type: 'number', required: true },
])

export const treadDepthConfig = inspectionConfig('tread', 'Tread Depth', [
  { name: 'tread_depth_mm', label: 'Tread Depth (mm)', type: 'number', required: true },
])

export const damageInspectionConfig = inspectionConfig('damage', 'Damage Inspection', [
  { name: 'damage_type_id', label: 'Damage Type', type: 'select', optionsResource: 'master-data/damage-types' },
  { name: 'failure_code_id', label: 'Failure Code', type: 'select', optionsResource: 'master-data/failure-codes' },
])

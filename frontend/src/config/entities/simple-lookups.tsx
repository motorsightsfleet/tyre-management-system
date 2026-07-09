import { z } from 'zod'
import type { EntityConfig } from '@/types/entity-config'

const simpleLookupSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  status: z.string().default('active'),
})

function statusBadgeColumn() {
  return {
    key: 'status',
    header: 'Status',
    render: (row: Record<string, unknown>) => (
      <span
        className={
          row.status === 'active'
            ? 'text-success inline-flex items-center gap-1 text-xs font-medium'
            : 'text-muted-foreground inline-flex items-center gap-1 text-xs font-medium'
        }
      >
        <span className={`size-1.5 rounded-full ${row.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
        {row.status === 'active' ? 'Active' : 'Inactive'}
      </span>
    ),
  }
}

function simpleLookupConfig(key: string, title: string, resource: string): EntityConfig {
  return {
    key,
    title,
    resource,
    schema: simpleLookupSchema,
    columns: [
      { key: 'code', header: 'Code' },
      { key: 'name', header: 'Name' },
      { key: 'description', header: 'Description' },
      statusBadgeColumn(),
    ],
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
      { name: 'status', label: 'Status', type: 'status' },
    ],
  }
}

export const vehicleCategoryConfig = simpleLookupConfig('vehicle-categories', 'Vehicle Category', 'master-data/vehicle-categories')
export const tyrePositionConfig = simpleLookupConfig('tyre-positions', 'Tyre Position', 'master-data/tyre-positions')
export const tyreTypeConfig = simpleLookupConfig('tyre-types', 'Tyre Type', 'master-data/tyre-types')
export const failureCodeConfig = simpleLookupConfig('failure-codes', 'Failure Code', 'master-data/failure-codes')
export const damageTypeConfig = simpleLookupConfig('damage-types', 'Damage Type', 'master-data/damage-types')
export const removalReasonConfig = simpleLookupConfig('removal-reasons', 'Removal Reason', 'master-data/removal-reasons')
export const scrapReasonConfig = simpleLookupConfig('scrap-reasons', 'Scrap Reason', 'master-data/scrap-reasons')
export const repairTypeConfig = simpleLookupConfig('repair-types', 'Repair Type', 'master-data/repair-types')

export { statusBadgeColumn, simpleLookupSchema }

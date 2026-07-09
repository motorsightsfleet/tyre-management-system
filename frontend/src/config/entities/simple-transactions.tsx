import { z } from 'zod'
import type { EntityConfig, EntityField } from '@/types/entity-config'
import { Badge } from '@/components/ui/badge'

function tyreSelectField(label = 'Tyre'): EntityField {
  return {
    name: 'tyre_id',
    label,
    type: 'select',
    required: true,
    optionsResource: 'master-data/tyres',
    optionsParams: {},
    optionLabelFn: (row) => `${row.serial_number} (${String(row.status).replace('_', ' ')})`,
  }
}

const tyreColumn = { key: 'tyre', header: 'Tyre', render: (row: Record<string, unknown>) => (row.tyre as { serial_number?: string })?.serial_number ?? '—' }

export const repairConfig: EntityConfig = {
  key: 'repairs',
  title: 'Repair',
  resource: 'transactions/repairs',
  schema: z.object({
    tyre_id: z.coerce.number({ message: 'Tyre is required' }),
    repair_type_id: z.coerce.number({ message: 'Repair type is required' }),
    vendor_id: z.coerce.number().optional().nullable(),
    cost: z.coerce.number().min(0),
    tread_before_mm: z.coerce.number().optional().nullable(),
    tread_after_mm: z.coerce.number().optional().nullable(),
    repair_date: z.string().min(1, 'Repair date is required'),
    notes: z.string().optional().nullable(),
  }),
  columns: [
    tyreColumn,
    { key: 'repair_type', header: 'Type', render: (row) => (row.repair_type as { name?: string })?.name ?? '—' },
    { key: 'vendor', header: 'Vendor', render: (row) => (row.vendor as { name?: string })?.name ?? '—' },
    { key: 'cost', header: 'Cost', render: (row) => `Rp ${Number(row.cost).toLocaleString()}` },
    { key: 'repair_date', header: 'Date' },
  ],
  fields: [
    tyreSelectField(),
    { name: 'repair_type_id', label: 'Repair Type', type: 'select', required: true, optionsResource: 'master-data/repair-types' },
    { name: 'vendor_id', label: 'Vendor (Supplier)', type: 'select', optionsResource: 'master-data/suppliers' },
    { name: 'cost', label: 'Cost', type: 'number', required: true },
    { name: 'tread_before_mm', label: 'Tread Before (mm)', type: 'number' },
    { name: 'tread_after_mm', label: 'Tread After (mm)', type: 'number' },
    { name: 'repair_date', label: 'Repair Date', type: 'date', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
}

export const retreadConfig: EntityConfig = {
  key: 'retreads',
  title: 'Retread',
  resource: 'transactions/retreads',
  schema: z.object({
    tyre_id: z.coerce.number({ message: 'Tyre is required' }),
    retread_vendor_id: z.coerce.number({ message: 'Vendor is required' }),
    cost: z.coerce.number().min(0),
    sent_date: z.string().min(1, 'Sent date is required'),
    received_date: z.string().optional().nullable(),
    warranty_months: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
  columns: [
    tyreColumn,
    { key: 'retread_vendor', header: 'Vendor', render: (row) => (row.retread_vendor as { name?: string })?.name ?? '—' },
    { key: 'cost', header: 'Cost', render: (row) => `Rp ${Number(row.cost).toLocaleString()}` },
    { key: 'sent_date', header: 'Sent' },
    { key: 'received_date', header: 'Received' },
  ],
  fields: [
    tyreSelectField(),
    { name: 'retread_vendor_id', label: 'Retread Vendor', type: 'select', required: true, optionsResource: 'master-data/retread-vendors' },
    { name: 'cost', label: 'Cost', type: 'number', required: true },
    { name: 'sent_date', label: 'Sent Date', type: 'date', required: true },
    { name: 'received_date', label: 'Received Date', type: 'date', description: 'Leave blank if still at the vendor.' },
    { name: 'warranty_months', label: 'Warranty (months)', type: 'number' },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
}

export const warrantyClaimConfig: EntityConfig = {
  key: 'warranty-claims',
  title: 'Warranty Claim',
  resource: 'transactions/warranty-claims',
  schema: z.object({
    tyre_id: z.coerce.number({ message: 'Tyre is required' }),
    supplier_id: z.coerce.number({ message: 'Supplier is required' }),
    failure_code_id: z.coerce.number().optional().nullable(),
    claim_date: z.string().min(1, 'Claim date is required'),
    reason: z.string().min(1, 'Reason is required'),
  }),
  columns: [
    tyreColumn,
    { key: 'supplier', header: 'Supplier', render: (row) => (row.supplier as { name?: string })?.name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.status === 'resolved' ? 'success' : row.status === 'rejected' ? 'destructive' : 'secondary'}>{String(row.status)}</Badge>,
    },
    { key: 'claim_date', header: 'Claim Date' },
  ],
  fields: [
    tyreSelectField(),
    { name: 'supplier_id', label: 'Supplier', type: 'select', required: true, optionsResource: 'master-data/suppliers' },
    { name: 'failure_code_id', label: 'Failure Code', type: 'select', optionsResource: 'master-data/failure-codes' },
    { name: 'claim_date', label: 'Claim Date', type: 'date', required: true },
    { name: 'reason', label: 'Reason', type: 'textarea', required: true, colSpan: 2 },
  ],
}

export const scrapConfig: EntityConfig = {
  key: 'scraps',
  title: 'Scrap Tyre',
  resource: 'transactions/scraps',
  schema: z.object({
    tyre_id: z.coerce.number({ message: 'Tyre is required' }),
    scrap_reason_id: z.coerce.number({ message: 'Reason is required' }),
    scrap_date: z.string().min(1, 'Scrap date is required'),
    final_tread_depth_mm: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
  columns: [
    tyreColumn,
    { key: 'scrap_reason', header: 'Reason', render: (row) => (row.scrap_reason as { name?: string })?.name ?? '—' },
    { key: 'scrap_date', header: 'Date' },
    { key: 'final_tread_depth_mm', header: 'Final Tread (mm)' },
  ],
  fields: [
    tyreSelectField(),
    { name: 'scrap_reason_id', label: 'Scrap Reason', type: 'select', required: true, optionsResource: 'master-data/scrap-reasons' },
    { name: 'scrap_date', label: 'Scrap Date', type: 'date', required: true },
    { name: 'final_tread_depth_mm', label: 'Final Tread Depth (mm)', type: 'number' },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
}

export const lostTyreConfig: EntityConfig = {
  key: 'lost-tyres',
  title: 'Lost Tyre',
  resource: 'transactions/lost-tyres',
  schema: z.object({
    tyre_id: z.coerce.number({ message: 'Tyre is required' }),
    reported_date: z.string().min(1, 'Reported date is required'),
    last_seen_location: z.string().optional().nullable(),
    cost_writeoff: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
  columns: [
    tyreColumn,
    { key: 'reported_date', header: 'Reported' },
    { key: 'last_seen_location', header: 'Last Seen' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.status === 'closed' ? 'secondary' : 'warning'}>{String(row.status)}</Badge>,
    },
  ],
  fields: [
    tyreSelectField(),
    { name: 'reported_date', label: 'Reported Date', type: 'date', required: true },
    { name: 'last_seen_location', label: 'Last Seen Location', type: 'text' },
    { name: 'cost_writeoff', label: 'Cost Write-off', type: 'number' },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
}

export const stockAdjustmentConfig: EntityConfig = {
  key: 'stock-adjustments',
  title: 'Stock Adjustment',
  resource: 'transactions/stock-adjustments',
  schema: z.object({
    tyre_id: z.coerce.number({ message: 'Tyre is required' }),
    warehouse_id: z.coerce.number({ message: 'Warehouse is required' }),
    reason: z.string().min(1, 'Reason is required'),
    adjustment_date: z.string().min(1, 'Adjustment date is required'),
    notes: z.string().optional().nullable(),
  }),
  columns: [
    tyreColumn,
    { key: 'warehouse', header: 'Warehouse', render: (row) => (row.warehouse as { name?: string })?.name ?? '—' },
    { key: 'reason', header: 'Reason' },
    { key: 'adjustment_date', header: 'Date' },
  ],
  fields: [
    tyreSelectField(),
    { name: 'warehouse_id', label: 'Warehouse', type: 'select', required: true, optionsResource: 'master-data/warehouses' },
    { name: 'reason', label: 'Reason', type: 'text', required: true },
    { name: 'adjustment_date', label: 'Adjustment Date', type: 'date', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
}

export const initialStockEntryConfig: EntityConfig = {
  key: 'initial-stock-entries',
  title: 'Initial Stock',
  description: 'Register an existing tyre (opening balance / legacy migration) directly into warehouse stock.',
  resource: 'transactions/initial-stock-entries',
  schema: z.object({
    warehouse_id: z.coerce.number({ message: 'Warehouse is required' }),
    entry_date: z.string().min(1, 'Entry date is required'),
    serial_number: z.string().min(1, 'Serial number is required'),
    barcode_code: z.string().optional().nullable(),
    tyre_brand_id: z.coerce.number({ message: 'Brand is required' }),
    tyre_pattern_id: z.coerce.number().optional().nullable(),
    tyre_size_id: z.coerce.number({ message: 'Size is required' }),
    tyre_type_id: z.coerce.number({ message: 'Type is required' }),
    cost: z.coerce.number().optional().nullable(),
    tread_depth_new_mm: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
  columns: [
    tyreColumn,
    { key: 'warehouse', header: 'Warehouse', render: (row) => (row.warehouse as { name?: string })?.name ?? '—' },
    { key: 'entry_date', header: 'Entry Date' },
  ],
  fields: [
    { name: 'serial_number', label: 'Serial Number', type: 'text', required: true },
    { name: 'barcode_code', label: 'Barcode Code', type: 'text' },
    { name: 'tyre_brand_id', label: 'Brand', type: 'select', required: true, optionsResource: 'master-data/tyre-brands' },
    { name: 'tyre_pattern_id', label: 'Pattern', type: 'select', optionsResource: 'master-data/tyre-patterns' },
    { name: 'tyre_size_id', label: 'Size', type: 'select', required: true, optionsResource: 'master-data/tyre-sizes' },
    { name: 'tyre_type_id', label: 'Type', type: 'select', required: true, optionsResource: 'master-data/tyre-types' },
    { name: 'warehouse_id', label: 'Warehouse', type: 'select', required: true, optionsResource: 'master-data/warehouses' },
    { name: 'entry_date', label: 'Entry Date', type: 'date', required: true },
    { name: 'cost', label: 'Cost', type: 'number' },
    { name: 'tread_depth_new_mm', label: 'Tread Depth New (mm)', type: 'number' },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
}

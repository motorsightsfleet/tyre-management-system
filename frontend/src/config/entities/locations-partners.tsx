import { z } from 'zod'
import type { EntityConfig } from '@/types/entity-config'
import { statusBadgeColumn } from '@/config/entities/simple-lookups'

const partnerSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  contact_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  status: z.string().default('active'),
})

const partnerFields = [
  { name: 'code', label: 'Code', type: 'text' as const, required: true },
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'contact_name', label: 'Contact Name', type: 'text' as const },
  { name: 'phone', label: 'Phone', type: 'text' as const },
  { name: 'email', label: 'Email', type: 'text' as const },
  { name: 'address', label: 'Address', type: 'textarea' as const, colSpan: 2 as const },
  { name: 'status', label: 'Status', type: 'status' as const },
]

const partnerColumns = [
  { key: 'code', header: 'Code' },
  { key: 'name', header: 'Name' },
  { key: 'contact_name', header: 'Contact' },
  { key: 'phone', header: 'Phone' },
  statusBadgeColumn(),
]

export const supplierConfig: EntityConfig = {
  key: 'suppliers',
  title: 'Supplier',
  resource: 'master-data/suppliers',
  schema: partnerSchema,
  columns: partnerColumns,
  fields: partnerFields,
}

export const retreadVendorConfig: EntityConfig = {
  key: 'retread-vendors',
  title: 'Retread Vendor',
  resource: 'master-data/retread-vendors',
  schema: partnerSchema,
  columns: partnerColumns,
  fields: partnerFields,
}

export const customerConfig: EntityConfig = {
  key: 'customers',
  title: 'Customer',
  resource: 'master-data/customers',
  schema: partnerSchema,
  columns: partnerColumns,
  fields: partnerFields,
}

export const siteConfig: EntityConfig = {
  key: 'sites',
  title: 'Site',
  resource: 'master-data/sites',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    address: z.string().optional().nullable(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'address', header: 'Address' },
    statusBadgeColumn(),
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'textarea', colSpan: 2 },
    { name: 'status', label: 'Status', type: 'status' },
  ],
}

export const warehouseConfig: EntityConfig = {
  key: 'warehouses',
  title: 'Warehouse',
  resource: 'master-data/warehouses',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    site_id: z.coerce.number().optional().nullable(),
    address: z.string().optional().nullable(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'site', header: 'Site', render: (row) => (row.site as { name?: string })?.name ?? '—' },
    statusBadgeColumn(),
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'site_id', label: 'Site', type: 'select', optionsResource: 'master-data/sites' },
    { name: 'address', label: 'Address', type: 'textarea', colSpan: 2 },
    { name: 'status', label: 'Status', type: 'status' },
  ],
}

export const projectConfig: EntityConfig = {
  key: 'projects',
  title: 'Project',
  resource: 'master-data/projects',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    site_id: z.coerce.number().optional().nullable(),
    customer_id: z.coerce.number().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'site', header: 'Site', render: (row) => (row.site as { name?: string })?.name ?? '—' },
    { key: 'customer', header: 'Customer', render: (row) => (row.customer as { name?: string })?.name ?? '—' },
    statusBadgeColumn(),
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'site_id', label: 'Site', type: 'select', optionsResource: 'master-data/sites' },
    { name: 'customer_id', label: 'Customer', type: 'select', optionsResource: 'master-data/customers' },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'status', label: 'Status', type: 'status' },
  ],
}

export const inspectionChecklistConfig: EntityConfig = {
  key: 'inspection-checklists',
  title: 'Inspection Checklist',
  resource: 'master-data/inspection-checklists',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    applies_to: z.string().default('general'),
    description: z.string().optional().nullable(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'applies_to', header: 'Applies To' },
    statusBadgeColumn(),
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'applies_to',
      label: 'Applies To',
      type: 'select',
      required: true,
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'periodic', label: 'Periodic' },
        { value: 'pressure', label: 'Pressure' },
        { value: 'tread', label: 'Tread' },
        { value: 'damage', label: 'Damage' },
        { value: 'general', label: 'General' },
      ],
    },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
    { name: 'status', label: 'Status', type: 'status' },
  ],
}

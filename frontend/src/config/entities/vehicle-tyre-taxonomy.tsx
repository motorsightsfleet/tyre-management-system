import { z } from 'zod'
import type { EntityConfig } from '@/types/entity-config'
import { statusBadgeColumn } from '@/config/entities/simple-lookups'

export const vehicleModelConfig: EntityConfig = {
  key: 'vehicle-models',
  title: 'Vehicle Model',
  resource: 'master-data/vehicle-models',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    vehicle_category_id: z.coerce.number({ message: 'Category is required' }),
    description: z.string().optional().nullable(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'vehicle_category', header: 'Category', render: (row) => (row.vehicle_category as { name?: string })?.name ?? '—' },
    statusBadgeColumn(),
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'vehicle_category_id',
      label: 'Vehicle Category',
      type: 'select',
      required: true,
      optionsResource: 'master-data/vehicle-categories',
    },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
    { name: 'status', label: 'Status', type: 'status' },
  ],
}

export const axleConfigurationConfig: EntityConfig = {
  key: 'axle-configurations',
  title: 'Axle Configuration',
  description: 'Position layouts are seeded and rendered in the Interactive Axle View; edit code/name details here.',
  resource: 'master-data/axle-configurations',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    axle_count: z.coerce.number().min(1).max(10),
    description: z.string().optional().nullable(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'axle_count', header: 'Axles' },
    statusBadgeColumn(),
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'axle_count', label: 'Axle Count', type: 'number', required: true },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
    { name: 'status', label: 'Status', type: 'status' },
  ],
}

export const tyreBrandConfig: EntityConfig = {
  key: 'tyre-brands',
  title: 'Tyre Brand',
  resource: 'master-data/tyre-brands',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    country_of_origin: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'country_of_origin', header: 'Country' },
    statusBadgeColumn(),
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'country_of_origin', label: 'Country of Origin', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
    { name: 'status', label: 'Status', type: 'status' },
  ],
}

export const tyrePatternConfig: EntityConfig = {
  key: 'tyre-patterns',
  title: 'Tyre Pattern',
  resource: 'master-data/tyre-patterns',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    tyre_brand_id: z.coerce.number({ message: 'Brand is required' }),
    application: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'tyre_brand', header: 'Brand', render: (row) => (row.tyre_brand as { name?: string })?.name ?? '—' },
    { key: 'application', header: 'Application' },
    statusBadgeColumn(),
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'tyre_brand_id', label: 'Brand', type: 'select', required: true, optionsResource: 'master-data/tyre-brands' },
    { name: 'application', label: 'Application', type: 'text', placeholder: 'e.g. Mining Haul, Highway' },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
    { name: 'status', label: 'Status', type: 'status' },
  ],
}

export const tyreSizeConfig: EntityConfig = {
  key: 'tyre-sizes',
  title: 'Tyre Size',
  resource: 'master-data/tyre-sizes',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    width_mm: z.coerce.number().optional().nullable(),
    aspect_ratio: z.coerce.number().optional().nullable(),
    rim_diameter: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'width_mm', header: 'Width (mm)' },
    { key: 'aspect_ratio', header: 'Aspect Ratio' },
    { key: 'rim_diameter', header: 'Rim Diameter' },
    statusBadgeColumn(),
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. 295/80R22.5' },
    { name: 'width_mm', label: 'Width (mm)', type: 'number' },
    { name: 'aspect_ratio', label: 'Aspect Ratio', type: 'number' },
    { name: 'rim_diameter', label: 'Rim Diameter', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
    { name: 'status', label: 'Status', type: 'status' },
  ],
}

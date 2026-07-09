import { z } from 'zod'
import type { EntityConfig } from '@/types/entity-config'
import { Badge } from '@/components/ui/badge'

export const vehicleConfig: EntityConfig = {
  key: 'vehicles',
  title: 'Vehicle',
  resource: 'master-data/vehicles',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    plate_number: z.string().optional().nullable(),
    vehicle_model_id: z.coerce.number({ message: 'Model is required' }),
    vehicle_category_id: z.coerce.number({ message: 'Category is required' }),
    axle_configuration_id: z.coerce.number({ message: 'Axle configuration is required' }),
    site_id: z.coerce.number().optional().nullable(),
    project_id: z.coerce.number().optional().nullable(),
    customer_id: z.coerce.number().optional().nullable(),
    odometer_km: z.coerce.number().min(0).optional(),
    engine_hours: z.coerce.number().min(0).optional(),
    status: z.string().default('active'),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'plate_number', header: 'Plate' },
    { key: 'vehicle_model', header: 'Model', render: (row) => (row.vehicle_model as { name?: string })?.name ?? '—' },
    { key: 'site', header: 'Site', render: (row) => (row.site as { name?: string })?.name ?? '—' },
    { key: 'odometer_km', header: 'Odometer (km)' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : row.status === 'maintenance' ? 'warning' : 'secondary'}>
          {String(row.status)}
        </Badge>
      ),
    },
  ],
  fields: [
    { name: 'code', label: 'Vehicle Code', type: 'text', required: true },
    { name: 'plate_number', label: 'Plate Number', type: 'text' },
    { name: 'vehicle_category_id', label: 'Category', type: 'select', required: true, optionsResource: 'master-data/vehicle-categories' },
    { name: 'vehicle_model_id', label: 'Model', type: 'select', required: true, optionsResource: 'master-data/vehicle-models' },
    { name: 'axle_configuration_id', label: 'Axle Configuration', type: 'select', required: true, optionsResource: 'master-data/axle-configurations' },
    { name: 'site_id', label: 'Site', type: 'select', optionsResource: 'master-data/sites' },
    { name: 'project_id', label: 'Project', type: 'select', optionsResource: 'master-data/projects' },
    { name: 'customer_id', label: 'Customer', type: 'select', optionsResource: 'master-data/customers' },
    { name: 'odometer_km', label: 'Odometer (km)', type: 'number' },
    { name: 'engine_hours', label: 'Engine Hours', type: 'number' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ],
}

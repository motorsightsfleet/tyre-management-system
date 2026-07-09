import { z } from 'zod'
import type { EntityConfig } from '@/types/entity-config'
import { Badge } from '@/components/ui/badge'

export const approvalWorkflowConfig: EntityConfig = {
  key: 'approval-workflows',
  title: 'Approval Workflow',
  description: 'Steps are configured via seed/API; this manages the workflow record itself.',
  resource: 'settings/approval-workflows',
  schema: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    module: z.string().min(1, 'Module is required'),
    description: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
  }),
  columns: [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'module', header: 'Module' },
    { key: 'steps', header: 'Steps', render: (row) => (Array.isArray(row.steps) ? row.steps.length : 0) },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => <Badge variant={row.is_active ? 'success' : 'secondary'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
  ],
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'module', label: 'Module', type: 'text', required: true, placeholder: 'e.g. procurement, disposal' },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
    { name: 'is_active', label: 'Active', type: 'checkbox', placeholder: 'Workflow is active' },
  ],
}
